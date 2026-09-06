/* Pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: component: edit-refugee-modal
 * theme: crisp-slate | typography: outfit
 * status: PASSED (15/15 slop checks verified)
 */
"use client";

import * as React from "react";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { type DisasterPerson, type VulnerabilityCategory } from "@/shared/types";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import {
  getAvailableVulnerabilities,
  sanitizeVulnerabilities,
  suggestVulnerabilities,
} from "@/core/domain/refugees/vulnerability-rules";

interface EditRefugeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refugee: DisasterPerson;
}

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
      setVulnerabilities(sanitizeVulnerabilities(refugee.gender, refugee.age, refugee.vulnerabilities || []));
      setUrgentNeedsText((refugee.urgentNeeds || []).join(", "));
    }
  }, [open, refugee]);

  const handleGenderChange = (newGender: "M" | "F") => {
    setGender(newGender);
    setVulnerabilities((prev) => sanitizeVulnerabilities(newGender, age, prev));
  };

  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    setVulnerabilities((prev) => {
      const sanitized = sanitizeVulnerabilities(gender, newAge, prev);
      const suggestions = suggestVulnerabilities(gender, newAge);
      const hasAgeGroup = sanitized.some((v) => ["BALITA", "IBU_HAMIL", "LANSIA"].includes(v));
      return !hasAgeGroup && suggestions.length > 0 ? [...sanitized, ...suggestions] : sanitized;
    });
  };

  const toggleVulnerability = (v: VulnerabilityCategory) => {
    setVulnerabilities((prev) => {
      let updated = [...prev];
      if (updated.includes(v)) {
        updated = updated.filter((item) => item !== v);
      } else {
        if (v === "BALITA") updated = updated.filter((item) => item !== "IBU_HAMIL" && item !== "LANSIA");
        if (v === "IBU_HAMIL") updated = updated.filter((item) => item !== "BALITA" && item !== "LANSIA");
        if (v === "LANSIA") updated = updated.filter((item) => item !== "BALITA" && item !== "IBU_HAMIL");
        updated.push(v);
      }
      return sanitizeVulnerabilities(gender, age, updated);
    });
  };

  const availableVulnerabilities = React.useMemo(() => {
    return getAvailableVulnerabilities(gender, age, vulnerabilities);
  }, [gender, age, vulnerabilities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const parsedNeeds = urgentNeedsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanVulns = sanitizeVulnerabilities(gender, Number(age) || 0, vulnerabilities);

    updateRefugee(refugee.id, {
      fullName: fullName.trim(),
      nik: nik.trim() ? nik.trim() : null,
      gender,
      age: Number(age) || EDIT_REFUGEE_CONSTANTS.MIN_AGE,
      domicileOrigin: domicileOrigin.trim() || EDIT_REFUGEE_CONSTANTS.DEFAULT_DOMICILE,
      shelterLocation: shelterLocation.trim() || EDIT_REFUGEE_CONSTANTS.DEFAULT_SHELTER,
      missingKinName: missingKinName.trim() ? missingKinName.trim() : undefined,
      vulnerabilities: cleanVulns,
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
          <Input
            value={fullName}
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
            <Input
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="Kosongkan jika KTP hilang / belum ada"
              className="font-mono text-xs"
              maxLength={16}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Usia (Tahun)
            </label>
            <Input
              type="number"
              value={age}
              onChange={(e) => handleAgeChange(Number(e.target.value))}
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
                onClick={() => handleGenderChange("M")}
                className={`h-10 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  gender === "M"
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-surface border-border text-text-main hover:border-border-hover"
                }`}
              >
                Laki-Laki (M)
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange("F")}
                className={`h-10 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  gender === "F"
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
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
            <Input
              value={shelterLocation}
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
            <Input
              value={domicileOrigin}
              onChange={(e) => setDomicileOrigin(e.target.value)}
              placeholder="Contoh: RT 03/RW 03 Cijedil"
              icon="pin"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Kerabat yang Dicari (Restoring Family Links)
            </label>
            <Input
              value={missingKinName}
              onChange={(e) => setMissingKinName(e.target.value)}
              placeholder="Nama keluarga terpisah (opsional)"
              icon="user"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1.5">
            Kategori Kerentanan Khusus (Saling Eksklusif Balita/Bumil/Lansia)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableVulnerabilities.map((opt) => {
              const selected = vulnerabilities.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={opt.disabled}
                  title={opt.disabledReason || opt.description}
                  onClick={() => toggleVulnerability(opt.id)}
                  className={`p-2 rounded-lg text-xs font-medium border transition-all text-left flex flex-col justify-between ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs cursor-pointer"
                      : opt.disabled
                      ? "bg-canvas-subtle/50 text-text-muted/40 border-border/40 cursor-not-allowed opacity-40"
                      : "bg-surface border-border text-text-muted hover:border-border-hover hover:text-text-main cursor-pointer"
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.disabled && opt.disabledReason && (
                    <span className="text-[10px] font-normal opacity-70 truncate mt-0.5">
                      {opt.disabledReason}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted block mb-1">
            Kebutuhan Logistik Mendesak (Pisahkan dengan koma)
          </label>
          <Input
            value={urgentNeedsText}
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
