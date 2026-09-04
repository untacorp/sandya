"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { PageHeader } from "@/shared/ui/page-header";
import { type DisasterMission, type Posko } from "@/shared/types";

export default function MissionSettingsPage() {
  const { session, missions, poskos } = usePoskoStore();

  const mission: DisasterMission =
    missions.find((m) => m.id === session.missionId) ||
    missions[0] || {
      id: session.missionId || "MSN-2026-01",
      orgId: session.orgId || "ORG-01",
      name: session.missionName || "Tanggap Darurat Bencana",
      disasterType: "GEMPA_BUMI",
      status: "ACTIVE_EMERGENCY",
      targetDays: 14,
      location: "Wilayah Terdampak Bencana",
      createdAt: 0,
    };

  const missionPoskos: Posko[] = poskos.filter((p) => p.missionId === mission.id);

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
        return "Tanggap Darurat";
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Page Header without redundant back button */}
      <PageHeader
        title="Pengaturan Operasi Misi"
      />

      {/* Mission Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profil Operasi Bencana</CardTitle>
            <Badge variant="safe" size="sm">
              {mission.status === "ACTIVE_EMERGENCY" ? "Operasi Aktif" : "Masa Pemulihan"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nama Operasi Misi"
              value={mission.name}
              disabled
              icon="buildings"
            />
            <Input
              label="Jenis Bencana"
              value={getDisasterLabel(mission.disasterType)}
              disabled
              icon="shield"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Wilayah / Cakupan Lokasi"
              value={mission.location}
              disabled
              icon="pin"
            />
            <Input
              label="Target Waktu Tanggap Darurat"
              value={`~${mission.targetDays} Hari`}
              disabled
              icon="clock"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <Link href="/org">
              <Button variant="outline" size="sm" iconRight="arrow-right">
                Buka Markas Lembaga Induk
              </Button>
            </Link>
            <Link href={`/missions/${mission.id}/poskos/create`}>
              <Button variant="primary" size="sm" icon="add-circle" iconVariant="bold">
                + Buka Posko Lapangan Baru
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Connected Poskos */}
      <Card>
        <CardHeader>
          <CardTitle>Posko Lapangan Terdaftar ({missionPoskos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {missionPoskos.map((p) => (
              <div
                key={p.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-text-main truncate">{p.name}</h4>
                  <p className="text-xs text-text-muted">
                    {p.locationName} • Kapasitas: {p.currentRefugees} / {p.capacity} Jiwa
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/posko/${p.id}`} className="w-full sm:w-auto">
                    <Button variant="secondary" size="sm" iconRight="arrow-right" className="w-full sm:w-auto">
                      Masuk Posko
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
