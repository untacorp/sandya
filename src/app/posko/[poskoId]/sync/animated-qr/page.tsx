"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import {
  splitPayloadToAnimatedFrames,
  OutOfOrderFrameAssembler,
  AnimatedFrame,
} from "@/core/codecs/animated-qr-codec";
import {
  packManifestV4,
  unpackManifestV4,
  compressManifestV4,
  decompressManifestV4,
  DisasterManifestV4,
} from "@/core/codecs/bitpacker-v4";
import { QRCodeSVG } from "@/shared/ui/qr-code-svg";
import { QRCameraScanner } from "@/features/auth/components/qr-camera-scanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { TIME_CONSTANTS } from "@/core/shared/constants";
import { EmptyState } from "@/shared/ui/empty-state";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { asRefugeeId, asPoskoId, asEventId } from "@/core/shared/branded-types";
import { RefugeeAggregate } from "@/core/domain/refugees/refugee.aggregate";

export const ANIMATED_QR_PAGE_CONSTANTS = {
  DEFAULT_FPS: 6,
  SUPPORTED_FPS: [4, 6, 8] as const,
  CHUNK_BYTE_SIZE: 300,
  SIMULATED_FRAME_DELAY_MS: 350,
  QR_DISPLAY_SIZE: 210,
  DEFAULT_FRAME_SLOTS_FALLBACK: 4,
} as const;

