"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { type DisasterPerson, type VulnerabilityCategory } from "@/shared/types";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/badge";

interface EditRefugeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refugee: DisasterPerson;
}

const VULNERABILITY_OPTIONS: { id: VulnerabilityCategory; label: string }[] = [
  { id: "BALITA", label: "Balita / Anak-Anak" },
  { id: "IBU_HAMIL", label: "Ibu Hamil / Menyusui" },
  { id: "LANSIA", label: "Lanjut Usia (Lansia)" },
  { id: "DISABILITAS", label: "Penyandang Disabilitas" },
  { id: "PENYAKIT_KRONIS", label: "Penyakit Kronis / Perlu Obat Rutin" },
];

export const EDIT_REFUGEE_CONSTANTS = {
  MIN_AGE: 0,
  MAX_AGE: 127,
  DEFAULT_DOMICILE: "Wilayah Posko",
  DEFAULT_SHELTER: "Tenda Umum",
} as const;

export function EditRefugeeModal({ open, onOpenChange, refugee }: EditRefugeeModalProps) {
  const { updateRefugee } = usePoskoStore();

  const [fullName, setFullName] = React.useState(refugee.fullName);
  const [nik, setNik] = React.useState(refugee.nik || "");
  const [gender, setGender] = React.useState<"M" | "F">(refugee.gender);
  const [age, setAge] = React.useState(refugee.age);
  const [domicileOrigin, setDomicileOrigin] = React.useState(refugee.domicileOrigin);
  const [shelterLocation, setShelterLocation] = React.useState(refugee.shelterLocation);
  const [missingKinName, setMissingKinName] = React.useState(refugee.missingKinName || "");
  const [vulnerabilities, setVulnerabilities] = React.useState<VulnerabilityCategory[]>(
  refugee.vulnerabilities || []
  );
  const [urgentNeedsText, setUrgentNeedsText] = React.useState(
  (refugee.urgentNeeds || []).join(", ")
  );

  React.useEffect(() => {
  if (open) {
  setFullName(refugee.fullName);
  setNik(refugee.nik || "");
  setGender(refugee.gender);
  setAge(refugee.age);
  setDomicileOrigin(refugee.domicileOrigin);
  setShelterLocation(refugee.shelterLocation);
  setMissingKinName(refugee.missingKinName || "");
  setVulnerabilities(refugee.vulnerabilities || []);
  setUrgentNeedsText((refugee.urgentNeeds || []).join(", "));
  }
  }, [open, refugee]);

  const toggleVulnerability = (v: VulnerabilityCategory) => {
  setVulnerabilities((prev) =>
  prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
  );
  };

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!fullName.trim()) return;

  const parsedNeeds = urgentNeedsText
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

  updateRefugee(refugee.id, {
  fullName: fullName.trim(),
  nik: nik.trim() ? nik.trim() : null,
  gender,
  age: Number(age) || EDIT_REFUGEE_CONSTANTS.MIN_AGE,
  domicileOrigin: domicileOrigin.trim() || EDIT_REFUGEE_CONSTANTS.DEFAULT_DOMICILE,
  shelterLocation: shelterLocation.trim() || EDIT_REFUGEE_CONSTANTS.DEFAULT_SHELTER,
  missingKinName: missingKinName.trim() ? missingKinName.trim() : undefined,
  vulnerabilities,
  urgentNeeds: parsedNeeds,
  });

  onOpenChange(false);
  };

  return (
  <Dialog
  open={open}
  onOpenChange={onOpenChange}
  title="Perbarui Data Pokok Warga"
  description={`Koreksi identitas, hunian tenda, dan kontak keluarga untuk ${refugee.fullName}.`}
  >
  <form onSubmit={handleSubmit} className="space-y-4">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Lengkap Sesuai KTP / Lisan
  </label>
  <Input value={fullName}
  onChange={(e) => setFullName(e.target.value)}
  icon="user"
  required
  />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div className="sm:col-span-2">
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nomor Induk Kependudukan (NIK - Opsional)
  </label>
  <Input value={nik}
  onChange={(e) => setNik(e.target.value)}
  placeholder="Kosongkan jika KTP hilang / belum ada"
  className="font-mono text-xs"
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Usia (Tahun)
  </label>
  <Input type="number"
  value={age}
  onChange={(e) => setAge(Number(e.target.value))}
  min={EDIT_REFUGEE_CONSTANTS.MIN_AGE}
  max={EDIT_REFUGEE_CONSTANTS.MAX_AGE}
  required
  />
  </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Jenis Kelamin
  </label>
  <div className="grid grid-cols-2 gap-2">
  <button
  type="button"
  onClick={() => setGender("M")}
  className={`h-10 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
  gender === "M"
  ? "bg-primary text-text-inverse border-primary shadow-2xs"
  : "bg-surface border-border text-text-main hover:border-border-hover"
  }`}
  >
  Laki-Laki (M)
  </button>
  <button
  type="button"
  onClick={() => setGender("F")}
  className={`h-10 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
  gender === "F"
  ? "bg-primary text-text-inverse border-primary shadow-2xs"
  : "bg-surface border-border text-text-main hover:border-border-hover"
  }`}
  >
  Perempuan (F)
  </button>
  </div>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Lokasi Tenda / Blok Hunian
  </label>
  <Input value={shelterLocation}
  onChange={(e) => setShelterLocation(e.target.value)}
  placeholder="Contoh: Tenda Darurat 02"
  icon="pin"
  required
  />
  </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Asal Domisili / Dusun Asal
  </label>
  <Input value={domicileOrigin}
  onChange={(e) => setDomicileOrigin(e.target.value)}
  placeholder="Contoh: RT 03/RW 03 Cijedil"
  icon="buildings"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Kerabat yang Dicari (Restoring Family Links)
  </label>
  <Input value={missingKinName}
  onChange={(e) => setMissingKinName(e.target.value)}
  placeholder="Nama keluarga terpisah (opsional)"
  icon="users"
  />
  </div>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1.5">
  Kategori Kerentanan Khusus
  </label>
  <div className="flex flex-wrap gap-2">
  {VULNERABILITY_OPTIONS.map((opt) => {
  const selected = vulnerabilities.includes(opt.id);
  return (
  <button
  key={opt.id}
  type="button"
  onClick={() => toggleVulnerability(opt.id)}
  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
  selected
  ? "bg-status-warning-bg text-status-warning border-status-warning-border font-semibold shadow-2xs"
  : "bg-surface border-border text-text-muted hover:border-border-hover"
  }`}
  >
  {selected && <Icon name="check" size={12} className="inline text-status-warning" />}
  <span>{opt.label}</span>
  </button>
  );
  })}
  </div>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Kebutuhan Logistik Mendesak (Pisahkan dengan koma)
  </label>
  <Input value={urgentNeedsText}
  onChange={(e) => setUrgentNeedsText(e.target.value)}
  placeholder="Contoh: Selimut, Susu Balita, Obat Hipertensi"
  icon="box"
  />
  </div>

  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={() => onOpenChange(false)}
  >
  Batal
  </Button>
  <Button
  type="submit"
  variant="primary"
  size="sm"
  icon="check"
  iconVariant="bold"
  >
  Simpan Perubahan
  </Button>
  </div>
  </form>
  </Dialog>
  );
}
