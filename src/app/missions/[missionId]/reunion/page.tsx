"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";

export default function MissionReunionRadarPage() {
  const { session } = usePoskoStore();
  const [search, setSearch] = React.useState("");

  const crossPoskoMatches = [
    {
      id: "MATCH-01",
      seekerName: "Muhammad Budi Santoso",
      seekerPosko: "Posko RW 03 Cijedil",
      targetName: "Siti Rahmawati (Istri)",
      targetPosko: "Posko GOR Pacet",
      confidence: 99,
      status: "CONFIRMED",
    },
    {
      id: "MATCH-02",
      seekerName: "Agus Wijaya (Balita)",
      seekerPosko: "Posko RW 03 Cijedil",
      targetName: "Siti Rahmawati (Ibu Kandung)",
      targetPosko: "Posko GOR Pacet",
      confidence: 98,
      status: "CONFIRMED",
    },
    {
      id: "MATCH-03",
      seekerName: "Nurul Hidayah",
      seekerPosko: "Posko RW 03 Cijedil",
      targetName: "Ahmad Hidayat (Anak)",
      targetPosko: "Posko RW 02 Gasol",
      confidence: 88,
      status: "POTENTIAL",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header without redundant back button */}
      <PageHeader
        title="Pencarian Keluarga Lintas Posko"
      />

      {/* Search Input */}
      <div className="w-full sm:max-w-sm">
        <Input
          placeholder="Cari nama warga yang terpisah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon="search"
        />
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 gap-3">
        {crossPoskoMatches.map((m) => (
          <Card key={m.id} className="p-3.5 sm:p-5">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant={m.status === "CONFIRMED" ? "safe" : "warning"}
                  size="sm"
                >
                  Kecocokan {m.confidence}%
                </Badge>
                <span className="text-xs text-text-muted font-medium">
                  {m.status === "CONFIRMED" ? "Terverifikasi (Saling Mencari)" : "Potensial"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-surface-subtle border border-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase">
                    Pencari:
                  </span>
                  <p className="font-bold text-sm text-text-main mt-0.5 truncate">
                    {m.seekerName}
                  </p>
                  <p className="text-text-muted truncate">{m.seekerPosko}</p>
                </div>

                <div className="p-3 rounded-lg bg-surface-subtle border border-border">
                  <span className="text-[10px] font-bold text-status-safe uppercase">
                    Ditemukan di:
                  </span>
                  <p className="font-bold text-sm text-text-main mt-0.5 truncate">
                    {m.targetName}
                  </p>
                  <p className="text-text-muted truncate">{m.targetPosko}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
