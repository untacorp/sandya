"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { useMeshSync } from "@/features/posko/hooks/use-mesh-sync";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

export default function SyncHubPage() {
  const params = useParams();
  const routePoskoId = (params?.poskoId as string) || "";
  const { session, pendingOutboxCount, triggerCloudSync, simulateSync } = usePoskoStore();
  const { peers, meshRadioStatus, toggleBluetoothRadio, triggerManualGossip } = useMeshSync();
  const effectivePoskoId = routePoskoId || session.poskoId || "POS-01";
  const [syncing, setSyncing] = React.useState(false);
  const [syncFeedback, setSyncFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await triggerCloudSync();
      setSyncFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch {
      simulateSync();
      triggerManualGossip();
      setSyncFeedback({
        type: 'success',
        message: 'Data tersinkronisasi dalam mode mesh lokal.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const getRadioBadge = () => {
    switch (meshRadioStatus) {
      case "CONNECTED":
        return {
          label: "Aktif (Terhubung)",
          badgeClass: "text-status-safe bg-status-safe-bg border-status-safe-border",
        };
      case "SCANNING":
        return {
          label: "Memindai Sinyal...",
          badgeClass: "text-status-warning bg-status-warning-bg border-status-warning-border animate-pulse",
        };
      case "BLUETOOTH_OFF":
        return {
          label: "Bluetooth Mati",
          badgeClass: "text-status-danger bg-status-danger-bg border-status-danger-border",
        };
      case "PERMISSION_DENIED":
        return {
          label: "Izin Ditolak",
          badgeClass: "text-status-danger bg-status-danger-bg border-status-danger-border",
        };
      default:
        return {
          label: "Siaga (Idle)",
          badgeClass: "text-text-muted bg-surface-subtle border-border",
        };
    }
  };

  const radioBadge = getRadioBadge();

  return (
    <div className="space-y-4">
      {/* 2. Kartu Utama: Pembaruan Nirkabel Otomatis */}
      <Card className="border border-border bg-surface shadow-2xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold ${
                  meshRadioStatus === "BLUETOOTH_OFF"
                    ? "bg-status-danger-bg border-status-danger-border text-status-danger"
                    : "bg-status-safe-bg border-status-safe-border text-status-safe"
                }`}
              >
                <Icon name="radar" variant="bold" size={18} />
              </div>
              <div>
                <CardTitle className="text-sm">Pembaruan Otomatis Antar-Petugas (BLE Mesh)</CardTitle>
                <p className="text-xs text-text-muted mt-0.5">
                  HP Anda secara otomatis bertukar data saat berdekatan dengan HP petugas lain tanpa internet.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${radioBadge.badgeClass}`}>
                {radioBadge.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={toggleBluetoothRadio}
                title="Simulasikan Sakelar Hardware Bluetooth"
              >
                <Icon name={meshRadioStatus === "BLUETOOTH_OFF" ? "shield" : "sync"} size={14} />
                <span className="sr-only">Toggle Radio</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {meshRadioStatus === "BLUETOOTH_OFF" && (
            <div className="p-3 rounded-lg bg-status-danger-bg border border-status-danger-border text-status-danger text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="alert" variant="bold" size={16} />
                <span>Radio Bluetooth perangkat dalam keadaan mati. Sinkronisasi mesh dijeda.</span>
              </div>
              <Button size="sm" variant="danger" className="h-7 text-xs" onClick={toggleBluetoothRadio}>
                Nyalakan Bluetooth
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted font-medium">Petugas Terhubung</span>
              <p className="text-base font-bold text-text-main mt-0.5">
                {peers.length} HP
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted font-medium">Data Menunggu Dikirim</span>
              <p className="text-base font-bold text-text-main mt-0.5">
                {pendingOutboxCount} Data Baru
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
              <span className="text-text-muted font-medium">Kondisi Sinkronisasi</span>
              <p className="text-base font-bold text-status-safe mt-0.5">
                {pendingOutboxCount === 0 ? "Sudah Sinkron" : "Perlu Terhubung"}
              </p>
            </div>
          </div>

          {syncFeedback && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                syncFeedback.type === 'success'
                  ? 'bg-status-safe-bg border-status-safe-border text-status-safe'
                  : 'bg-status-danger-bg border-status-danger-border text-status-danger'
              }`}
            >
              <Icon name={syncFeedback.type === 'success' ? 'check' : 'alert'} variant="bold" size={16} className="shrink-0 mt-0.5" />
              <span>{syncFeedback.message}</span>
            </div>
          )}

          <Button
            variant="primary"
            loading={syncing}
            onClick={handleManualSync}
            icon="sync"
            iconVariant="bold"
            className="w-full justify-center"
          >
            Perbarui Data Sekarang
          </Button>
        </CardContent>
      </Card>

  {/* 3. Pilihan Cara Lain (Spasi Rasional) */}
  <div className="space-y-2">
  <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
  Pilihan Cara Pengiriman Lain
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {/* Pilihan 1: Layar HP */}
  <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
  <div className="flex items-center gap-2.5">
  <div className="w-8 h-8 rounded-lg bg-surface-muted text-text-main flex items-center justify-center border border-border">
  <Icon name="qr-code" variant="bold" size={16} />
  </div>
  <div>
  <h3 className="text-sm font-bold text-text-main">
  Pindai dari Layar HP
  </h3>
  <p className="text-xs text-text-muted">
  Kirim data dengan saling memindai layar HP.
  </p>
  </div>
  </div>

  <Link href={`/posko/${effectivePoskoId}/sync/animated-qr`} className="block">
  <Button
  variant="secondary"
  size="sm"
  className="w-full justify-between"
  icon="qr-code"
  iconVariant="bold"
  iconRight="arrow-right"
  >
  Buka Pemindai Layar
  </Button>
  </Link>
  </div>

  {/* Pilihan 2: Berkas Cetak */}
  <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
  <div className="flex items-center gap-2.5">
  <div className="w-8 h-8 rounded-lg bg-surface-muted text-text-main flex items-center justify-center border border-border">
  <Icon name="printer" variant="bold" size={16} />
  </div>
  <div>
  <h3 className="text-sm font-bold text-text-main">
  Cetak Lembar Kode QR
  </h3>
  <p className="text-xs text-text-muted">
  Cetak lembar kertas untuk ditempel di posko.
  </p>
  </div>
  </div>

  <Link href={`/posko/${effectivePoskoId}/sync/poster`} className="block">
  <Button
  variant="secondary"
  size="sm"
  className="w-full justify-between"
  icon="printer"
  iconVariant="bold"
  iconRight="arrow-right"
  >
  Buka Berkas Cetak
  </Button>
  </Link>
  </div>
  </div>
  </div>
  </div>
  );
}
