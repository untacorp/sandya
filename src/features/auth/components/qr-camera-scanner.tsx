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
  active?: boolean;
}

export const QR_SCANNER_CONSTANTS = {
  SCAN_DEBOUNCE_INTERVAL_MS: 350,
  CAMERA_IDEAL_WIDTH: 1280,
  CAMERA_IDEAL_HEIGHT: 720,
} as const;

/**
 * Completely releases hardware access for a MediaStream: disables tracks, stops tracks,
 * and removes them from the stream to ensure camera LED turns off in all browsers.
 */
function releaseMediaStream(stream: MediaStream | null | undefined) {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      try {
        track.enabled = false;
        track.stop();
      } catch {
        // ignore
      }
      try {
        stream.removeTrack(track);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

export function QRCameraScanner({
  onScan,
  onError,
  className = "",
  continuous = false,
  viewfinderText = "Arahkan kamera ke kode QR",
  active = true,
}: QRCameraScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const activeStreamsRef = React.useRef<Set<MediaStream>>(new Set());
  const animationFrameId = React.useRef<number | null>(null);
  const lastScannedTextRef = React.useRef<string>("");
  const lastScanTimestampRef = React.useRef<number>(0);
  const isMountedRef = React.useRef<boolean>(false);
  const isScanningRef = React.useRef<boolean>(false);
  const sessionEpochRef = React.useRef<number>(0);

  const onScanRef = React.useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = React.useRef(onError);
  onErrorRef.current = onError;

  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [facingMode, setFacingMode] = React.useState<"environment" | "user">("environment");
  const [isScanning, setIsScanning] = React.useState(active);
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
    sessionEpochRef.current += 1;
    isScanningRef.current = false;
    setIsScanning(false);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    // Stop and release primary MediaStream tracks immediately
    if (streamRef.current) {
      releaseMediaStream(streamRef.current);
      streamRef.current = null;
    }

    // Stop and release any active streams in the tracker (guards against async race conditions)
    activeStreamsRef.current.forEach((stream) => {
      releaseMediaStream(stream);
    });
    activeStreamsRef.current.clear();

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // ignore
      }
      if (videoRef.current.srcObject) {
        releaseMediaStream(videoRef.current.srcObject as MediaStream);
        videoRef.current.srcObject = null;
      }
      try {
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      } catch {
        // ignore
      }
    }

    // If Tauri Mobile Native Scanner is open, cancel it
    if (isTauriMobile()) {
      import("@tauri-apps/plugin-barcode-scanner")
        .then((plugin) => {
          plugin.cancel().catch(() => {});
        })
        .catch(() => {});
    }
  }, [isTauriMobile]);

  const scanFrameRef = React.useRef<() => void>(() => {});

  const scanFrame = React.useCallback(() => {
    if (!isScanningRef.current) return;
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
              onScanRef.current(text);
            }
          } else {
            // Single scan: stop camera and turn off hardware immediately before invoking callback
            stopCamera();
            onScanRef.current(text);
            return;
          }
        }
      }
    }

    if (isScanningRef.current) {
      animationFrameId.current = requestAnimationFrame(() => scanFrameRef.current());
    }
  }, [continuous, stopCamera]);

  React.useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = React.useCallback(async () => {
    if (!active || !isMountedRef.current) return;
    stopCamera();

    const currentEpoch = ++sessionEpochRef.current;
    isScanningRef.current = true;
    setIsScanning(true);
    setErrorMessage(null);

    // Tauri Mobile Native Scanner Check
    if (isTauriMobile()) {
      try {
        const barcodePlugin = await import("@tauri-apps/plugin-barcode-scanner");
        if (sessionEpochRef.current !== currentEpoch || !isMountedRef.current || !active) {
          barcodePlugin.cancel().catch(() => {});
          return;
        }

        const result = await barcodePlugin.scan({
          windowed: true,
          formats: [barcodePlugin.Format.QRCode],
        });

        if (sessionEpochRef.current !== currentEpoch || !isMountedRef.current || !active) {
          barcodePlugin.cancel().catch(() => {});
          return;
        }

        if (result && result.content) {
          if (!continuous) {
            stopCamera();
          }
          onScanRef.current(result.content);
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

      // Register stream into tracker
      activeStreamsRef.current.add(stream);

      // Guard against race conditions: stopped or unmounted or deactivated while awaiting stream
      if (
        sessionEpochRef.current !== currentEpoch ||
        !isMountedRef.current ||
        !isScanningRef.current ||
        !active
      ) {
        releaseMediaStream(stream);
        activeStreamsRef.current.delete(stream);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();

        if (
          sessionEpochRef.current !== currentEpoch ||
          !isMountedRef.current ||
          !isScanningRef.current ||
          !active
        ) {
          stopCamera();
          return;
        }

        setHasPermission(true);
        animationFrameId.current = requestAnimationFrame(() => scanFrameRef.current());
      } else {
        releaseMediaStream(stream);
        activeStreamsRef.current.delete(stream);
        streamRef.current = null;
      }
    } catch (err) {
      if (sessionEpochRef.current !== currentEpoch || !isMountedRef.current) {
        return;
      }
      const errorMsg =
        (err as Error).name === "NotAllowedError"
          ? "Izin akses kamera ditolak. Berikan izin kamera untuk memindai."
          : (err as Error).message || "Gagal membuka kamera.";
      setHasPermission(false);
      setErrorMessage(errorMsg);
      if (onErrorRef.current) onErrorRef.current(errorMsg);
    }
  }, [active, continuous, facingMode, isTauriMobile, stopCamera]);

  React.useEffect(() => {
    isMountedRef.current = true;
    if (active) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [active, startCamera, stopCamera]);

  // Handle tab visibility changes, page hide, and browser unload to release camera hardware immediately
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopCamera();
      } else if (document.visibilityState === "visible" && active && isMountedRef.current) {
        startCamera();
      }
    };

    const handleUnload = () => {
      stopCamera();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("popstate", handleUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("popstate", handleUnload);
    };
  }, [active, startCamera, stopCamera]);

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

      {/* Viewfinder Target Overlay when scanning */}
      {hasPermission && isScanning && (
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

      {/* Scanner Completed / Inactive Overlay */}
      {!isScanning && hasPermission && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-xs text-white space-y-2">
          <div className="w-12 h-12 rounded-full bg-status-safe-bg text-status-safe flex items-center justify-center border border-status-safe-border">
            <Icon name="check" variant="bold" size={24} />
          </div>
          <p className="text-xs font-bold text-white">Pemindaian Selesai</p>
          <p className="text-[11px] text-white/70">Kamera dinonaktifkan.</p>
        </div>
      )}

      {/* Camera Switch Button */}
      {hasPermission && isScanning && (
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
