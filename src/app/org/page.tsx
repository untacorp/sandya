"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { EmptyState } from "@/shared/ui/empty-state";

export default function OrganizationConsolePage() {
  const {
  session,
  organizations,
  missions,
  poskos,
  refugees,
  cloudProvider,
  cloudEndpoint,
  pendingOutboxCount,
  lastSyncedAt,
  isCloudSyncing,
  triggerCloudSync,
  } = usePoskoStore();

  const [syncToast, setSyncToast] = React.useState<string | null>(null);

  const org = organizations.find((o) => o.id === session.orgId) || organizations[0] || {
  id: session.orgId || "ORG-LOCAL",
  name: session.orgName || "Pusat Komando Wilayah",
  category: "BPBD_PEMDA",
  createdAt: Date.now(),
  };
  const activeMissions = missions.filter((m) => m.status !== "CLOSED_ARCHIVED");
  const totalRefugees = poskos.reduce(
  (sum, p) => sum + (p.id === session.poskoId ? refugees.length : p.currentRefugees),
  0
  );
  const warehouseCount = poskos.filter((p) => p.postType === "MAIN_WAREHOUSE").length;
  const fieldPostCount = poskos.filter((p) => p.postType !== "MAIN_WAREHOUSE").length;

  const handleCloudSync = async () => {
  const res = await triggerCloudSync();
  if (res.success) {
  setSyncToast(res.message);
  setTimeout(() => setSyncToast(null), 4500);
  }
  };

  const getDisasterLabel = (type: string) => {
  switch (type) {
  case "GEMPA_BUMI":
  return "Gempa Bumi";
  case "BANJIR_BANDANG":
  return "Banjir Bandang";
  case "LONGSOR":
  return "Tanah Longsor";
  case "ERUPSI_GUNUNG":
  return "Erupsi Gunung";
  default:
  return "Tanggap Bencana";
  }
  };

  return (
  <div className="space-y-5">
  {/* 1. Header Ringkas Organisasi */}
  <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
  <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shrink-0">
  {org.name.charAt(0)}
  </div>
  <div>
  <div className="flex items-center gap-2">
  <h1 className="text-base font-bold text-text-main">
  {org.name}
  </h1>
  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-muted border border-border text-text-muted">
  {org.category === "PMI_LEMBAGA" ? "Palang Merah Indonesia" : "BPBD / Pemerintah"}
  </span>
  </div>
  <p className="text-xs text-text-muted mt-0.5">
  Pusat komando induk penanganan bencana dan koordinasi posko wilayah.
  </p>
  </div>
  </div>

  <div className="flex items-center gap-2 shrink-0">
  <Link href="/org/settings">
  <Button variant="outline" size="sm" icon="sync">
  Pengaturan Cloud
  </Button>
  </Link>
  <Link href="/org/missions/create">
  <Button variant="primary" size="sm">
  + Buka Operasi Baru
  </Button>
  </Link>
  </div>
  </div>

  {/* 2. Cloud Sync Telemetry & Uplink Bar */}
  <div className="p-3.5 rounded-xl border border-border bg-surface-subtle shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
  <Icon name="radar" variant="bold" size={16} />
  </div>
  <div className="space-y-0.5 min-w-0">
  <div className="flex items-center gap-2 flex-wrap">
  <span className="text-xs font-bold text-text-main">
  Status Sinkronisasi Cloud:
  </span>
  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-safe-bg text-status-safe border border-status-safe-border flex items-center gap-1">
  <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
  {cloudProvider === "MANAGED" ? "Cloud Resmi Sandya" : "BYOC Instansi"}
  </span>
  </div>
  <p className="text-[11px] text-text-muted truncate">
  Endpoint: <span className="font-mono">{cloudEndpoint}</span> • Terakhir sinkron:{" "}
  <strong>
  {new Date(lastSyncedAt).toLocaleTimeString("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  })}{" "}
  WIB
  </strong>
  {pendingOutboxCount > 0 ? (
  <span className="text-status-warning font-semibold ml-1.5">
  ({pendingOutboxCount} data antrean outbox)
  </span>
  ) : (
  <span className="text-status-safe font-semibold ml-1.5">
  (Semua data tersinkron)
  </span>
  )}
  </p>
  </div>
  </div>

  <Button
  variant="primary"
  size="sm"
  loading={isCloudSyncing}
  onClick={handleCloudSync}
  icon="sync"
  iconVariant="bold"
  className="shrink-0"
  >
  {isCloudSyncing ? "Menyinkronkan..." : "Sinkronkan ke Cloud"}
  </Button>
  </div>

  {syncToast && (
  <div className="p-3 rounded-xl bg-status-safe-bg border border-status-safe-border text-status-safe text-xs font-semibold flex items-center gap-2 shadow-2xs">
  <Icon name="check" variant="bold" size={16} />
  <span>{syncToast}</span>
  </div>
  )}

  {/* 2. Tiga Ringkasan Utama (Spasi Rasional) */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-1">
  <span className="text-xs font-semibold text-text-muted">Operasi Tanggap Bencana</span>
  <div className="flex items-baseline gap-1.5 pt-1">
  <span className="text-2xl font-bold text-text-main">
  {activeMissions.length}
  </span>
  <span className="text-xs text-text-muted">Wilayah Aktif</span>
  </div>
  <p className="text-[11px] text-text-muted">
  Dari total {missions.length} operasi yang terdata
  </p>
  </div>

  <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-1">
  <span className="text-xs font-semibold text-text-muted">Posko Lapangan Terhubung</span>
  <div className="flex items-baseline gap-1.5 pt-1">
  <span className="text-2xl font-bold text-text-main">
  {poskos.length}
  </span>
  <span className="text-xs text-text-muted">Titik Posko</span>
  </div>
  <p className="text-[11px] text-text-muted">
  {warehouseCount > 0 ? `${warehouseCount} Gudang Wilayah, ` : ""}{fieldPostCount} Posko Lapangan
  </p>
  </div>

  <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-1">
  <span className="text-xs font-semibold text-text-muted">Total Warga Terdampak</span>
  <div className="flex items-baseline gap-1.5 pt-1">
  <span className="text-2xl font-bold text-primary">
  {totalRefugees.toLocaleString()}
  </span>
  <span className="text-xs text-text-muted">Jiwa Terdata</span>
  </div>
  <p className="text-[11px] text-text-muted">
  Tersinkronisasi dari seluruh posko lapangan
  </p>
  </div>
  </div>

  {/* 3. Daftar Operasi Bencana yang Sedang Berjalan */}
  <div className="space-y-3">
  <div className="flex items-center justify-between">
  <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
  Daftar Operasi Tanggap Bencana
  </h2>
  <span className="text-xs text-text-muted">
  Klik operasi untuk melihat rincian posko & logistik
  </span>
  </div>

  {missions.length === 0 ? (
  <EmptyState
  icon="radar"
  title="Belum Ada Operasi Bencana Terdaftar"
  description="Belum ada operasi tanggap darurat bencana yang dibuka di bawah organisasi ini. Buat operasi baru untuk mengoordinasikan posko dan distribusi logistik."
  actionLabel="+ Buka Operasi Baru"
  actionIcon="add-circle"
  actionHref="/org/missions/create"
  />
  ) : (
  <div className="space-y-2.5">
  {missions.map((m) => {
  const missionPoskos = poskos.filter((p) => p.missionId === m.id);
  const isSelected = m.id === session.missionId;

  return (
  <div
  key={m.id}
  className={`p-4 rounded-xl border bg-surface transition-colors shadow-2xs ${
  isSelected ? "border-primary/40" : "border-border hover:border-border-hover"
  }`}
  >
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <div className="space-y-1.5 min-w-0">
  <div className="flex items-center gap-1.5 flex-wrap">
  <Badge variant="primary" size="sm">
  {getDisasterLabel(m.disasterType)}
  </Badge>
  <Badge variant="safe" size="sm">
  {m.status === "ACTIVE_EMERGENCY" ? "Sedang Berlangsung" : "Masa Pemulihan"}
  </Badge>
  </div>

  <h3 className="text-sm font-bold text-text-main">
  {m.name}
  </h3>

  <p className="text-xs text-text-muted">
  Wilayah: {m.location} • Target Operasi: ~{m.targetDays} Hari
  </p>

  <p className="text-xs text-text-muted">
  Terhubung ke <strong>{missionPoskos.length} Posko Lapangan</strong>
  </p>
  </div>

  <Link href={`/missions/${m.id}`} className="shrink-0">
  <Button
  variant="primary"
  size="sm"
  iconRight="arrow-right"
  >
  Buka Ringkasan Wilayah
  </Button>
  </Link>
  </div>
  </div>
  );
  })}
  </div>
  )}
  </div>
  </div>
  );
}
