"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

export default function SyncHubPage() {
  const { session, peers, pendingOutboxCount, simulateSync } = usePoskoStore();
  const [syncing, setSyncing] = React.useState(false);

  const handleManualSync = () => {
  setSyncing(true);
  setTimeout(() => {
  simulateSync();
  setSyncing(false);
  }, 1000);
  };

  return (
  <div className="space-y-4">
  {/* 2. Kartu Utama: Pembaruan Nirkabel Otomatis */}
  <Card className="border border-border bg-surface shadow-2xs">
  <CardHeader>
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
  <div className="w-9 h-9 rounded-lg bg-status-safe-bg border border-status-safe-border text-status-safe flex items-center justify-center font-bold">
  <Icon name="radar" variant="bold" size={18} />
  </div>
  <div>
  <CardTitle className="text-sm">Pembaruan Otomatis Antar-Petugas</CardTitle>
  <p className="text-xs text-text-muted mt-0.5">
  HP Anda secara otomatis bertukar data saat berdekatan dengan HP petugas lain.
  </p>
  </div>
  </div>
  <span className="text-xs font-semibold text-status-safe bg-status-safe-bg px-2 py-0.5 rounded border border-status-safe-border">
  Aktif
  </span>
  </div>
  </CardHeader>
  <CardContent className="space-y-3 pt-0">
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

  <Link href={`/posko/${session.poskoId}/sync/animated-qr`} className="block">
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

  <Link href={`/posko/${session.poskoId}/sync/poster`} className="block">
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
