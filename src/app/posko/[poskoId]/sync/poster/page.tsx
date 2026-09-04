"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Tabs } from "@/shared/ui/tabs";
import { Icon } from "@/shared/ui/icon";

export default function ParityPosterPage() {
  const { session, refugees } = usePoskoStore();

  const [mode, setMode] = React.useState<"PRINT" | "SCAN">("PRINT");
  const [scannedBoxes, setScannedBoxes] = React.useState<number[]>([]);
  const [isRecovering, setIsRecovering] = React.useState(false);

  const simulateScanBox = (boxIdx: number) => {
    if (!scannedBoxes.includes(boxIdx)) {
      setScannedBoxes((prev) => [...prev, boxIdx]);
    }
  };

  const handleSimulateTornPoster = () => {
    setScannedBoxes([1, 3, 4]);
    setIsRecovering(true);
    setTimeout(() => {
      setIsRecovering(false);
    }, 1500);
  };

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
          activeId="poster"
          variant="segmented"
          className="w-full sm:w-auto"
        />

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
            Cetak Lembar
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
            Pindai Lembar
          </button>
        </div>
      </div>

      {mode === "PRINT" ? (
        /* Print */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-border">
            <div>
              <h3 className="text-sm font-bold text-text-main">
                Lembar Cadangan Fisik Posko
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Cetak lembaran berisi 4 kotak QR tahan rusak untuk serah terima fisik posko.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon="printer"
                iconVariant="bold"
                onClick={() => alert("Mencetak lembar posko...")}
              >
                Cetak Thermal
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="waybill"
                iconVariant="bold"
                onClick={() => alert("Mengunduh dokumen PDF...")}
              >
                Unduh PDF
              </Button>
            </div>
          </div>

          {/* Paper Poster Preview */}
          <div className="max-w-xl mx-auto p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-4 text-text-main">
            <div className="text-center border-b border-border pb-3 space-y-0.5">
              <h2 className="text-base font-bold uppercase tracking-tight">
                Sanidya • Lembar Data Posko
              </h2>
              <p className="text-xs text-text-muted">
                {session.poskoName} • {session.missionName}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-0.5 text-xs text-text-muted">
              <p>
                Total Warga Terdata: <strong>{refugees.length + 508} Jiwa</strong> (128 KK)
              </p>
              <p>
                Petugas Penanggung Jawab: <strong>{session.userName}</strong>
              </p>
            </div>

            {/* Grid 4 QR Codes */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-surface border border-border text-center space-y-1">
                <Icon name="qr-code" variant="bold" size={80} className="mx-auto text-text-main" />
                <p className="text-xs font-mono font-medium">Kotak 1</p>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border text-center space-y-1">
                <Icon name="qr-code" variant="bold" size={80} className="mx-auto text-text-main" />
                <p className="text-xs font-mono font-medium">Kotak 2</p>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border text-center space-y-1">
                <Icon name="qr-code" variant="bold" size={80} className="mx-auto text-text-main" />
                <p className="text-xs font-mono font-medium">Kotak 3</p>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle border border-primary text-center space-y-1">
                <Icon name="qr-code" variant="bold" size={80} className="mx-auto text-primary" />
                <p className="text-xs font-mono font-medium text-primary">Kotak Pemulihan</p>
              </div>
            </div>

            <p className="text-center text-xs text-text-muted border-t border-border pt-2.5">
              Cukup pindai 3 dari 4 kode QR di atas untuk memulihkan seluruh data posko jika kertas terlipat atau sobek.
            </p>
          </div>
        </div>
      ) : (
        /* Scan */
        <Card className="max-w-md mx-auto p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-base font-bold text-text-main">
              Pindai Lembaran Kertas
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Arahkan kamera ke setiap kotak QR pada lembar posko.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((box) => {
              const isScanned = scannedBoxes.includes(box);
              return (
                <div
                  key={box}
                  onClick={() => simulateScanBox(box)}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isScanned
                      ? "bg-status-safe-bg text-status-safe border-status-safe-border font-bold"
                      : "bg-surface text-text-muted border-border hover:border-border-hover"
                  }`}
                >
                  <p className="text-xs font-semibold">
                    {box === 4 ? "Kotak Pemulihan" : `Kotak Data ${box}`}
                  </p>
                  <p className="text-[11px] mt-0.5">
                    {isScanned ? "✓ Terbaca" : "Klik untuk Pindai"}
                  </p>
                </div>
              );
            })}
          </div>

          {scannedBoxes.length >= 3 && (
            <div className="p-3 rounded-lg bg-status-safe-bg border border-status-safe-border text-status-safe text-xs space-y-0.5">
              <p className="font-bold">
                Syarat pemulihan terpenuhi ({scannedBoxes.length}/4 Kotak)
              </p>
              <p className="text-text-main">
                {scannedBoxes.length === 4
                  ? "Semua kotak terbaca sempurna."
                  : "Data lengkap berhasil dipulihkan secara otomatis."}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSimulateTornPoster}
            >
              Simulasi 1 Kotak Sobek
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setScannedBoxes([])}
            >
              Reset
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
