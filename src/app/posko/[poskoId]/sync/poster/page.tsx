"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import {
  PosterGenerator,
  PosterLayoutSpec,
  ParsedPosterCell,
} from "@/core/codecs/poster-generator";
import {
  packManifestV4,
  unpackManifestV4,
  compressManifestV4,
  decompressManifestV4,
  DisasterManifestV4,
  vulnerabilitiesToBitmask,
  bitmaskToVulnerabilities,
} from "@/core/codecs/bitpacker-v4";
import { QRCodeSVG } from "@/shared/ui/qr-code-svg";
import { QRCameraScanner } from "@/features/auth/components/qr-camera-scanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { EmptyState } from "@/shared/ui/empty-state";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { asRefugeeId, asPoskoId, asEventId } from "@/core/shared/branded-types";
import { RefugeeAggregate, type RefugeeEventProps } from "@/core/domain/refugees/refugee.aggregate";
import { type VulnerabilityCategory, type TriageCategory } from "@/shared/types";

export const PARITY_POSTER_PAGE_CONSTANTS = {
  MAX_CHUNK_BYTES: 200,
  DEFAULT_DATA_PARTS_FALLBACK: 3,
  SIMULATED_CELL_LOAD_INTERVAL_MS: 300,
  POSTER_QR_SIZE: 150,
} as const;

