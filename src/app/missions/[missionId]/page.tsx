"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { StatCard } from "@/shared/ui/stat-card";
import { PoskoCard } from "@/shared/ui/posko-card";
import { useParams } from "next/navigation";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { type DisasterMission, type Posko } from "@/shared/types";

export default function MissionOverviewPage() {
  const params = useParams();
  const missionId = (params?.missionId as string) || "";
  const { session, missions, poskos, refugees, centralInventory, updatePoskoStatus } = usePoskoStore();

  const mission = missions.find((m) => m.id === missionId || m.id === session.missionId);

  if (!mission) {
  return null;
  }

  const missionPoskos: Posko[] = poskos.filter((p: Posko) => p.missionId === mission.id);

  const totalRefugees = missionPoskos.reduce(
  (sum, p) => sum + (p.id === session.poskoId ? refugees.length : p.currentRefugees),
  0
  );

  const localRedTriage = refugees.filter((r) => r.triageStatus === "RED").length;
  const redTriage = localRedTriage;

  // Central Rice / Food logistics calculation from actual store
  const riceItem = centralInventory.find((i) => i.itemName.toLowerCase().includes("beras"));
  const riceQtyKg = riceItem ? riceItem.currentQuantity * (riceItem.unit === "SAK" ? 50 : 1) : 0;
  const riceBurnRate = riceItem?.burnRateDays || 0;

  // Evacuation alerts
  const evacuationPosko = missionPoskos.find((p: Posko) => p.status === "HAZARD_EVACUATION");
  const targetSafePosko = missionPoskos.find((p: Posko) => p.id !== evacuationPosko?.id && p.status === "OPERATIONAL_NORMAL") || null;

  return (
  <div className="space-y-5">
  {/* Evacuation Alert Banner */}
  {evacuationPosko && (
  <AlertBanner
  variant="danger"
  title={`Perhatian: Evakuasi ${evacuationPosko.name}`}
  description={`Status Siaga ${evacuationPosko.name}. ${evacuationPosko.currentRefugees} warga sedang dialihkan ke ${targetSafePosko?.name || "Posko Wilayah Aman"}.`}
  actionLabel="Buka Posko Ini"
  actionHref={`/posko/${evacuationPosko.id}`}
  />
  )}

  {/* Top Overview Header */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <div className="space-y-1 min-w-0">
  <div className="flex items-center gap-2">
  <Badge variant="danger" size="sm">
  Operasi Aktif
  </Badge>
  <span className="text-xs text-text-muted">
  {mission.location}
  </span>
  </div>
  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-main truncate">
  {mission.name}
  </h2>
  </div>

  <Link href={`/missions/${mission.id}/poskos/create`} className="shrink-0">
  <Button
  variant="primary"
  size="sm"
  icon="add-circle"
  iconVariant="bold"
  className="w-full sm:w-auto"
  >
    Buka Posko Lapangan
  </Button>
  </Link>
  </div>

  {/* Key Metrics */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
  <StatCard
  title="Total Warga Terdata"
  value={totalRefugees.toLocaleString()}
  unit="Jiwa"
  subtitle={`Di ${missionPoskos.length} titik posko`}
  icon="users"
  variant="primary"
  />

  <StatCard
  title="Pasien Kritis"
  value={`${redTriage} Jiwa`}
  subtitle="Memerlukan rujukan RS"
  icon="health"
  variant="danger"
  />

  <StatCard
  title="Stok Beras"
  value={riceQtyKg > 0 ? `${riceQtyKg.toLocaleString()} Kg` : "0 Kg"}
  subtitle={riceQtyKg > 0 ? `Ketahanan ~${riceBurnRate} hari` : "Belum tercatat"}
  icon="box"
  variant="safe"
  />

  <StatCard
  title="Posko Terhubung"
  value={`${missionPoskos.length} Posko`}
  subtitle={missionPoskos.length > 0 ? "Tersinkronisasi" : "Belum ada posko"}
  icon="radar"
  variant="default"
  />
  </div>

  {/* Field Posko List */}
  <div className="space-y-3">
  <div className="flex items-center justify-between gap-2">
  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
  Daftar Posko Lapangan
  </h3>
  {missionPoskos.length > 0 && (
  <Link href={`/missions/${mission.id}/poskos`}>
  <Button variant="ghost" size="sm" iconRight="arrow-right" className="text-xs h-7">
  Lihat Semua
  </Button>
  </Link>
  )}
  </div>

  {missionPoskos.length === 0 ? (
  <EmptyState
  icon="pin"
  title="Belum Ada Posko Lapangan"
  description="Belum ada posko lapangan yang dibuka untuk operasi ini."
  actionLabel="+ Buka Posko Lapangan"
  actionHref={`/missions/${mission.id}/poskos/create`}
  />
  ) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {missionPoskos.map((p: Posko) => (
  <PoskoCard
  key={p.id}
  posko={p}
  onToggleStatus={updatePoskoStatus}
  />
  ))}
  </div>
  )}
  </div>
  </div>
  );
}

