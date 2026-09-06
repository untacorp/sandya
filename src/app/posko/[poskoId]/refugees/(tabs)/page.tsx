"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Dialog } from "@/shared/ui/dialog";
import { FastIntakeModal } from "@/features/refugees/components/fast-intake-modal";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  type VulnerabilityCategory,
  type TriageCategory,
  type DisasterPerson,
} from "@/shared/types";

export default function RefugeesPage() {
  const params = useParams();
  const routePoskoId = (params?.poskoId as string) || "";
  const { session, refugees } = usePoskoStore();
  const effectivePoskoId =
    routePoskoId && routePoskoId !== "POS-LOCAL" ? routePoskoId : session.poskoId;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedVulnerability, setSelectedVulnerability] = React.useState<string>("ALL");
  const [selectedTriage, setSelectedTriage] = React.useState<string>("ALL");
  const [selectedPerson, setSelectedPerson] = React.useState<DisasterPerson | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [fastIntakeOpen, setFastIntakeOpen] = React.useState(false);

  const poskoRefugees = refugees.filter((r) => r.postId === effectivePoskoId);

  const filteredRefugees = poskoRefugees.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      r.fullName.toLowerCase().includes(query) ||
      (r.nik && r.nik.includes(query)) ||
      r.domicileOrigin.toLowerCase().includes(query) ||
      r.shelterLocation.toLowerCase().includes(query);

    const matchVulnerability =
      selectedVulnerability === "ALL" ||
      r.vulnerabilities.includes(selectedVulnerability as VulnerabilityCategory);

    const matchTriage =
      selectedTriage === "ALL" || r.triageStatus === (selectedTriage as TriageCategory);

    return matchSearch && matchVulnerability && matchTriage;
  });

  const handleRowClick = (person: DisasterPerson) => {
    setSelectedPerson(person);
    setDetailModalOpen(true);
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

  const getVulnerabilityBadges = (vulns: VulnerabilityCategory[]) => {
    if (!vulns || vulns.length === 0) {
      return <span className="text-text-subtle text-xs">-</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-1">
        {vulns.map((v) => {
          let label = v.replace("_", " ");
          let colorClass = "bg-surface-muted text-text-muted border-border";
          if (v === "BALITA") {
            label = "Balita";
            colorClass = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
          } else if (v === "IBU_HAMIL") {
            label = "Bumil";
            colorClass = "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
          } else if (v === "LANSIA") {
            label = "Lansia";
            colorClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
          } else if (v === "DISABILITAS") {
            label = "Disabilitas";
            colorClass = "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
          }
          return (
            <span
              key={v}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${colorClass}`}
            >
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Toolbar Aksi Terpadu (Search, Filter, & Add Action) */}
      <div className="p-3 sm:p-4 rounded-xl bg-surface border border-border shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Cari nama, NIK, dusun, atau blok tenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="search"
              className="text-xs"
            />
          </div>

          {/* Filter Dropdowns & Intake Button */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Triase */}
            <div className="flex-1 min-w-[130px] sm:w-36">
              <Select
                value={selectedTriage}
                onChange={(e) => setSelectedTriage(e.target.value)}
                options={[
                  { value: "ALL", label: "Semua Medis" },
                  { value: "RED", label: "Merah (Segera)" },
                  { value: "YELLOW", label: "Kuning (Darurat)" },
                  { value: "GREEN", label: "Hijau (Sehat)" },
                  { value: "BLACK", label: "Hitam" },
                ]}
              />
            </div>

            {/* Filter Kerentanan */}
            <div className="flex-1 min-w-[140px] sm:w-40">
              <Select
                value={selectedVulnerability}
                onChange={(e) => setSelectedVulnerability(e.target.value)}
                options={[
                  { value: "ALL", label: "Semua Rentan" },
                  { value: "BALITA", label: "Balita" },
                  { value: "IBU_HAMIL", label: "Ibu Hamil" },
                  { value: "LANSIA", label: "Lansia" },
                  { value: "DISABILITAS", label: "Disabilitas" },
                ]}
              />
            </div>

            {/* Tombol Utama: Intake Cepat */}
            <Button
              variant="primary"
              size="sm"
              icon="user"
              iconVariant="bold"
              onClick={() => setFastIntakeOpen(true)}
              className="w-full sm:w-auto whitespace-nowrap ml-auto md:ml-0 justify-center"
            >
              + Intake Warga
            </Button>
          </div>
        </div>

        {/* Counter Info & Reset Filter */}
        <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border/50">
          <span>
            Menampilkan <strong>{filteredRefugees.length}</strong> dari {poskoRefugees.length} warga di posko ini
          </span>
          {(searchQuery || selectedTriage !== "ALL" || selectedVulnerability !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedTriage("ALL");
                setSelectedVulnerability("ALL");
              }}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 2. Full-Width Data Table */}
      {poskoRefugees.length === 0 ? (
        <EmptyState
          icon="users"
          title="Belum Ada Data Warga Terdaftar"
          description="Belum ada data warga terdaftar di posko ini. Gunakan fitur intake kilat (30 detik) untuk mendaftarkan warga pertama secara offline."
          actionLabel="+ Intake Warga Cepat"
          actionIcon="user"
          onAction={() => setFastIntakeOpen(true)}
        />
      ) : filteredRefugees.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border shadow-2xs p-8 text-center">
          <EmptyState
            icon="search"
            title="Warga Tidak Ditemukan"
            description="Tidak ada warga yang sesuai dengan kriteria pencarian dan filter aktif."
            actionLabel="Reset Pencarian"
            onAction={() => {
              setSearchQuery("");
              setSelectedVulnerability("ALL");
              setSelectedTriage("ALL");
            }}
            className="border-none shadow-none p-0"
          />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-2xs overflow-hidden">
          {/* Mobile Card List View (Phones & Small Viewports) */}
          <div className="block md:hidden divide-y divide-border">
            {filteredRefugees.map((person) => (
              <div
                key={person.id}
                onClick={() => handleRowClick(person)}
                className="p-3.5 space-y-2 hover:bg-surface-subtle transition-colors cursor-pointer active:bg-surface-muted"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-text-main truncate">
                      {person.fullName}
                    </h3>
                    <p className="text-[11px] font-mono text-text-muted">
                      {person.nik ? `NIK: ${person.nik}` : "Tanpa KTP/NIK"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getTriageBadge(person.triageStatus)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-text-muted pt-0.5">
                  <div>
                    <span className="text-text-subtle block text-[10px]">Demografi:</span>
                    <span className="font-semibold text-text-main">{person.age} Thn</span> ({person.gender === "M" ? "L" : "P"})
                  </div>
                  <div>
                    <span className="text-text-subtle block text-[10px]">Lokasi Hunian:</span>
                    <span className="font-semibold text-text-main truncate block">{person.shelterLocation}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    {getVulnerabilityBadges(person.vulnerabilities)}
                  </div>
                  <span className="text-primary font-bold inline-flex items-center gap-0.5 text-xs shrink-0">
                    Detail <Icon name="arrow-right" size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-subtle sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  <th className="py-3 px-4">Nama Lengkap & NIK</th>
                  <th className="py-3 px-4">Demografi</th>
                  <th className="py-3 px-4">Hunian & Asal</th>
                  <th className="py-3 px-4">Status Medis</th>
                  <th className="py-3 px-4">Kelompok Rentan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRefugees.map((person) => (
                  <tr
                    key={person.id}
                    onClick={() => handleRowClick(person)}
                    className="hover:bg-surface-subtle transition-colors cursor-pointer group"
                  >
                    {/* Kolom 1: Nama & NIK */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-main group-hover:text-primary transition-colors text-xs sm:text-sm">
                        {person.fullName}
                      </div>
                      <div className="text-[11px] font-mono text-text-muted">
                        {person.nik ? `NIK: ${person.nik}` : "Tanpa KTP/NIK"}
                      </div>
                    </td>

                    {/* Kolom 2: Demografi */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-text-main">
                        {person.age} Thn
                      </span>{" "}
                      <span className="text-text-muted">
                        ({person.gender === "M" ? "Laki-laki" : "Perempuan"})
                      </span>
                    </td>

                    {/* Kolom 3: Hunian & Asal */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-main truncate max-w-[180px]">
                        {person.shelterLocation}
                      </div>
                      <div className="text-[11px] text-text-muted truncate max-w-[180px]">
                        Asal {person.domicileOrigin}
                      </div>
                    </td>

                    {/* Kolom 4: Status Medis */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getTriageBadge(person.triageStatus)}
                    </td>

                    {/* Kolom 5: Kelompok Rentan */}
                    <td className="py-3 px-4">
                      {getVulnerabilityBadges(person.vulnerabilities)}
                    </td>

                    {/* Kolom 6: Aksi */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-text-muted group-hover:text-primary font-semibold text-xs">
                        <span>Detail</span>
                        <Icon name="arrow-right" size={14} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Modal Detail Profil Warga (Elegan & Komprehensif) */}
      {selectedPerson && (
        <Dialog
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Header Dialog */}
            <div className="border-b border-border pb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1.5">{getTriageBadge(selectedPerson.triageStatus)}</div>
                <h3 className="text-base sm:text-lg font-bold text-text-main">
                  {selectedPerson.fullName}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {selectedPerson.age} Tahun •{" "}
                  {selectedPerson.gender === "M" ? "Laki-laki" : "Perempuan"}{" "}
                  {selectedPerson.nik ? `• NIK: ${selectedPerson.nik}` : "• Tanpa KTP"}
                </p>
              </div>
            </div>

            {/* Atribut Hunian & Asal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                <span className="text-text-muted text-[11px] block">Titik Tinggal / Tenda:</span>
                <span className="font-semibold text-text-main block mt-0.5">
                  {selectedPerson.shelterLocation}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                <span className="text-text-muted text-[11px] block">Dusun / Asal:</span>
                <span className="font-semibold text-text-main block mt-0.5">
                  {selectedPerson.domicileOrigin}
                </span>
              </div>
            </div>

            {/* Kelompok Rentan */}
            {selectedPerson.vulnerabilities && selectedPerson.vulnerabilities.length > 0 && (
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border text-xs space-y-1">
                <span className="text-text-muted text-[11px] block">Kelompok Rentan:</span>
                <div>{getVulnerabilityBadges(selectedPerson.vulnerabilities)}</div>
              </div>
            )}

            {/* Kerabat & Kebutuhan jika ada */}
            {(selectedPerson.missingKinName ||
              (selectedPerson.urgentNeeds && selectedPerson.urgentNeeds.length > 0)) && (
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-2 text-xs">
                {selectedPerson.missingKinName && (
                  <div>
                    <span className="text-text-muted text-[11px] block">Kerabat Dicari:</span>
                    <span className="font-semibold text-text-main">
                      {selectedPerson.missingKinName}
                    </span>
                  </div>
                )}
                {selectedPerson.urgentNeeds && selectedPerson.urgentNeeds.length > 0 && (
                  <div>
                    <span className="text-text-muted text-[11px] block mb-1">
                      Kebutuhan Mendesak:
                    </span>
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

            {/* Riwayat Singkat */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-text-main block">Catatan Pendaftaran:</span>
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-1">
                <p className="font-medium text-text-main">
                  Terdaftar:{" "}
                  {new Date(selectedPerson.createdAt || Date.now()).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  WIB
                </p>
                <p className="text-text-muted text-[11px]">
                  Didata oleh {selectedPerson.registeredByUserName || "Petugas Posko"}. Hunian:{" "}
                  {selectedPerson.shelterLocation}.
                </p>
              </div>
            </div>

            {/* Tombol Aksi Langsung */}
            <div className="pt-2 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center gap-2">
              <Link
                href={`/posko/${effectivePoskoId}/logistics/distribute`}
                className="w-full sm:flex-1"
                onClick={() => setDetailModalOpen(false)}
              >
                <Button variant="primary" size="md" className="w-full justify-center">
                  Beri Bantuan
                </Button>
              </Link>
              <Link
                href={`/posko/${effectivePoskoId}/refugees/${selectedPerson.id}`}
                className="w-full sm:flex-1"
                onClick={() => setDetailModalOpen(false)}
              >
                <Button variant="secondary" size="md" className="w-full justify-center">
                  Buka Riwayat
                </Button>
              </Link>
            </div>
          </div>
        </Dialog>
      )}

      {/* 4. Modal Intake Warga Kilat */}
      <FastIntakeModal
        open={fastIntakeOpen}
        onOpenChange={setFastIntakeOpen}
        poskoId={effectivePoskoId}
      />
    </div>
  );
}
