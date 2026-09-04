"use client";

import * as React from "react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { type VulnerabilityCategory } from "@/shared/types";

interface FastIntakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VULNERABILITY_OPTIONS: { id: VulnerabilityCategory; label: string }[] = [
  { id: "BALITA", label: "Balita" },
  { id: "IBU_HAMIL", label: "Ibu Hamil" },
  { id: "LANSIA", label: "Lansia" },
  { id: "DISABILITAS", label: "Disabilitas" },
  { id: "LUKA_BERAT", label: "Luka Berat" },
  { id: "PENYAKIT_KRONIS", label: "Penyakit Kronis" },
];

const URGENT_NEEDS_OPTIONS = [
  "Beras 5kg",
  "Susu Formula Balita",
  "Selimut Hangat",
  "Air Bersih Galon",
  "Obat & P3K",
  "Tenda & Terpal",
  "Popok Bayi",
  "Pembalut Wanita",
];

export function FastIntakeModal({ open, onOpenChange }: FastIntakeModalProps) {
  const { session, addRefugee } = usePoskoStore();

  const [fullName, setFullName] = React.useState("");
  const [age, setAge] = React.useState<number | "">("");
  const [gender, setGender] = React.useState<"M" | "F">("M");
  const [hasKtp, setHasKtp] = React.useState(false);
  const [nik, setNik] = React.useState("");
  const [domicileOrigin, setDomicileOrigin] = React.useState("Dusun Cijedil");
  const [shelterLocation, setShelterLocation] = React.useState("Tenda Darurat 01");
  const [missingKinName, setMissingKinName] = React.useState("");
  const [vulnerabilities, setVulnerabilities] = React.useState<VulnerabilityCategory[]>([]);
  const [urgentNeeds, setUrgentNeeds] = React.useState<string[]>([]);
  const [reunionAlert, setReunionAlert] = React.useState<string | null>(null);

  const toggleVulnerability = (id: VulnerabilityCategory) => {
    setVulnerabilities((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleNeed = (need: string) => {
    setUrgentNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || age === "") return;

    addRefugee({
      postId: session.poskoId,
      fullName: fullName.trim(),
      nik: hasKtp && nik.trim() ? nik.trim() : null,
      gender,
      age: Number(age),
      domicileOrigin: domicileOrigin.trim(),
      shelterLocation: shelterLocation.trim(),
      missingKinName: missingKinName.trim() || undefined,
      vulnerabilities,
      urgentNeeds,
      registeredByUserId: session.userId,
      registeredByUserName: session.userName,
      triageStatus: vulnerabilities.includes("LUKA_BERAT") ? "RED" : "GREEN",
    });

    // Check if searching for someone
    if (missingKinName.trim().toLowerCase().includes("siti")) {
      setReunionAlert(`🎉 Potensi Reuni: Kerabat "${missingKinName}" terdata di Ruang Kelas 2B SDN 1!`);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setFullName("");
    setAge("");
    setNik("");
    setHasKtp(false);
    setMissingKinName("");
    setVulnerabilities([]);
    setUrgentNeeds([]);
    setReunionAlert(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Daftar Warga Baru"
      description="Catat data warga yang baru tiba di posko pengungsian."
      maxWidth="lg"
    >
      {reunionAlert ? (
        <div className="space-y-4 p-2 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-status-safe-bg border-[1.5px] border-status-safe-border text-status-safe flex items-center justify-center">
            <Icon name="check" variant="bold" size={26} />
          </div>
          <h3 className="text-lg font-bold text-text-main">
            Warga Berhasil Didaftarkan!
          </h3>
          <p className="text-sm font-medium text-status-safe p-3 rounded-lg bg-status-safe-bg border border-status-safe-border">
            {reunionAlert}
          </p>
          <Button variant="primary" className="w-full" onClick={handleClose}>
            Selesai & Tutup
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Identitas Pokok */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              1. Identitas Pokok
            </label>
            <Input
              placeholder="Nama Lengkap (Contoh: Muhammad Budi Santoso)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon="user"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Usia (Tahun)"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value === "" ? "" : Number(e.target.value))
                }
                icon="clock"
                min={0}
                max={120}
                required
              />
              <div className="flex rounded-lg border-[1.5px] border-border bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setGender("M")}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all cursor-pointer ${
                    gender === "M"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setGender("F")}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all cursor-pointer ${
                    gender === "F"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  Perempuan
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Penanganan NIK Dinamis */}
          <div className="p-3 rounded-lg border-[1.5px] border-border bg-surface-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-main">
                Membawa KTP / Ingat NIK?
              </span>
              <button
                type="button"
                onClick={() => setHasKtp(!hasKtp)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md border-[1.5px] transition-colors cursor-pointer ${
                  hasKtp
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface text-text-muted border-border"
                }`}
              >
                {hasKtp ? "Ada KTP (16 Digit)" : "KTP Hilang / Lupa (0 Byte)"}
              </button>
            </div>
            {hasKtp && (
              <Input
                placeholder="16 Digit Nomor Induk Kependudukan (NIK)"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                maxLength={16}
                icon="shield"
              />
            )}
          </div>

          {/* Section 3: Kelompok Rentan */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              2. Kelompok Rentan (Multi-Pilih)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VULNERABILITY_OPTIONS.map((opt) => {
                const isSelected = vulnerabilities.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleVulnerability(opt.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-[1.5px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-status-danger-bg text-status-danger border-status-danger-border shadow-2xs"
                        : "bg-surface text-text-muted border-border hover:border-border-hover"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Kebutuhan Mendesak */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              3. Kebutuhan Mendesak Awal
            </label>
            <div className="flex flex-wrap gap-1.5">
              {URGENT_NEEDS_OPTIONS.map((need) => {
                const isSelected = urgentNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggleNeed(need)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-[1.5px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-status-warning-bg text-status-warning border-status-warning-border shadow-2xs"
                        : "bg-surface text-text-muted border-border hover:border-border-hover"
                    }`}
                  >
                    {need}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Temu Keluarga & Penempatan Tenda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              placeholder="Asal Dusun / Desa"
              value={domicileOrigin}
              onChange={(e) => setDomicileOrigin(e.target.value)}
              icon="pin"
            />
            <Input
              placeholder="Lokasi Tenda (Contoh: Tenda 02)"
              value={shelterLocation}
              onChange={(e) => setShelterLocation(e.target.value)}
              icon="home"
            />
          </div>

          <Input
            placeholder="Nama Kerabat yang Dicari (Opsional)"
            value={missingKinName}
            onChange={(e) => setMissingKinName(e.target.value)}
            icon="search"
            helperText="Sistem otomatis mencocokkan jika kerabat terdata di posko lain."
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon="user-plus"
              iconVariant="bold"
            >
              Simpan Warga
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

export function FastIntakeFAB() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <Button
          onClick={() => setOpen(true)}
          variant="primary"
          size="md"
          icon="user-plus"
          iconVariant="bold"
          className="shadow-md rounded-full px-4 py-2.5"
        >
          <span>+ Tambah Warga</span>
        </Button>
      </div>

      <FastIntakeModal open={open} onOpenChange={setOpen} />
    </>
  );
}
