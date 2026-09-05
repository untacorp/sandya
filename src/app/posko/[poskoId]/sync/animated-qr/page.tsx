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
import { Tabs } from "@/shared/ui/tabs";
import { Icon } from "@/shared/ui/icon";
import { TIME_CONSTANTS } from "@/core/shared/constants";
import { EmptyState } from "@/shared/ui/empty-state";

export const ANIMATED_QR_PAGE_CONSTANTS = {
  DEFAULT_FPS: 6,
  SUPPORTED_FPS: [4, 6, 8] as const,
  CHUNK_BYTE_SIZE: 300,
  SIMULATED_FRAME_DELAY_MS: 350,
  QR_DISPLAY_SIZE: 230,
  DEFAULT_FRAME_SLOTS_FALLBACK: 4,
} as const;

export default function AnimatedQRPage() {
  const { session, refugees, importRefugeeBatch } = usePoskoStore();

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
  if (refugees.length === 0) {
  setFrames([]);
  return;
  }

  try {
  const manifestPersons = refugees.map((r) => ({
  fullName: r.fullName,
  nationalId: r.nik || undefined,
  gender: r.gender,
  age: r.age,
  vulnerabilities: r.vulnerabilities.length > 0 ? 0x01 : 0x00,
  urgentNeeds: r.urgentNeeds.map((_, idx) => 0x21 + (idx % 8)),
  domicileOrigin: r.domicileOrigin || undefined,
  shelterLocation: r.shelterLocation || undefined,
  missingKinName: r.missingKinName || undefined,
  }));

  const manifest: DisasterManifestV4 = {
  poskoName: session.poskoName || "Posko Sandya Utama",
  defaultRegionCode: "320101",
  timestamp: Date.now(),
  persons: manifestPersons,
  };

  const packed = packManifestV4(manifest);
  const compressed = compressManifestV4(packed);
  const generatedFrames = splitPayloadToAnimatedFrames(compressed, ANIMATED_QR_PAGE_CONSTANTS.CHUNK_BYTE_SIZE);

  setFrames(generatedFrames);
  setCurrentFrameIdx(0);
  } catch (err) {
  console.error("Gagal membuat frame animasi QR:", err);
  }
  }, [refugees, session.poskoName]);

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
  (qrText: string) => {
  const assembler = assemblerRef.current;
  const res = assembler.ingestFrame(qrText);

  if (res.totalParts > 0) {
  setTotalExpectedParts(res.totalParts);
  setCapturedIndices(assembler.getCapturedPartIndices());
  setProgressPercent(res.progress);

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
  postId: session.poskoId,
  fullName: p.fullName,
  nik: p.nationalId || null,
  gender: p.gender,
  age: p.age,
  vulnerabilities: p.vulnerabilities > 0 ? ["LANSIA"] : [],
  urgentNeeds: ["Beras 5kg", "Selimut"],
  domicileOrigin: p.domicileOrigin || "Posko Cijedil",
  shelterLocation: p.shelterLocation || "Tenda 01",
  missingKinName: p.missingKinName,
  registeredByUserId: session.userId,
  registeredByUserName: session.userName,
  triageStatus: "GREEN",
  }))
  );
  }
  } catch (err) {
  console.error("Gagal memproses payload biner utuh:", err);
  setReceiveMessage(`Error decode: ${(err as Error).message}`);
  }
  }
  }
  },
  [recoveredManifest, session, importRefugeeBatch]
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
  {/* Sub-Tabs */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <Tabs
  items={[
  { id: "hub", label: "Pusat Data", icon: "sync", href: `/posko/${session.poskoId}/sync` },
  { id: "animated", label: "Pindai Layar HP", icon: "qr-code", href: `/posko/${session.poskoId}/sync/animated-qr` },
  { id: "poster", label: "Cetak Berkas QR", icon: "printer", href: `/posko/${session.poskoId}/sync/poster` },
  ]}
  activeId="animated"
  variant="segmented"
  className="w-full sm:w-auto"
  />

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
  level="L"
  includeMargin={false}
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
  {progressPercent}% ({capturedIndices.length}/{totalExpectedParts || frames.length || ANIMATED_QR_PAGE_CONSTANTS.DEFAULT_FRAME_SLOTS_FALLBACK} Frame)
  </span>
  </div>

  {/* Frame Slots Grid */}
  <div className="grid grid-cols-4 gap-1.5">
  {Array.from({ length: totalExpectedParts || frames.length || ANIMATED_QR_PAGE_CONSTANTS.DEFAULT_FRAME_SLOTS_FALLBACK }).map((_, idx) => {
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

