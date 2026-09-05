"use client";

import * as React from "react";
import jsQR from "jsqr";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

interface QRCameraScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  className?: string;
  continuous?: boolean;
  viewfinderText?: string;
}

export const QR_SCANNER_CONSTANTS = {
  SCAN_DEBOUNCE_INTERVAL_MS: 350,
  CAMERA_IDEAL_WIDTH: 1280,
  CAMERA_IDEAL_HEIGHT: 720,
} as const;

export function QRCameraScanner({
  onScan,
  onError,
  className = "",
  continuous = false,
  viewfinderText = "Arahkan kamera ke kode QR",
}: QRCameraScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = React.useRef<number | null>(null);
  const lastScannedTextRef = React.useRef<string>("");
  const lastScanTimestampRef = React.useRef<number>(0);

  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [facingMode, setFacingMode] = React.useState<"environment" | "user">("environment");
  const [isScanning, setIsScanning] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Check if running inside Tauri Mobile
  const isTauriMobile = React.useCallback(() => {
  return (
  typeof window !== "undefined" &&
  Boolean((window as unknown as Record<string, unknown>).__TAURI_INTERNALS__) &&
  /android|iphone|ipad|ipod/i.test(navigator.userAgent)
  );
  }, []);

  const stopCamera = React.useCallback(() => {
  if (animationFrameId.current) {
  cancelAnimationFrame(animationFrameId.current);
  animationFrameId.current = null;
  }
  if (videoRef.current && videoRef.current.srcObject) {
  const stream = videoRef.current.srcObject as MediaStream;
  stream.getTracks().forEach((track) => track.stop());
  videoRef.current.srcObject = null;
  }
  }, []);

  const scanFrame = React.useCallback(() => {
  if (!isScanning) return;
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
  inversionAttempts: "dontInvert",
  });

  if (code && code.data && code.data.trim().length > 0) {
  const text = code.data.trim();
  const now = Date.now();

  if (continuous) {
  // For continuous scanning: debounce identical text or allow new text after interval
  if (
  text !== lastScannedTextRef.current ||
  now - lastScanTimestampRef.current > QR_SCANNER_CONSTANTS.SCAN_DEBOUNCE_INTERVAL_MS
  ) {
  lastScannedTextRef.current = text;
  lastScanTimestampRef.current = now;
  onScan(text);
  }
  } else {
  setIsScanning(false);
  stopCamera();
  onScan(text);
  return;
  }
  }
  }
  }

  if (isScanning) {
  animationFrameId.current = requestAnimationFrame(scanFrame);
  }
  }, [continuous, isScanning, onScan, stopCamera]);

  const startCamera = React.useCallback(async () => {
  stopCamera();
  setIsScanning(true);
  setErrorMessage(null);

  // Tauri Mobile Native Scanner Check
  if (isTauriMobile()) {
  try {
  const barcodePlugin = await import("@tauri-apps/plugin-barcode-scanner");
  const result = await barcodePlugin.scan({
  windowed: true,
  formats: [barcodePlugin.Format.QRCode],
  });
  if (result && result.content) {
  onScan(result.content);
  return;
  }
  } catch (err) {
  console.warn("Native scanner fallback to web camera:", err);
  }
  }

  // HTML5 WebRTC Camera
  try {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  throw new Error("Kamera tidak didukung pada peramban ini.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
  video: {
  facingMode: { ideal: facingMode },
  width: { ideal: QR_SCANNER_CONSTANTS.CAMERA_IDEAL_WIDTH },
  height: { ideal: QR_SCANNER_CONSTANTS.CAMERA_IDEAL_HEIGHT },
  },
  audio: false,
  });

  if (videoRef.current) {
  videoRef.current.srcObject = stream;
  videoRef.current.setAttribute("playsinline", "true");
  await videoRef.current.play();
  setHasPermission(true);
  animationFrameId.current = requestAnimationFrame(scanFrame);
  }
  } catch (err) {
  const errorMsg =
  (err as Error).name === "NotAllowedError"
  ? "Izin akses kamera ditolak. Berikan izin kamera untuk memindai."
  : (err as Error).message || "Gagal membuka kamera.";
  setHasPermission(false);
  setErrorMessage(errorMsg);
  if (onError) onError(errorMsg);
  }
  }, [facingMode, isTauriMobile, onError, onScan, scanFrame, stopCamera]);

  React.useEffect(() => {
  startCamera();
  return () => {
  stopCamera();
  };
  }, [startCamera, stopCamera]);

  const toggleFacingMode = () => {
  setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
  <div className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-border ${className}`}>
  {/* Hidden processing canvas */}
  <canvas ref={canvasRef} className="hidden" />

  {/* Video Viewfinder */}
  <video
  ref={videoRef}
  className="w-full h-64 sm:h-72 object-cover"
  muted
  playsInline
  />

  {/* Viewfinder Target Overlay */}
  {hasPermission && (
  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
  <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
  {/* Corner brackets */}
  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-md" />
  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-md" />
  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-md" />
  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-md" />

  {/* Laser scanning beam */}
  <div className="absolute left-2 right-2 h-0.5 bg-primary/90 shadow-[0_0_10px_#0EA5E9] animate-bounce top-1/2 -translate-y-1/2" />
  </div>

  <p className="mt-4 text-xs font-semibold text-white/90 bg-slate-900/80 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs text-center">
  {viewfinderText}
  </p>
  </div>
  )}

  {/* Camera Switch Button */}
  {hasPermission && (
  <div className="absolute bottom-3 right-3 z-20">
  <Button
  type="button"
  variant="secondary"
  size="sm"
  onClick={toggleFacingMode}
  icon="sync"
  iconVariant="linear"
  className="bg-slate-900/80 text-white border-white/20 hover:bg-slate-800"
  >
  Ganti Kamera
  </Button>
  </div>
  )}

  {/* Error or Permission Denied State */}
  {hasPermission === false && (
  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white space-y-3">
  <div className="w-12 h-12 rounded-full bg-status-danger-bg text-status-danger flex items-center justify-center border border-status-danger-border">
  <Icon name="shield" variant="bold" size={24} />
  </div>
  <div className="space-y-1">
  <h4 className="text-sm font-bold">Kamera Tidak Dapat Dibuka</h4>
  <p className="text-xs text-white/70 max-w-xs">{errorMessage}</p>
  </div>
  <Button variant="primary" size="sm" onClick={startCamera}>
  Coba Lagi
  </Button>
  </div>
  )}
  </div>
  );
}
