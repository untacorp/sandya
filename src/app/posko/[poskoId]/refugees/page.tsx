"use client";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Tabs } from "@/shared/ui/tabs";
import { Icon } from "@/shared/ui/icon";
import { Dialog } from "@/shared/ui/dialog";
import { type VulnerabilityCategory, type TriageCategory, type DisasterPerson } from "@/shared/types";

export default function RefugeesPage() {
  const { session, refugees } = usePoskoStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedVulnerability, setSelectedVulnerability] = React.useState<string>("ALL");
  const [selectedTriage, setSelectedTriage] = React.useState<string>("ALL");
  const [selectedPersonId, setSelectedPersonId] = React.useState<string>(
    refugees[0]?.id || "REF-001"
  );
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);

  const filteredRefugees = refugees.filter((r) => {
    const matchSearch =
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.nik && r.nik.includes(searchQuery)) ||
      r.domicileOrigin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.shelterLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchVulnerability =
      selectedVulnerability === "ALL" ||
      r.vulnerabilities.includes(selectedVulnerability as VulnerabilityCategory);

    const matchTriage =
      selectedTriage === "ALL" || r.triageStatus === (selectedTriage as TriageCategory);

    return matchSearch && matchVulnerability && matchTriage;
  });

  const selectedPerson =
    refugees.find((r) => r.id === selectedPersonId) || filteredRefugees[0] || refugees[0];

  const handleSelectPerson = (person: DisasterPerson) => {
    setSelectedPersonId(person.id);
    setMobileDetailOpen(true);
  };

  const getTriageBadge = (triage?: string) => {
    switch (triage) {
      case "RED":
        return <Badge variant="triage-red" size="sm">Perlu Segera</Badge>;
      case "YELLOW":
        return <Badge variant="triage-yellow" size="sm">Rawat Jalan</Badge>;
      case "BLACK":
        return <Badge variant="triage-black" size="sm">Meninggal</Badge>;
      default:
        return <Badge variant="triage-green" size="sm">Sehat</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Sub-Navigasi Sederhana */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          items={[
            { id: "list", label: "Daftar Warga", icon: "users", badgeCount: refugees.length, href: `/posko/${session.poskoId}/refugees` },
            { id: "triage", label: "Pemeriksaan Medis", icon: "health", href: `/posko/${session.poskoId}/refugees/triage` },
            { id: "reunion", label: "Pencarian Keluarga", icon: "search", href: `/posko/${session.poskoId}/refugees/reunion` },
          ]}
          activeId="list"
          variant="segmented"
          className="w-full sm:w-auto"
        />

        <span className="text-xs text-text-muted">
          Total: <strong>{refugees.length} Warga</strong> di posko ini
        </span>
      </div>

      {/* 2. Pencarian & Filter Ringkas */}
      <div className="p-3 rounded-xl bg-surface border border-border shadow-2xs space-y-2">
        <Input
          placeholder="Cari nama warga, nomor KTP/NIK, dusun, atau nomor tenda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon="search"
          className="text-xs"
        />

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-text-muted font-medium mr-1 text-[11px]">Kategori:</span>
          {["ALL", "BALITA", "IBU_HAMIL", "LANSIA", "DISABILITAS"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedVulnerability(v)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                selectedVulnerability === v
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-surface-subtle text-text-muted hover:text-text-main border border-border"
              }`}
            >
              {v === "ALL" ? "Semua Warga" : v.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Daftar Warga (Layout Bersih & Master-Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kolom Kiri: Tabel / Daftar Warga (7 Kolom) */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-border shadow-2xs overflow-hidden">
          {filteredRefugees.length === 0 ? (
            <div className="p-8 text-center space-y-1">
              <Icon name="users" variant="linear" size={24} className="mx-auto text-text-muted" />
              <p className="text-sm font-semibold text-text-main">Warga tidak ditemukan</p>
              <p className="text-xs text-text-muted">Coba ubah kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredRefugees.map((person) => {
                const isSelected = person.id === selectedPerson?.id;
                return (
                  <div
                    key={person.id}
                    onClick={() => handleSelectPerson(person)}
                    className={`p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-surface-muted border-l-3 border-l-primary"
                        : "hover:bg-surface-subtle"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTriageBadge(person.triageStatus)}
                        <h3 className="text-sm font-bold text-text-main truncate">
                          {person.fullName}
                        </h3>
                        <span className="text-xs text-text-muted">
                          {person.age} Thn ({person.gender === "M" ? "L" : "P"})
                        </span>
                        {person.nik && (
                          <span className="text-[11px] font-mono text-text-muted">
                            NIK: {person.nik}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">
                        <span className="font-medium text-text-main">{person.shelterLocation}</span>
                        <span className="mx-1.5">•</span>
                        <span>Asal {person.domicileOrigin}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Icon
                        name="arrow-right"
                        variant="linear"
                        size={14}
                        className="text-text-subtle"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Detail Warga Terpilih (5 Kolom Desktop) */}
        {selectedPerson && (
          <div className="hidden lg:block lg:col-span-5 sticky top-20">
            <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-4">
              {/* Header Warga */}
              <div className="border-b border-border pb-3 space-y-1.5">
                <div>
                  {getTriageBadge(selectedPerson.triageStatus)}
                </div>
                <h3 className="text-base font-bold text-text-main">
                  {selectedPerson.fullName}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {selectedPerson.age} Tahun • {selectedPerson.gender === "M" ? "Laki-laki" : "Perempuan"}
                  {selectedPerson.nik ? ` • NIK: ${selectedPerson.nik}` : " • Tanpa KTP"}
                </p>
              </div>

              {/* Atribut Lokasi */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                  <span className="text-text-muted text-[11px] block">Tempat Tinggal:</span>
                  <span className="font-semibold text-text-main">{selectedPerson.shelterLocation}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                  <span className="text-text-muted text-[11px] block">Asal Dusun:</span>
                  <span className="font-semibold text-text-main">{selectedPerson.domicileOrigin}</span>
                </div>
              </div>

              {/* Kerabat & Kebutuhan jika ada */}
              {(selectedPerson.missingKinName || (selectedPerson.urgentNeeds && selectedPerson.urgentNeeds.length > 0)) && (
                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1.5 text-xs">
                  {selectedPerson.missingKinName && (
                    <div>
                      <span className="text-text-muted text-[11px] block">Kerabat Dicari:</span>
                      <span className="font-semibold text-text-main">{selectedPerson.missingKinName}</span>
                    </div>
                  )}
                  {selectedPerson.urgentNeeds && selectedPerson.urgentNeeds.length > 0 && (
                    <div>
                      <span className="text-text-muted text-[11px] block mb-1">Kebutuhan Mendesak:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPerson.urgentNeeds.map((need) => (
                          <span
                            key={need}
                            className="px-2 py-0.5 rounded bg-status-warning-bg text-status-warning border border-status-warning-border font-medium text-[11px]"
                          >
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Catatan Peristiwa */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-text-main block">
                  Riwayat & Catatan:
                </span>
                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1">
                  <p className="font-medium text-text-main">08:30 WIB • Terdaftar Pertama Kali</p>
                  <p className="text-text-muted text-[11px]">
                    Didata oleh {selectedPerson.registeredByUserName} (Relawan).
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1">
                  <p className="font-medium text-text-main">10:15 WIB • Pemeriksaan Kesehatan</p>
                  <p className="text-text-muted text-[11px]">
                    Suhu tubuh 38.5°C, tensi normal. Diberikan Paracetamol.
                  </p>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="pt-2 border-t border-border flex items-center gap-2">
                <Link
                  href={`/posko/${session.poskoId}/logistics/distribute`}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    Beri Bantuan
                  </Button>
                </Link>
                <Link
                  href={`/posko/${session.poskoId}/refugees/${selectedPerson.id}`}
                  className="flex-1"
                >
                  <Button variant="secondary" size="sm" className="w-full justify-center">
                    Buka Riwayat
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modal Detail Warga untuk Tampilan Mobile */}
      {selectedPerson && (
        <Dialog
          open={mobileDetailOpen}
          onOpenChange={setMobileDetailOpen}
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Header Warga */}
            <div className="border-b border-border pb-3 space-y-1.5">
              <div>
                {getTriageBadge(selectedPerson.triageStatus)}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-main">
                {selectedPerson.fullName}
              </h3>
              <p className="text-xs text-text-muted">
                {selectedPerson.age} Tahun • {selectedPerson.gender === "M" ? "Laki-laki" : "Perempuan"}
                {selectedPerson.nik ? ` • NIK: ${selectedPerson.nik}` : " • Tanpa KTP"}
              </p>
            </div>

            {/* Atribut Lokasi */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                <span className="text-text-muted text-[11px] block">Tempat Tinggal:</span>
                <span className="font-semibold text-text-main">{selectedPerson.shelterLocation}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                <span className="text-text-muted text-[11px] block">Asal Dusun:</span>
                <span className="font-semibold text-text-main">{selectedPerson.domicileOrigin}</span>
              </div>
            </div>

            {/* Kerabat & Kebutuhan jika ada */}
            {(selectedPerson.missingKinName || (selectedPerson.urgentNeeds && selectedPerson.urgentNeeds.length > 0)) && (
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1.5 text-xs">
                {selectedPerson.missingKinName && (
                  <div>
                    <span className="text-text-muted text-[11px] block">Kerabat Dicari:</span>
                    <span className="font-semibold text-text-main">{selectedPerson.missingKinName}</span>
                  </div>
                )}
                {selectedPerson.urgentNeeds && selectedPerson.urgentNeeds.length > 0 && (
                  <div>
                    <span className="text-text-muted text-[11px] block mb-1">Kebutuhan Mendesak:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPerson.urgentNeeds.map((need) => (
                        <span
                          key={need}
                          className="px-2 py-0.5 rounded bg-status-warning-bg text-status-warning border border-status-warning-border font-medium text-[11px]"
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Catatan Peristiwa */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-text-main block">
                Riwayat & Catatan:
              </span>
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1">
                <p className="font-medium text-text-main">08:30 WIB • Terdaftar Pertama Kali</p>
                <p className="text-text-muted text-[11px]">
                  Didata oleh {selectedPerson.registeredByUserName} (Relawan).
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1">
                <p className="font-medium text-text-main">10:15 WIB • Pemeriksaan Kesehatan</p>
                <p className="text-text-muted text-[11px]">
                  Suhu tubuh 38.5°C, tensi normal. Diberikan Paracetamol.
                </p>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2 border-t border-border flex items-center gap-2">
              <Link
                href={`/posko/${session.poskoId}/logistics/distribute`}
                className="flex-1"
                onClick={() => setMobileDetailOpen(false)}
              >
                <Button variant="primary" size="sm" className="w-full justify-center">
                  Beri Bantuan
                </Button>
              </Link>
              <Link
                href={`/posko/${session.poskoId}/refugees/${selectedPerson.id}`}
                className="flex-1"
                onClick={() => setMobileDetailOpen(false)}
              >
                <Button variant="secondary" size="sm" className="w-full justify-center">
                  Buka Riwayat
                </Button>
              </Link>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