export default function AnimatedQRPage() {
  const { session, refugees, inventory, transactions, needsTickets, importRefugeeBatch, importInventoryBatch, importTransactionBatch, importNeedsTicketsBatch } = usePoskoStore();

  const [mode, setMode] = React.useState<"TRANSMIT" | "RECEIVE">("TRANSMIT");

  // Transmit State
  const [frames, setFrames] = React.useState<AnimatedFrame[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [fps, setFps] = React.useState<number>(ANIMATED_QR_PAGE_CONSTANTS.DEFAULT_FPS); // Default 6 FPS

  // Receive State
  const assemblerRef = React.useRef<OutOfOrderFrameAssembler>(new OutOfOrderFrameAssembler());
  const [capturedIndices, setCapturedIndices] = React.useState<number[]>([]);
  const [totalExpectedParts, setTotalExpectedParts] = React.useState<number>(0);
  const [progressPercent, setProgressPercent] = React.useState<number>(0);
  const [recoveredManifest, setRecoveredManifest] = React.useState<DisasterManifestV4 | null>(null);
  const [receiveMessage, setReceiveMessage] = React.useState<string | null>(null);

  // Generate frames for Transmit
  React.useEffect(() => {
  if (refugees.length === 0 && inventory.length === 0 && transactions.length === 0 && needsTickets.length === 0) {
  setFrames([]);
  return;
  }

  let isMounted = true;

  const buildManifestAndFrames = async () => {
  try {
  const manifestPersons = refugees.map((r) => ({
  id: r.id,
  fullName: r.fullName,
  nationalId: r.nik || undefined,
  gender: r.gender,
  age: r.age,
  vulnerabilities: r.vulnerabilities.reduce((mask, v) => {
    switch (v) {
      case "BALITA": return mask | 0x01;
      case "IBU_HAMIL": return mask | 0x02;
      case "LANSIA": return mask | 0x04;
      case "DISABILITAS": return mask | 0x08;
      case "LUKA_BERAT": return mask | 0x10;
      case "PENYAKIT_KRONIS": return mask | 0x20;
      default: return mask;
    }
  }, 0),
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

  const packed = packManifestV4(manifest);
  const compressed = compressManifestV4(packed);
  const generatedFrames = splitPayloadToAnimatedFrames(compressed, ANIMATED_QR_PAGE_CONSTANTS.CHUNK_BYTE_SIZE);

  if (isMounted) {
    setFrames(generatedFrames);
    setCurrentFrameIdx(0);
  }
  } catch (err) {
  console.error("Gagal membuat frame animasi QR:", err);
  }
  };

  buildManifestAndFrames();

  return () => {
    isMounted = false;
  };
  }, [refugees, inventory, transactions, needsTickets, session.poskoName, session.poskoId]);

  // Transmit Frame Animation Loop
  React.useEffect(() => {
  if (mode !== "TRANSMIT" || !isPlaying || frames.length <= 1) return;

  const intervalMs = Math.round(TIME_CONSTANTS.MS_PER_SECOND / fps);
  const interval = setInterval(() => {
  setCurrentFrameIdx((prev) => (prev + 1) % frames.length);
  }, intervalMs);

  return () => clearInterval(interval);
  }, [mode, isPlaying, frames.length, fps]);

  // Handle incoming optical frame from camera
  const handleScanFrame = React.useCallback(
    async (qrText: string) => {
      const assembler = assemblerRef.current;
      const res = assembler.ingestFrame(qrText);

      if (res.totalParts > 0) {
        setTotalExpectedParts(res.totalParts);
        setCapturedIndices(assembler.getCapturedPartIndices());
        setProgressPercent(res.progress);
      }

      if (res.isNewPart) {
        setReceiveMessage(`Menerima Frame ${res.partIndex + 1}/${res.totalParts} (CRC16 Valid)`);
      }

  if (res.completed && !recoveredManifest) {
  try {
  const fullBuf = assembler.getFullPayload();
  const decompressed = decompressManifestV4(fullBuf);
  const manifest = unpackManifestV4(decompressed);

  setRecoveredManifest(manifest);
  setReceiveMessage(
  `Sukses! 100% Data Posko (${manifest.persons.length} Warga) Berhasil Diterima.`
  );

  if (importRefugeeBatch && manifest.persons.length > 0) {
  importRefugeeBatch(
  manifest.persons.map((p) => ({
  id: p.id,
  postId: session.poskoId,
  fullName: p.fullName,
  nik: p.nationalId || null,
  gender: p.gender,
  age: p.age,
  vulnerabilities: [
    (p.vulnerabilities & 0x01) ? "BALITA" : null,
    (p.vulnerabilities & 0x02) ? "IBU_HAMIL" : null,
    (p.vulnerabilities & 0x04) ? "LANSIA" : null,
    (p.vulnerabilities & 0x08) ? "DISABILITAS" : null,
    (p.vulnerabilities & 0x10) ? "LUKA_BERAT" : null,
    (p.vulnerabilities & 0x20) ? "PENYAKIT_KRONIS" : null,
  ].filter(Boolean) as any[],
  urgentNeeds: p.urgentNeeds ? p.urgentNeeds.map((code) => `Kebutuhan #${code}`) : [],
  domicileOrigin: p.domicileOrigin || session.poskoName || "Posko Pengungsian",
  shelterLocation: p.shelterLocation || "Tenda Pengungsian",
  missingKinName: p.missingKinName,
  registeredByUserId: session.userId,
  registeredByUserName: session.userName,
  triageStatus: p.triage || "GREEN",
  }))
  );

  // Simpan warga ke database lokal SQLite posko agar terdaftar di domain repository
  const container = ServiceContainer.getInstance();
  for (const p of manifest.persons) {
    const refId = asRefugeeId(p.id || `REF-${Math.floor(1000 + Math.random() * 9000)}`);
    const agg = RefugeeAggregate.reconstitute({
      id: refId,
      poskoId: asPoskoId(session.poskoId),
      fullName: p.fullName,
      nationalId: p.nationalId || null,
      gender: p.gender,
      age: p.age,
      domicileOrigin: p.domicileOrigin || null,
      shelterLocation: p.shelterLocation || null,
      missingKinName: p.missingKinName || null,
      currentTriage: (p.triage as any) || "GREEN",
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
        authorRole: (ev.authorRole as any) || "RELAWAN",
        eventType: ev.eventType as any,
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
        console.error("Gagal memproses payload biner utuh:", err);
        setReceiveMessage(`Error decode: ${(err as Error).message}`);
      }
    }
  },
  [recoveredManifest, session, importRefugeeBatch, importInventoryBatch, importTransactionBatch, importNeedsTicketsBatch]
);

  // Fast optical simulation drill
  const handleFastReceiveSimulation = () => {
  if (frames.length === 0) return;
  const assembler = assemblerRef.current;
  assembler.reset();
  setRecoveredManifest(null);
  setCapturedIndices([]);
  setProgressPercent(0);
  setReceiveMessage("Memulai penangkapan frame out-of-order...");

  // Simulate capturing frames out of order (e.g. 2, 0, 3, 1)
  const shuffled = [...frames].sort(() => Math.random() - 0.5);

  shuffled.forEach((frame, idx) => {
  setTimeout(() => {
  handleScanFrame(frame.frameString);
  }, (idx + 1) * ANIMATED_QR_PAGE_CONSTANTS.SIMULATED_FRAME_DELAY_MS);
  });
  };

  const handleResetReceiver = () => {
  assemblerRef.current.reset();
  setCapturedIndices([]);
  setTotalExpectedParts(0);
  setProgressPercent(0);
  setRecoveredManifest(null);
  setReceiveMessage(null);
  };

  const activeFrame = frames[currentFrameIdx];

  return (
  <div className="space-y-5">
  {/* Sub-Tabs Wrapper for Toggle */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">

  {/* Transmit vs Receive Toggle */}
  <div className="flex rounded-lg border border-border bg-surface p-1">
  <button
  type="button"
  onClick={() => setMode("TRANSMIT")}
  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
  mode === "TRANSMIT"
  ? "bg-primary text-primary-foreground shadow-2xs"
  : "text-text-muted hover:text-text-main"
  }`}
  >
  Kirim Data
  </button>
  <button
  type="button"
  onClick={() => setMode("RECEIVE")}
  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
  mode === "RECEIVE"
  ? "bg-primary text-primary-foreground shadow-2xs"
  : "text-text-muted hover:text-text-main"
  }`}
  >
  Terima Data
  </button>
  </div>
  </div>

  {mode === "TRANSMIT" ? (
  refugees.length === 0 ? (
  <EmptyState
  icon="qr-code"
  title="Belum Ada Data Warga untuk Dipancarkan"
  description="Belum ada penyintas atau warga terdaftar di posko ini untuk ditransmisikan melalui pancaran layar QR animasi (Fountain Stream)."
  actionLabel="+ Intake Warga Cepat"
  actionHref={`/posko/${session.poskoId}/refugees`}
  />
  ) : (
  /* TRANSMIT MODE */
  <Card className="max-w-md mx-auto p-5 sm:p-6 space-y-4 border border-border bg-surface shadow-2xs text-center">
  <div>
  <h3 className="text-base font-bold text-text-main">
  Pancaran QR Animasi Layar (Fountain Stream)
  </h3>
  <p className="text-xs text-text-muted mt-0.5">
  Arahkan layar ini ke kamera HP penerima untuk transfer data tanpa sinyal.
  </p>
  </div>

  {/* Real QR SVG Display */}
  <div className="w-64 h-64 mx-auto p-3 rounded-2xl bg-white border border-border flex flex-col items-center justify-center shadow-xs">
  {activeFrame ? (
  <QRCodeSVG
  value={activeFrame.frameString}
  size={ANIMATED_QR_PAGE_CONSTANTS.QR_DISPLAY_SIZE}
  level="M"
  includeMargin={true}
  className="border-none shadow-none"
  />
  ) : (
  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  )}
  </div>

  {/* Frame Meta & Progress Indicator */}
  {activeFrame && (
  <div className="space-y-2">
  <div className="flex items-center justify-between text-xs px-2">
  <span className="font-mono text-text-muted">
  Frame {currentFrameIdx + 1} / {frames.length}
  </span>
  <span className="font-mono font-bold text-primary">
  UUID #{activeFrame.header.payloadUuid.toString(16).toUpperCase()} • CRC16 0x{activeFrame.header.crc16.toString(16).toUpperCase()}
  </span>
  </div>

  {/* Dot Indicators */}
  <div className="flex justify-center gap-1.5">
  {frames.map((_, idx) => (
  <div
  key={idx}
  className={`h-1.5 rounded-full transition-all duration-100 ${
  currentFrameIdx === idx
  ? "w-6 bg-primary"
  : "w-1.5 bg-surface-muted border border-border"
  }`}
  />
  ))}
  </div>
  </div>
  )}

  {/* Play/Pause & FPS Controls */}
  <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
  <Button
  variant={isPlaying ? "secondary" : "primary"}
  size="sm"
  icon={isPlaying ? "shield" : "radar"}
  iconVariant="bold"
  onClick={() => setIsPlaying((p) => !p)}
  >
  {isPlaying ? "Jeda Putaran" : "Lanjutkan Putaran"}
  </Button>

  <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-subtle p-1 text-xs">
  <span className="text-text-muted px-1.5">Kecepatan:</span>
  {ANIMATED_QR_PAGE_CONSTANTS.SUPPORTED_FPS.map((speed) => (
  <button
  key={speed}
  type="button"
  onClick={() => setFps(speed)}
  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
  fps === speed
  ? "bg-primary text-primary-foreground shadow-2xs"
  : "text-text-muted hover:text-text-main"
  }`}
  >
  {speed} FPS
  </button>
  ))}
  </div>
  </div>
  </Card>
  )
  ) : (
  /* RECEIVE MODE */
  <Card className="max-w-md mx-auto p-5 sm:p-6 space-y-4 border border-border bg-surface shadow-2xs">
  <div className="text-center space-y-0.5">
  <h3 className="text-base font-bold text-text-main">
  Penerima Kamera QR Animasi
  </h3>
  <p className="text-xs text-text-muted">
  Arahkan kamera ke layar HP pengirim. Frame akan ditangkap secara otomatis out-of-order.
  </p>
  </div>

  {/* Continuous Camera Viewfinder */}
  <div className="rounded-xl overflow-hidden border border-border">
  <QRCameraScanner
  onScan={handleScanFrame}
  continuous={true}
  viewfinderText="Arahkan kamera ke layar pengirim"
  />
  </div>

  {/* Status Message */}
  {receiveMessage && (
  <div className="p-3 rounded-lg bg-surface-subtle border border-border text-xs text-text-main flex items-center gap-2">
  <Icon name="radar" variant="bold" size={16} className="text-primary shrink-0" />
  <span className="font-medium">{receiveMessage}</span>
  </div>
  )}

  {/* Progress Bar & Frame Matrix */}
  <div className="space-y-2">
  <div className="flex justify-between text-xs font-medium">
  <span className="text-text-muted">Progres Penangkapan Frame:</span>
  <span className="font-bold text-primary">
  {totalExpectedParts > 0
    ? `${progressPercent}% (${capturedIndices.length}/${totalExpectedParts} Frame)`
    : "Menunggu deteksi frame QR..."}
  </span>
  </div>

  {/* Frame Slots Grid */}
  {totalExpectedParts > 0 ? (
  <div className={`grid gap-1.5 ${totalExpectedParts <= 2 ? "grid-cols-2" : totalExpectedParts === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
  {Array.from({ length: totalExpectedParts }).map((_, idx) => {
  const isCaptured = capturedIndices.includes(idx);
  return (
  <div
  key={idx}
  className={`py-1.5 rounded-lg text-center text-xs font-semibold border transition-all ${
  isCaptured
  ? "bg-status-safe-bg text-status-safe border-status-safe-border font-bold"
  : "bg-surface-subtle text-text-subtle border-border"
  }`}
  >
  Frame {idx + 1} {isCaptured && <Icon name="check" size={12} className="inline ml-1 text-status-safe align-middle" />}
  </div>
  );
  })}
  </div>
  ) : (
  <p className="text-[11px] text-text-muted text-center py-1">
  Arahkan kamera ke layar HP pengirim. Sistem akan otomatis mendeteksi jumlah frame.
  </p>
  )}
  </div>

  {/* Success Banner */}
  {recoveredManifest && (
  <div className="p-4 rounded-xl bg-status-safe-bg border border-status-safe-border text-status-safe space-y-1">
  <div className="flex items-center gap-2 font-bold text-sm">
  <Icon name="check" variant="bold" size={18} />
  <span>Sinkronisasi Selesai!</span>
  </div>
  <p className="text-xs text-text-main">
  {recoveredManifest.persons.length} data warga dari posko <strong>{recoveredManifest.poskoName}</strong> berhasil dimasukkan.
  </p>
  </div>
  )}

  {/* Actions */}
  <div className="flex gap-2 pt-1">
  <Button
  variant="outline"
  size="sm"
  className="flex-1"
  icon="search"
  iconVariant="linear"
  onClick={handleFastReceiveSimulation}
  >
  Simulasi Tangkap Cepat
  </Button>
  <Button
  variant="secondary"
  size="sm"
  icon="sync"
  iconVariant="linear"
  onClick={handleResetReceiver}
  >
  Reset
  </Button>
  </div>
  </Card>
  )}
  </div>
  );
}

