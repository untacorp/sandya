"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";

export default function OrganizationConsolePage() {
  const { session, organizations, missions, poskos, refugees } = usePoskoStore();

  const org = organizations.find((o) => o.id === session.orgId) || organizations[0];
  const activeMissions = missions.filter((m) => m.status !== "CLOSED_ARCHIVED");
  const totalRefugees = refugees.length + 508 + 320 + 850 + 180;

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

        <Link href="/org/missions/create" className="shrink-0">
          <Button variant="primary" size="sm">
            + Buka Operasi Baru
          </Button>
        </Link>
      </div>

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
            1 Gudang Utama Wilayah, 3 Posko Lapangan
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
      </div>
    </div>
  );
}
