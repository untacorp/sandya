"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Tabs } from "@/shared/ui/tabs";
import { Icon } from "@/shared/ui/icon";

export default function AnimatedQRPage() {
  const { session, refugees, simulateSync } = usePoskoStore();

  const [mode, setMode] = React.useState<"TRANSMIT" | "RECEIVE">("TRANSMIT");
  const [currentFrame, setCurrentFrame] = React.useState(1);
  const totalFrames = 4;

  const [capturedFrames, setCapturedFrames] = React.useState<number[]>([]);
  const [isReceiving, setIsReceiving] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "TRANSMIT") return;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev >= totalFrames ? 1 : prev + 1));
    }, 160);
    return () => clearInterval(interval);
  }, [mode, totalFrames]);

  const startReceive = () => {
    setIsReceiving(true);
    setCapturedFrames([]);
    const frameOrder = [3, 1, 4, 2];
    frameOrder.forEach((f, idx) => {
      setTimeout(() => {
        setCapturedFrames((prev) => [...prev, f]);
        if (idx === frameOrder.length - 1) {
          setIsReceiving(false);
          simulateSync();
        }
      }, (idx + 1) * 600);
    });
  };

  const progressPercent = Math.round((capturedFrames.length / totalFrames) * 100);

  return (
    <div className="space-y-5">
      {/* Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          items={[
            { id: "hub", label: "Pusat Sinkronisasi", icon: "sync", href: `/posko/${session.poskoId}/sync` },
            { id: "animated", label: "QR Animasi Layar", icon: "qr-code", href: `/posko/${session.poskoId}/sync/animated-qr` },
            { id: "poster", label: "Lembar Cetak Cadangan", icon: "printer", href: `/posko/${session.poskoId}/sync/poster` },
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
        /* Transmit */
        <Card className="max-w-md mx-auto text-center p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-text-main">
              Arahkan Layar ke HP Penerima
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Data {refugees.length} warga berputar dalam {totalFrames} bagian frame QR.
            </p>
          </div>

          <div className="w-52 h-52 mx-auto p-4 rounded-xl bg-surface border border-border flex flex-col items-center justify-center space-y-2 shadow-xs">
            <Icon name="qr-code" variant="bold" size={130} className="text-primary" />
            <span className="text-xs font-mono font-medium text-text-muted">
              Bagian {currentFrame} dari {totalFrames}
            </span>
          </div>

          <div className="flex justify-center gap-1.5">
            {Array.from({ length: totalFrames }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-150 ${
                  currentFrame === idx + 1
                    ? "w-6 bg-primary"
                    : "w-2 bg-surface-muted border border-border"
                }`}
              />
            ))}
          </div>
        </Card>
      ) : (
        /* Receive */
        <Card className="max-w-md mx-auto p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-base font-bold text-text-main">
              Arahkan Kamera ke Layar Pengirim
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Kamera akan otomatis menangkap setiap frame QR bergantian.
            </p>
          </div>

          <div className="h-52 rounded-xl bg-slate-900 border border-border text-white flex flex-col items-center justify-center p-4 text-center space-y-2">
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-status-safe/60 flex items-center justify-center">
              {isReceiving ? (
                <div className="text-center space-y-1.5">
                  <div className="animate-spin w-5 h-5 rounded-full border-2 border-status-safe border-t-transparent mx-auto" />
                  <p className="text-xs font-semibold text-status-safe">
                    Membaca ({capturedFrames.length}/{totalFrames})
                  </p>
                </div>
              ) : capturedFrames.length === totalFrames ? (
                <div className="text-center space-y-1">
                  <Icon name="check" variant="bold" size={28} className="text-status-safe mx-auto" />
                  <p className="text-xs font-semibold text-status-safe">
                    Selesai
                  </p>
                </div>
              ) : (
                <Icon name="qr-code" variant="linear" size={36} className="text-white/40" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-text-muted">Progres Penerimaan:</span>
              <span className="font-bold text-primary">{progressPercent}%</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: totalFrames }).map((_, idx) => {
                const isCaptured = capturedFrames.includes(idx + 1);
                return (
                  <div
                    key={idx}
                    className={`py-1 rounded-md text-center text-xs font-semibold border transition-all ${
                      isCaptured
                        ? "bg-status-safe-bg text-status-safe border-status-safe-border"
                        : "bg-surface-subtle text-text-subtle border-border"
                    }`}
                  >
                    {idx + 1} {isCaptured ? "✓" : ""}
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            variant="primary"
            className="w-full justify-center"
            disabled={isReceiving}
            onClick={startReceive}
            icon="search"
            iconVariant="bold"
          >
            {isReceiving ? "Sedang Memindai..." : "Mulai Pindai Kamera"}
          </Button>
        </Card>
      )}
    </div>
  );
}