export default function ParityPosterSyncPage() {
  const { session, refugees, inventory, transactions, needsTickets, importRefugeeBatch, importInventoryBatch, importTransactionBatch, importNeedsTicketsBatch } = usePoskoStore();

  const [mode, setMode] = React.useState<"PRINT" | "SCAN">("PRINT");
  const [posterSpec, setPosterSpec] = React.useState<PosterLayoutSpec | null>(null);

  // Scan State
  const [scannedCellsMap, setScannedCellsMap] = React.useState<Map<number, ParsedPosterCell>>(new Map());
  const [recoveredManifest, setRecoveredManifest] = React.useState<DisasterManifestV4 | null>(null);
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState<string | null>(null);

  // Generate dynamic N+1 Parity Poster based on actual posko data
  React.useEffect(() => {
  if (refugees.length === 0 && inventory.length === 0 && transactions.length === 0 && needsTickets.length === 0) {
  setPosterSpec(null);
  return;
  }

  let isMounted = true;

  const buildPosterSpec = async () => {
  try {
  // 1. Build disaster manifest
  const manifestPersons = refugees.map((r) => ({
    id: r.id,
    poskoId: r.postId || session.poskoId,
    fullName: r.fullName,
    nationalId: r.nik || undefined,
    gender: r.gender,
    age: r.age,
    vulnerabilities: vulnerabilitiesToBitmask(r.vulnerabilities),
    urgentNeeds: r.urgentNeeds.map((_, idx) => 0x21 + (idx % 8)),
    domicileOrigin: r.domicileOrigin || undefined,
    shelterLocation: r.shelterLocation || undefined,
    missingKinName: r.missingKinName || undefined,
    triage: (r.triageStatus as "GREEN" | "YELLOW" | "RED" | "BLACK") || "GREEN",
  }));

  const manifestInventory = inventory.map((i) => ({
    itemName: i.itemName,
    category: i.category as "FOOD" | "CLOTHING" | "MEDICAL" | "HYGIENE" | "SHELTER" | "BABY_SUPPLIES",
    currentQuantity: i.currentQuantity,
    unit: i.unit,
  }));

  const manifestTransactions = transactions
    .filter((tx) => !tx.postId || tx.postId === session.poskoId)
    .map((tx) => ({
      id: tx.id,
      itemId: tx.itemId,
      txType: tx.txType,
      quantityChange: tx.quantityChange,
      note: tx.note || undefined,
      officerName: tx.officerName || undefined,
      deviceTimestamp: tx.deviceTimestamp,
    }));

  // Ambil rekam peristiwa / timeline warga dari SQLite
  const container = ServiceContainer.getInstance();
  const eventsRes = await container.refugeeRepo.getAllEvents();
  const allEvents = eventsRes.ok ? eventsRes.value : [];
  const refugeeIdSet = new Set(refugees.map((r) => r.id));
  const poskoEvents = allEvents.filter((ev) => refugeeIdSet.has(ev.refugeeId));
  const manifestEvents = poskoEvents.map((ev) => ({
    id: ev.id,
    refugeeId: ev.refugeeId,
    authorName: ev.authorName,
    authorRole: ev.authorRole,
    eventType: ev.eventType,
    eventPayloadJson: typeof ev.eventPayload === "string" ? ev.eventPayload : JSON.stringify(ev.eventPayload),
    deviceTimestamp: ev.deviceTimestamp,
    logicalSeq: ev.logicalSeq,
  }));

  // Ambil tiket kebutuhan / distribusi bantuan
  const poskoTickets = needsTickets.filter((t) => !t.postId || t.postId === session.poskoId);
  const manifestTickets = poskoTickets.map((t) => ({
    id: t.id,
    refugeeId: t.refugeeId,
    refugeeName: t.refugeeName,
    shelterLocation: t.shelterLocation,
    postId: t.postId,
    itemName: t.itemName,
    quantity: t.quantity,
    unit: t.unit,
    status: t.status,
    urgency: t.urgency,
    createdByUserName: t.createdByUserName,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
  }));

  const manifest: DisasterManifestV4 = {
  poskoId: session.poskoId,
  poskoName: session.poskoName || "Posko Sandya Utama",
  defaultRegionCode: "320101",
  timestamp: Date.now(),
  persons: manifestPersons,
  inventory: manifestInventory,
  transactions: manifestTransactions,
  personIds: refugees.map((r) => r.id),
  events: manifestEvents,
  tickets: manifestTickets,
  };

  // 2. Pack and compress
  const packedBuf = packManifestV4(manifest);
  const compressedBuf = compressManifestV4(packedBuf);

  // 3. Generate dynamic poster layout (target ~200 bytes per QR cell)
  const spec = PosterGenerator.generateDynamicParityPoster({
  poskoName: session.poskoName || "Posko Sandya Utama",
  poskoId: session.poskoId,
  missionName: session.missionName || "Operasi Tanggap Darurat 2026",
  totalRefugees: manifestPersons.length,
  criticalNeedsCount: refugees.filter((r) => r.triageStatus === "RED").length || 0,
  payload: compressedBuf,
  maxChunkBytes: PARITY_POSTER_PAGE_CONSTANTS.MAX_CHUNK_BYTES, // Dynamic chunk threshold
  });

  if (isMounted) {
    setPosterSpec(spec);
  }
  } catch (err) {
  console.error("Gagal membuat spec poster paritas:", err);
  }
  };

  buildPosterSpec();

  return () => {
    isMounted = false;
  };
  }, [refugees, inventory, transactions, needsTickets, session]);

  // Handle incoming scanned QR code
  const handleQrScanned = React.useCallback(
  (qrText: string) => {
  const parsed = PosterGenerator.parsePosterCellQr(qrText);
  if (!parsed) {
  setScanMessage("Format QR tidak dikenali sebagai sel Poster Sandya.");
  return;
  }

  setScannedCellsMap((prev) => {
  const next = new Map(prev);
  const cellKey = parsed.isParity ? parsed.totalDataParts : parsed.partIndex;
  if (!next.has(cellKey)) {
  next.set(cellKey, parsed);
  setScanMessage(
  `Berhasil memindai ${parsed.isParity ? "Kotak PARITAS XOR" : `Kotak DATA ${parsed.partIndex + 1}`}.`
  );
  }
  return next;
  });
  },
  []
  );

  // Check if we have enough parts to reconstruct (N parts out of N+1)
  React.useEffect(() => {
  if (scannedCellsMap.size === 0) return;

  const firstCell = Array.from(scannedCellsMap.values())[0];
  const totalDataParts = firstCell ? firstCell.totalDataParts : PARITY_POSTER_PAGE_CONSTANTS.DEFAULT_DATA_PARTS_FALLBACK;

  if (scannedCellsMap.size >= totalDataParts && !recoveredManifest) {
  setIsRecovering(true);
  (async () => {
  try {
  const cellsArray = Array.from(scannedCellsMap.values());
  const reconstructedBuffer = PosterGenerator.reconstructFromPosterCells(
  cellsArray,
  totalDataParts
  );

  const decompressed = decompressManifestV4(reconstructedBuffer);
  const manifest = unpackManifestV4(decompressed);

  setRecoveredManifest(manifest);
  setIsRecovering(false);
  setScanMessage(
  `Pemulihan Berhasil! 100% data posko (${manifest.persons.length} jiwa) berhasil dipulihkan secara lossless.`
  );

  // Import to store if available
  if (importRefugeeBatch && manifest.persons.length > 0) {
    importRefugeeBatch(
      manifest.persons.map((p) => ({
        id: p.id,
        postId: p.poskoId || manifest.poskoId || session.poskoId,
        fullName: p.fullName,
        nik: p.nationalId || null,
        gender: p.gender,
        age: p.age,
        vulnerabilities: bitmaskToVulnerabilities(p.vulnerabilities),
        urgentNeeds: p.urgentNeeds ? p.urgentNeeds.map((code) => `Kebutuhan #${code}`) : [],
        domicileOrigin: p.domicileOrigin || session.poskoName || "Posko Pengungsian",
        shelterLocation: p.shelterLocation || "Tenda Pengungsian",
        missingKinName: p.missingKinName,
        registeredByUserId: session.userId,
        registeredByUserName: session.userName,
        triageStatus: (p.triage as TriageCategory) || "GREEN",
      }))
    );

    // Simpan warga ke database lokal SQLite posko agar terdaftar di domain repository
    const container = ServiceContainer.getInstance();
    for (const p of manifest.persons) {
      const refId = asRefugeeId(p.id || `REF-${Math.floor(1000 + Math.random() * 9000)}`);
      const refugeePoskoId = asPoskoId(p.poskoId || manifest.poskoId || session.poskoId);
      const agg = RefugeeAggregate.reconstitute({
        id: refId,
        poskoId: refugeePoskoId,
        fullName: p.fullName,
        nationalId: p.nationalId || null,
        gender: p.gender,
        age: p.age,
        domicileOrigin: p.domicileOrigin || null,
        shelterLocation: p.shelterLocation || null,
        missingKinName: p.missingKinName || null,
        currentTriage: (p.triage as TriageCategory) || "GREEN",
        registeredByUserId: session.userId,
        createdAt: Date.now(),
        version: 1,
      }, []);
      await container.refugeeRepo.save(agg);
    }
  }
  
  if (importInventoryBatch && manifest.inventory && manifest.inventory.length > 0) {
    importInventoryBatch(
      manifest.inventory.map((i) => ({
        itemName: i.itemName,
        category: i.category,
        currentQuantity: i.currentQuantity,
        unit: i.unit,
      }))
    );
  }

  if (importTransactionBatch && manifest.transactions && manifest.transactions.length > 0) {
    importTransactionBatch(
      manifest.transactions.map((tx) => ({
        id: tx.id,
        itemId: tx.itemId || "",
        postId: session.poskoId,
        officerId: session.userId,
        officerName: tx.officerName || "Petugas",
        txType: tx.txType,
        quantityChange: tx.quantityChange,
        note: tx.note,
        deviceTimestamp: tx.deviceTimestamp || Date.now(),
      }))
    );
  }

  // Simpan kronologi & rekam peristiwa ke SQLite repository posko
  if (manifest.events && manifest.events.length > 0) {
    const container = ServiceContainer.getInstance();
    await container.refugeeRepo.saveRawEvents(
      manifest.events.map((ev) => ({
        id: asEventId(ev.id),
        refugeeId: asRefugeeId(ev.refugeeId),
        authorId: ev.authorId || session.userId,
        authorName: ev.authorName || "Petugas",
        authorRole: (ev.authorRole as RefugeeEventProps["authorRole"]) || "RELAWAN",
        eventType: (ev.eventType as RefugeeEventProps["eventType"]) || "INTAKE",
        eventPayload: JSON.parse(ev.eventPayloadJson || "{}"),
        deviceTimestamp: ev.deviceTimestamp,
        logicalSeq: ev.logicalSeq,
      }))
    );
  }

  // Impor tiket kebutuhan / data distribusi bantuan ke state posko
  if (importNeedsTicketsBatch && manifest.tickets && manifest.tickets.length > 0) {
    importNeedsTicketsBatch(
      manifest.tickets.map((t) => ({
        id: t.id,
        refugeeId: t.refugeeId,
        refugeeName: t.refugeeName,
        shelterLocation: t.shelterLocation,
        postId: session.poskoId,
        itemName: t.itemName,
        quantity: t.quantity,
        unit: t.unit,
        status: t.status,
        urgency: t.urgency,
        createdByUserId: session.userId,
        createdByUserName: t.createdByUserName || "Petugas",
        createdAt: t.createdAt || Date.now(),
        completedAt: t.completedAt,
      }))
    );
  }
      } catch (err) {
        console.error("Gagal merekonstruksi data poster:", err);
        setIsRecovering(false);
        setScanMessage(`Gagal merekonstruksi: ${(err as Error).message}`);
      }
    })();
  }
}, [scannedCellsMap, recoveredManifest, session, importRefugeeBatch, importInventoryBatch, importTransactionBatch, importNeedsTicketsBatch]);

  // Simulate torn QR box drill
  const handleSimulateTornPosterDrill = () => {
  if (!posterSpec) return;
  setScannedCellsMap(new Map());
  setRecoveredManifest(null);
  setScanMessage("Memulai simulasi 1 kotak sobek/rusak di tiang tenda...");

  // Simulate scanning (N - 1) data cells + 1 Parity cell (Intentionally omitting Box index 0)
  const simulatedCells: ParsedPosterCell[] = [];
  for (let i = 1; i < posterSpec.cells.length; i++) {
  const cell = posterSpec.cells[i]!;
  const parsed = PosterGenerator.parsePosterCellQr(cell.qrRawString);
  if (parsed) simulatedCells.push(parsed);
  }

  // Sequentially load cells
  simulatedCells.forEach((c, idx) => {
  setTimeout(() => {
  setScannedCellsMap((prev) => {
  const next = new Map(prev);
  const cellKey = c.isParity ? c.totalDataParts : c.partIndex;
  next.set(cellKey, c);
  return next;
  });
  }, (idx + 1) * PARITY_POSTER_PAGE_CONSTANTS.SIMULATED_CELL_LOAD_INTERVAL_MS);
  });
  };

  const handleResetScan = () => {
  setScannedCellsMap(new Map());
  setRecoveredManifest(null);
  setScanMessage(null);
  };

  const handlePrint = () => {
  window.print();
  };

  return (
  <div className="space-y-5">
  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 print:hidden">

  {/* Print vs Scan Toggle */}
  <div className="flex rounded-lg border border-border bg-surface p-1">
  <button
  type="button"
  onClick={() => setMode("PRINT")}
  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
  mode === "PRINT"
  ? "bg-primary text-primary-foreground shadow-2xs"
  : "text-text-muted hover:text-text-main"
  }`}
  >
  Cetak Berkas
  </button>
  <button
  type="button"
  onClick={() => setMode("SCAN")}
  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
  mode === "SCAN"
  ? "bg-primary text-primary-foreground shadow-2xs"
  : "text-text-muted hover:text-text-main"
  }`}
  >
  Pindai Berkas
  </button>
  </div>
  </div>

  {mode === "PRINT" ? (
  refugees.length === 0 ? (
  <EmptyState
  icon="printer"
  title="Belum Ada Data Warga untuk Dicetak"
  description="Poster QR Paritas N+1 membutuhkan data warga terdaftar di posko untuk dicetak ke kertas HVS fisik."
  actionLabel="+ Intake Warga Cepat"
  actionHref={`/posko/${session.poskoId}/refugees`}
  />
  ) : (
  /* MODE 1: PRINT POSTER */
  <div className="space-y-4">
  {/* Action Header Card (Hidden in Print) */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-border print:hidden">
  <div>
  <div className="flex items-center gap-2">
  <h3 className="text-sm font-bold text-text-main">
  Lembar Cetak Cadangan Posko (Paritas Dinamis $N+1$)
  </h3>
  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
  {posterSpec ? `${posterSpec.totalDataParts} Data + 1 Paritas (${posterSpec.totalGridCells} QR)` : "Memuat..."}
  </span>
  </div>
  <p className="text-xs text-text-muted mt-0.5">
  Jumlah kotak QR beradaptasi otomatis dengan volume data posko. Kebal kerusakan 1 kotak penuh di tiang tenda.
  </p>
  </div>
  <div className="flex items-center gap-2">
  <Button
  variant="primary"
  size="sm"
  icon="printer"
  iconVariant="bold"
  onClick={handlePrint}
  >
  Cetak Lembar Poster (A4)
  </Button>
  </div>
  </div>

  {/* Printable Physical Paper Canvas */}
  <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-white border border-border shadow-xs space-y-5 text-slate-900 print:max-w-none print:border-none print:p-0 print:shadow-none">
  {/* Header Posko */}
  <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
  <div>
  <div className="flex items-center gap-2">
  <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
  S2
  </div>
  <h1 className="text-lg font-black tracking-tight uppercase">
  Sandya • Lembar Arsip Data Posko
  </h1>
  </div>
  <p className="text-xs text-slate-600 mt-0.5 font-medium">
  {posterSpec?.poskoName || session.poskoName} • {posterSpec?.missionName || session.missionName}
  </p>
  </div>

  <div className="text-left sm:text-right text-xs text-slate-600 font-mono">
  <p>ID: <strong>{posterSpec?.syncId}</strong></p>
  <p>{new Date(posterSpec?.generatedAt || Date.now()).toLocaleString("id-ID")}</p>
  </div>
  </div>

  {/* Posko Metric Summary */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
  <div>
  <span className="text-slate-500 font-medium">Total Warga Terdata:</span>
  <p className="text-sm font-bold text-slate-900">{posterSpec?.totalRefugees || refugees.length} Jiwa</p>
  </div>
  <div>
  <span className="text-slate-500 font-medium">Kebutuhan Medis Merah:</span>
  <p className="text-sm font-bold text-rose-600">{posterSpec?.criticalNeedsCount || 0} Pasien</p>
  </div>
  <div>
  <span className="text-slate-500 font-medium">Logistik Terkelola:</span>
  <p className="text-sm font-bold text-slate-900">{inventory.length} Komoditas</p>
  </div>
  <div>
  <span className="text-slate-500 font-medium">Penanggung Jawab:</span>
  <p className="text-sm font-bold text-slate-900">{session.userName || "Petugas Posko"}</p>
  </div>
  </div>

  {/* Instructions Banner */}
  <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
  <Icon name="shield" variant="bold" size={16} className="text-sky-700 shrink-0 mt-0.5" />
  <div>
  <p className="font-bold">Protokol Pemulihan Lapangan Tanpa Internet:</p>
  <p className="text-sky-800 text-[11px] mt-0.5">
  {posterSpec?.instructions ||
  "Cukup pindai sembarang N dari N+1 kode QR di bawah untuk memulihkan seluruh data posko 100% sempurna."}
  </p>
  </div>
  </div>

  {/* Dynamic Grid Layout (N+1 QR Cells) */}
  {posterSpec && (
  <div
  className={`grid gap-4 pt-1 ${
  posterSpec.totalGridCells <= 4
  ? "grid-cols-2"
  : posterSpec.totalGridCells <= 6
  ? "grid-cols-2 sm:grid-cols-3"
  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
  }`}
  >
  {posterSpec.cells.map((cell, idx) => (
  <div
  key={idx}
  className={`p-3 rounded-xl border text-center space-y-2 flex flex-col items-center justify-between ${
  cell.isParity
  ? "bg-sky-50/50 border-sky-400/80 shadow-xs"
  : "bg-white border-slate-200"
  }`}
  >
  {/* QR Code SVG */}
  <div className="w-full flex justify-center py-1">
  <QRCodeSVG
  value={cell.qrRawString}
  size={PARITY_POSTER_PAGE_CONSTANTS.POSTER_QR_SIZE}
  level="M"
  includeMargin={true}
  className="border-none shadow-none"
  />
  </div>

  {/* Cell Meta */}
  <div className="w-full border-t border-slate-200 pt-1.5 space-y-0.5">
  <p
  className={`text-xs font-bold font-mono ${
  cell.isParity ? "text-sky-700" : "text-slate-900"
  }`}
  >
  {cell.cellLabel}
  </p>
  <p className="text-[10px] text-slate-500 font-mono">
  {cell.byteLength} Bytes • {cell.isParity ? "XOR Redundan" : "Data Biner"}
  </p>
  </div>
  </div>
  ))}
  </div>
  )}

  {/* Footer Verification Badge */}
  <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-500">
  <span className="font-mono font-semibold">SANDYA-OFFLINE-XOR-V2 • VERIFIED</span>
  <span>Dokumen Resmi Penanganan Bencana BNPB / Relawan</span>
  </div>
  </div>
  </div>
  )
  ) : (
  /* MODE 2: SCAN & RESTORE POSTER */
  <div className="max-w-xl mx-auto space-y-4">
  <Card className="p-5 sm:p-6 space-y-4 border border-border bg-surface shadow-2xs">
  <div className="text-center space-y-1">
  <h3 className="text-base font-bold text-text-main">
  Pemindai Lembar Cetak Posko
  </h3>
  <p className="text-xs text-text-muted">
  Arahkan kamera ke setiap kotak QR pada lembar posko.
  </p>
  </div>

  {/* Continuous Camera Scanner */}
  <div className="rounded-xl overflow-hidden border border-border">
  <QRCameraScanner
  onScan={handleQrScanned}
  continuous={true}
  viewfinderText="Arahkan ke setiap kotak QR lembar posko bergantian"
  />
  </div>

  {/* Status & Feedback Message */}
  {scanMessage && (
  <div className="p-3 rounded-lg bg-surface-subtle border border-border text-xs text-text-main flex items-center gap-2">
  <Icon name="radar" variant="bold" size={16} className="text-primary shrink-0" />
  <span className="font-medium">{scanMessage}</span>
  </div>
  )}

  {/* Progress Matrix of Detected Cells */}
  {posterSpec && (
  <div className="space-y-2">
  <div className="flex items-center justify-between text-xs">
  <span className="font-medium text-text-muted">Progres Pemindaian:</span>
  <span className="font-bold text-primary">
  {scannedCellsMap.size} dari {posterSpec.totalDataParts} Kotak Diperlukan (Total {posterSpec.totalGridCells} Kotak)
  </span>
  </div>

  <div
  className={`grid gap-2 ${
  posterSpec.totalGridCells <= 4
  ? "grid-cols-2"
  : "grid-cols-2 sm:grid-cols-3"
  }`}
  >
  {posterSpec.cells.map((cell, idx) => {
  const cellKey = cell.isParity ? cell.totalDataParts : cell.partIndex;
  const isCaptured = scannedCellsMap.has(cellKey);

  return (
  <div
  key={idx}
  className={`p-2.5 rounded-lg border text-center transition-all ${
  isCaptured
  ? "bg-status-safe-bg text-status-safe border-status-safe-border font-bold"
  : "bg-surface text-text-muted border-border"
  }`}
  >
  <p className="text-xs font-semibold">{cell.cellLabel}</p>
  <p className="text-[11px] mt-0.5 flex items-center justify-center gap-1">
  {isCaptured && <Icon name="check" size={12} className="inline text-status-safe" />}
  <span>{isCaptured ? "Terpindai" : "Belum Terbaca"}</span>
  </p>
  </div>
  );
  })}
  </div>
  </div>
  )}

  {/* Recovery Success Banner */}
  {recoveredManifest && (
  <div className="p-4 rounded-xl bg-status-safe-bg border border-status-safe-border text-status-safe space-y-2">
  <div className="flex items-center gap-2">
  <Icon name="check" variant="bold" size={20} />
  <h4 className="text-sm font-bold">100% Data Berhasil Dipulihkan!</h4>
  </div>
  <div className="text-xs text-text-main space-y-1">
  <p>
  Posko Asal: <strong>{recoveredManifest.poskoName}</strong>
  </p>
  <p>
  Total Warga Dipulihkan: <strong>{recoveredManifest.persons.length} Jiwa</strong>
  </p>
  <p className="text-text-muted text-[11px]">
  Data telah otomatis terintegrasi ke database operasional posko.
  </p>
  </div>
  </div>
  )}

  {/* Action Buttons & Field Drills */}
  <div className="flex flex-col sm:flex-row gap-2 pt-2">
  <Button
  variant="outline"
  size="sm"
  className="flex-1"
  icon="shield"
  iconVariant="linear"
  onClick={handleSimulateTornPosterDrill}
  >
  Simulasi 1 Kotak Sobek/Hilang
  </Button>
  <Button
  variant="secondary"
  size="sm"
  icon="sync"
  iconVariant="linear"
  onClick={handleResetScan}
  >
  Reset Pemindai
  </Button>
  </div>
  </Card>
  </div>
  )}
  </div>
  );
}

