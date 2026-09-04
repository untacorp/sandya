"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { type UserRole } from "@/shared/types";

export default function ActivatePassPage() {
  const router = useRouter();
  const { session, setSessionRole } = usePoskoStore();

  const [mode, setMode] = React.useState<"SCAN" | "MANUAL">("SCAN");
  const [manualCode, setManualCode] = React.useState("");
  const [isScanning, setIsScanning] = React.useState(false);
  const [scannedRole, setScannedRole] = React.useState<UserRole | null>(null);

  const simulateCameraScan = (role: UserRole) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedRole(role);
    }, 400);
  };

  const handleConfirmActivation = () => {
    if (scannedRole) {
      setSessionRole(scannedRole);
      if (scannedRole === "PEMIMPIN_ORGANISASI") {
        router.push("/org");
      } else if (scannedRole === "KOMANDAN_MISI") {
        router.push(`/missions/${session.missionId}`);
      } else {
        router.push(`/posko/${session.poskoId}`);
      }
    } else {
      router.push(`/posko/${session.poskoId}`);
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case "PETUGAS_MEDIS":
        return "Petugas Medis (Kesehatan)";
      case "PETUGAS_LOGISTIK":
        return "Petugas Logistik (Gudang)";
      case "RELAWAN_LAPANGAN":
        return "Relawan Lapangan (Pendataan)";
      case "KOORDINATOR_POSKO":
        return "Koordinator Posko";
      case "KOMANDAN_MISI":
        return "Komandan Operasi Wilayah";
      case "PEMIMPIN_ORGANISASI":
        return "Pimpinan Lembaga";
      default:
        return "Tamu";
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" icon="arrow-left" iconVariant="linear">
              Kembali
            </Button>
          </Link>
          <span className="text-xs text-text-muted">Masuk Petugas</span>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-md mx-auto w-full px-4 py-8 my-auto space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main">
            Masuk sebagai Petugas
          </h1>
          <p className="text-xs text-text-muted">
            Pindai kode QR pada kartu tugas Anda untuk mulai bertugas di posko.
          </p>
        </div>

        {/* Pilihan Metode */}
        <div className="flex p-1 rounded-lg border border-border bg-surface-muted text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("SCAN");
              setScannedRole(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
              mode === "SCAN"
                ? "bg-surface text-text-main shadow-2xs font-bold"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            Pindai Kamera
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("MANUAL");
              setScannedRole(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
              mode === "MANUAL"
                ? "bg-surface text-text-main shadow-2xs font-bold"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            Ketik Kode Manual
          </button>
        </div>

        {/* Hasil Scan Sukses */}
        {scannedRole ? (
          <Card className="p-5 border-status-safe-border bg-surface space-y-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-status-safe-bg border border-status-safe-border text-status-safe flex items-center justify-center shrink-0">
                <Icon name="check" variant="bold" size={20} />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[11px] font-bold text-status-safe uppercase tracking-wider block">
                  Kartu Tugas Terbaca
                </span>
                <h2 className="text-base font-bold text-text-main">
                  {getRoleDisplayName(scannedRole)}
                </h2>
                <p className="text-xs text-text-muted">
                  Lokasi: {session.poskoName}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setScannedRole(null)}
                className="flex-1"
              >
                Pindai Ulang
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmActivation}
                icon="arrow-right"
                iconVariant="bold"
                className="flex-1 justify-center"
              >
                Mulai Bekerja
              </Button>
            </div>
          </Card>
        ) : mode === "SCAN" ? (
          /* Jendela Kamera Bersih */
          <div className="space-y-3">
            <div className="h-56 rounded-xl bg-slate-900 border border-border text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="w-36 h-36 rounded-lg border-2 border-dashed border-white/40 flex items-center justify-center">
                {isScanning ? (
                  <div className="animate-spin w-6 h-6 rounded-full border-2 border-status-safe border-t-transparent" />
                ) : (
                  <Icon name="qr-code" variant="linear" size={36} className="text-white/40" />
                )}
              </div>
              <p className="text-xs text-white/70 mt-3 font-medium">
                Arahkan kamera ke kode QR pada kartu tugas Anda
              </p>
            </div>

            {/* Opsi Cepat Pengujian */}
            <div className="p-3 rounded-xl bg-surface border border-border space-y-1.5">
              <span className="text-[11px] text-text-muted font-medium block text-center">
                Pilih peran tugas untuk simulasi:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => simulateCameraScan("PETUGAS_MEDIS")}
                  icon="health"
                  iconVariant="bold"
                  className="text-xs justify-center"
                >
                  Medis
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => simulateCameraScan("PETUGAS_LOGISTIK")}
                  icon="box"
                  iconVariant="bold"
                  className="text-xs justify-center"
                >
                  Logistik
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => simulateCameraScan("RELAWAN_LAPANGAN")}
                  icon="users"
                  iconVariant="bold"
                  className="text-xs justify-center"
                >
                  Relawan
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => simulateCameraScan("KOORDINATOR_POSKO")}
                  icon="home"
                  iconVariant="bold"
                  className="text-xs justify-center"
                >
                  Koordinator
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Ketik Kode Manual */
          <Card className="p-5 space-y-3.5 shadow-2xs">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main block">
                Kode Penugasan
              </label>
              <Input
                placeholder="misal: TUGAS-MEDIS-01"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-text-muted">
                Masukkan kode yang tertera pada lembar tugas Anda.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={() => simulateCameraScan("PETUGAS_MEDIS")}
              disabled={!manualCode.trim()}
            >
              Masuk
            </Button>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-4 py-3 text-center text-xs text-text-muted">
        Jika kartu tugas belum dicetak, hubungi Koordinator Posko Anda.
      </footer>
    </div>
  );
}
