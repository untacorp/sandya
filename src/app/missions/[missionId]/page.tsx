"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { StatCard } from "@/shared/ui/stat-card";
import { PoskoCard } from "@/shared/ui/posko-card";
import { AlertBanner } from "@/shared/ui/alert-banner";
import { PageHeader } from "@/shared/ui/page-header";
import { type DisasterMission, type Posko } from "@/shared/types";

export default function MissionOverviewPage() {
  const { session, missions, poskos, updatePoskoStatus } = usePoskoStore();

  const mission: DisasterMission =
    missions.find((m: DisasterMission) => m.id === session.missionId) ||
    missions[0] || {
      id: session.missionId || "MSN-2026-01",
      orgId: session.orgId || "ORG-01",
      name: session.missionName || "Tanggap Darurat Bencana",
      disasterType: "GEMPA_BUMI" as const,
      status: "ACTIVE_EMERGENCY" as const,
      targetDays: 14,
      location: "Wilayah Terdampak Bencana",
      createdAt: 0,
    };

  const missionPoskos: Posko[] = poskos.filter((p: Posko) => p.missionId === mission.id);

  const totalRefugees = 513 + 320 + 850 + 180;
  const redTriage = 3 + 1 + 8 + 2; // 14 Red patients

  // Evacuation alerts
  const evacuationPosko = missionPoskos.find((p: Posko) => p.status === "HAZARD_EVACUATION");

  return (
    <div className="space-y-5">
      {/* Evacuation Alert Banner */}
      {evacuationPosko && (
        <AlertBanner
          variant="danger"
          title={`Perhatian: Evakuasi ${evacuationPosko.name}`}
          description="Status Siaga Gempa Susulan. 180 warga sedang dialihkan ke Posko GOR Pacet."
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
            + Buka Posko Lapangan
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
          value="6.000"
          unit="Kg"
          subtitle="Ketahanan ~14 hari"
          icon="box"
          variant="safe"
        />

        <StatCard
          title="Posko Terhubung"
          value={`${missionPoskos.length} Posko`}
          subtitle="Tersinkronisasi"
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
          <Link href={`/missions/${mission.id}/poskos`}>
            <Button variant="ghost" size="sm" iconRight="arrow-right" className="text-xs h-7">
              Lihat Semua
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {missionPoskos.map((p: Posko) => (
            <PoskoCard
              key={p.id}
              posko={p}
              onToggleStatus={updatePoskoStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
