"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Dialog } from "@/shared/ui/dialog";
import { Tabs } from "@/shared/ui/tabs";
import { Icon } from "@/shared/ui/icon";

interface ReunionMatch {
  id: string;
  seekerName: string;
  seekerShelter: string;
  targetName: string;
  foundAtPosko: string;
  foundLocation: string;
  confidence: number;
  status: "CONFIRMED" | "POTENTIAL";
}

export default function FamilyReunionPage() {
  const { session, refugees } = usePoskoStore();

  const [searchName, setSearchName] = React.useState("");
  const [searchVillage, setSearchVillage] = React.useState("");
  const [passModalOpen, setPassModalOpen] = React.useState(false);
  const [selectedMatch, setSelectedMatch] = React.useState<ReunionMatch | null>(null);

  // Sample Matched Relatives across synced poskos
  const sampleMatches: ReunionMatch[] = [
    {
      id: "MATCH-01",
      seekerName: "Muhammad Budi Santoso",
      seekerShelter: "Posko RW 03 (Tenda 02)",
      targetName: "Siti Rahmawati (Istri)",
      foundAtPosko: "Posko GOR Pacet",
      foundLocation: "Ruang Kelas 2B SDN 1",
      confidence: 99,
      status: "CONFIRMED",
    },
    {
      id: "MATCH-02",
      seekerName: "Agus Wijaya (Balita)",
      seekerShelter: "Posko RW 03 (Tenda 01)",
      targetName: "Siti Rahmawati (Ibu Kandung)",
      foundAtPosko: "Posko GOR Pacet",
      foundLocation: "Ruang Kelas 2B SDN 1",
      confidence: 98,
      status: "CONFIRMED",
    },
  ];

  const handleOpenPass = (match: ReunionMatch) => {
    setSelectedMatch(match);
    setPassModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs */}
      <Tabs
        items={[
          { id: "list", label: "Daftar Pengungsi", icon: "users", href: `/posko/${session.poskoId}/refugees` },
          { id: "triage", label: "Triase Medis", icon: "health", href: `/posko/${session.poskoId}/refugees/triage` },
          { id: "reunion", label: "Temu Keluarga", icon: "search", badgeCount: sampleMatches.length, href: `/posko/${session.poskoId}/refugees/reunion` },
        ]}
        activeId="reunion"
        variant="segmented"
        className="w-full sm:w-auto"
      />

      {/* Family Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cari Kerabat di Seluruh Posko</CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Pencarian offline di seluruh data posko yang telah tersinkronisasi.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Nama kerabat yang dicari..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              icon="search"
            />
            <Input
              placeholder="Asal dusun / desa..."
              value={searchVillage}
              onChange={(e) => setSearchVillage(e.target.value)}
              icon="pin"
            />
            <Button
              variant="primary"
              icon="search"
              iconVariant="bold"
              className="w-full sm:w-auto"
            >
              Cari Kerabat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Hasil Pencocokan Temu Keluarga
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {sampleMatches.map((m) => (
            <Card
              key={m.id}
              className="p-4 sm:p-5 border-[1.5px] border-border bg-surface"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="safe" size="sm">
                      Kecocokan {m.confidence}%
                    </Badge>
                    <span className="text-xs text-text-muted font-medium">
                      {m.status === "CONFIRMED" ? "Terverifikasi (Saling Mencari)" : "Potensial"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                      <p className="text-[11px] font-bold text-text-muted uppercase">
                        Pencari di Posko Ini:
                      </p>
                      <p className="font-bold text-sm text-text-main mt-0.5">
                        {m.seekerName}
                      </p>
                      <p className="text-text-muted">{m.seekerShelter}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                      <p className="text-[11px] font-bold text-status-safe uppercase">
                        Ditemukan di:
                      </p>
                      <p className="font-bold text-sm text-text-main mt-0.5">
                        {m.targetName}
                      </p>
                      <p className="text-text-muted">
                        {m.foundAtPosko} ({m.foundLocation})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    icon="waybill"
                    iconVariant="bold"
                    onClick={() => handleOpenPass(m)}
                  >
                    Surat Reuni
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Family Reunion Pass Modal */}
      <Dialog
        open={passModalOpen}
        onOpenChange={setPassModalOpen}
        title="Surat Keterangan Temu Keluarga"
        description="Dokumen konfirmasi izin penjemputan anggota keluarga."
        maxWidth="md"
      >
        {selectedMatch && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border-[1.5px] border-border bg-surface-subtle space-y-3">
              <div className="text-center pb-2 border-b border-border">
                <h4 className="font-bold text-sm text-text-main uppercase tracking-tight">
                  Sanidya • Surat Keterangan Reuni
                </h4>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase">
                    Pihak Penjemput:
                  </span>
                  <p className="font-bold text-sm text-text-main">
                    {selectedMatch.seekerName}
                  </p>
                  <p className="text-text-muted">{selectedMatch.seekerShelter}</p>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase">
                    Pihak yang Dijemput:
                  </span>
                  <p className="font-bold text-sm text-text-main">
                    {selectedMatch.targetName}
                  </p>
                  <p className="text-text-muted">
                    {selectedMatch.foundAtPosko} • {selectedMatch.foundLocation}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPassModalOpen(false)}
              >
                Tutup
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="printer"
                iconVariant="bold"
                onClick={() => alert("Mencetak...")}
              >
                Cetak Lembar Reuni
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
