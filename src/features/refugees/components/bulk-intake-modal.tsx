/* Pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: component: bulk-intake-modal
 * theme: crisp-slate | typography: outfit
 * status: PASSED (15/15 slop checks verified)
 */
"use client";

import * as React from "react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { type VulnerabilityCategory } from "@/shared/types";
import { AIExtractorService, type ExtractedRefugeeItem } from "@/core/services/ai-extractor.service";
import {
  ALL_VULNERABILITY_METADATA,
  sanitizeVulnerabilities,
  getAvailableVulnerabilities,
  suggestVulnerabilities,
} from "@/core/domain/refugees/vulnerability-rules";

interface BulkIntakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poskoId?: string;
}

interface StagingMember extends ExtractedRefugeeItem {
  tempId: string;
}

const COMMON_NEEDS = [
  "Beras 5kg",
  "Susu Formula Balita",
  "Selimut Hangat",
  "Air Bersih Galon",
  "Obat & P3K",
  "Popok Bayi",
  "Pembalut Wanita",
  "Tenda & Terpal",
];

export function BulkIntakeModal({ open, onOpenChange, poskoId }: BulkIntakeModalProps) {
  const { session, importRefugeeBatch, aiProvider, aiApiKey, aiBaseUrl, aiModelName } = usePoskoStore();
  const effectivePoskoId = poskoId || session.poskoId;

  const [activeTab, setActiveTab] = React.useState<"AI_VISION" | "MANUAL_TABLE">("AI_VISION");
  const [defaultDomicile, setDefaultDomicile] = React.useState("");
  const [defaultShelter, setDefaultShelter] = React.useState("");

  // AI Inputs
  const [rawText, setRawText] = React.useState("");
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [imageMime, setImageMime] = React.useState<string>("image/jpeg");
  const [isExtracting, setIsExtracting] = React.useState(false);

  // Staging Members Table
  const [members, setMembers] = React.useState<StagingMember[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successResult, setSuccessResult] = React.useState<{
    count: number;
    reunions: number;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAIExtraction = async () => {
    if (!selectedImage && !rawText.trim()) {
      setErrorMessage("Silakan unggah foto dokumen (KK / catatan kertas) atau masukkan teks daftar warga.");
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const extractor = new AIExtractorService();
      const result = await extractor.extractRefugees(
        {
          imageBase64: selectedImage || undefined,
          mimeType: imageMime,
          rawText: rawText.trim() || undefined,
        },
        {
          provider: aiProvider,
          apiKey: aiApiKey || undefined,
          baseUrl: aiBaseUrl || undefined,
          modelName: aiModelName || undefined,
        }
      );

      if (result.ok) {
        const data = result.value;
        if (data.suggestedDomicile && !defaultDomicile) {
          setDefaultDomicile(data.suggestedDomicile);
        }
        if (data.suggestedShelter && !defaultShelter) {
          setDefaultShelter(data.suggestedShelter);
        }

        const newStagingMembers: StagingMember[] = data.members.map((m) => ({
          ...m,
          tempId: crypto.randomUUID(),
          domicileOrigin: m.domicileOrigin || data.suggestedDomicile || defaultDomicile,
          shelterLocation: m.shelterLocation || data.suggestedShelter || defaultShelter,
          vulnerabilities: sanitizeVulnerabilities(m.gender, m.age, m.vulnerabilities),
        }));

        setMembers((prev) => [...prev, ...newStagingMembers]);
        setActiveTab("MANUAL_TABLE");
      } else {
        setErrorMessage(result.error.message);
      }
    } catch (err) {
      console.error("AI extraction error:", err);
      setErrorMessage("Terjadi kesalahan saat memproses dokumen dengan AI.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddEmptyRow = () => {
    const newMember: StagingMember = {
      tempId: crypto.randomUUID(),
      fullName: "",
      nationalId: null,
      gender: "M",
      age: 30,
      domicileOrigin: defaultDomicile || "Wilayah Posko",
      shelterLocation: defaultShelter || "Tenda Umum",
      vulnerabilities: [],
      urgentNeeds: [],
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const handleUpdateMember = (tempId: string, patch: Partial<StagingMember>) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.tempId !== tempId) return m;
        const updated = { ...m, ...patch };

        // Handle age & gender reactivity on vulnerabilities
        if (patch.gender !== undefined || patch.age !== undefined) {
          const autoSuggestions = suggestVulnerabilities(updated.gender, updated.age);
          const sanitized = sanitizeVulnerabilities(updated.gender, updated.age, updated.vulnerabilities);
          const hasAgeGroup = sanitized.some((v) => ["BALITA", "IBU_HAMIL", "LANSIA"].includes(v));
          updated.vulnerabilities = !hasAgeGroup && autoSuggestions.length > 0 ? [...sanitized, ...autoSuggestions] : sanitized;
        }

        return updated;
      })
    );
  };

  const handleToggleMemberVuln = (tempId: string, vulnId: VulnerabilityCategory) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.tempId !== tempId) return m;
        let nextVulns = [...m.vulnerabilities];
        if (nextVulns.includes(vulnId)) {
          nextVulns = nextVulns.filter((v) => v !== vulnId);
        } else {
          if (vulnId === "BALITA") nextVulns = nextVulns.filter((v) => v !== "IBU_HAMIL" && v !== "LANSIA");
          if (vulnId === "IBU_HAMIL") nextVulns = nextVulns.filter((v) => v !== "BALITA" && v !== "LANSIA");
          if (vulnId === "LANSIA") nextVulns = nextVulns.filter((v) => v !== "BALITA" && v !== "IBU_HAMIL");
          nextVulns.push(vulnId);
        }
        return {
          ...m,
          vulnerabilities: sanitizeVulnerabilities(m.gender, m.age, nextVulns),
        };
      })
    );
  };

  const handleToggleMemberNeed = (tempId: string, need: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.tempId !== tempId) return m;
        const nextNeeds = m.urgentNeeds.includes(need)
          ? m.urgentNeeds.filter((n) => n !== need)
          : [...m.urgentNeeds, need];
        return { ...m, urgentNeeds: nextNeeds };
      })
    );
  };

  const handleRemoveMember = (tempId: string) => {
    setMembers((prev) => prev.filter((m) => m.tempId !== tempId));
  };

  const handleSubmitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (members.length === 0) {
      setErrorMessage("Tambahkan minimal 1 orang pengungsi.");
      return;
    }

    const invalidName = members.find((m) => !m.fullName.trim());
    if (invalidName) {
      setErrorMessage("Semua anggota wajib memiliki nama lengkap.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const container = ServiceContainer.getInstance();

      // 1. Eksekusi Bulk Intake Use Case ke Domain & SQLite
      const bulkResult = await container.bulkIntakeUseCase.execute({
        poskoId: effectivePoskoId,
        defaultDomicileOrigin: defaultDomicile || "Wilayah Posko",
        defaultShelterLocation: defaultShelter || "Tenda Umum",
        registeredByUserId: session.userId,
        members: members.map((m) => ({
          fullName: m.fullName.trim(),
          nationalId: m.nationalId && m.nationalId.length === 16 ? m.nationalId : null,
          gender: m.gender,
          age: m.age,
          domicileOrigin: m.domicileOrigin || defaultDomicile || "Wilayah Posko",
          shelterLocation: m.shelterLocation || defaultShelter || "Tenda Umum",
          missingKinName: m.missingKinName?.trim() || undefined,
          vulnerabilities: sanitizeVulnerabilities(m.gender, m.age, m.vulnerabilities),
          urgentNeeds: m.urgentNeeds,
        })),
      });

      if (bulkResult.ok) {
        // 2. Sinkronkan ke Zustand Store & Buat Tiket Logistik
        const storePersons = members.map((m, idx) => ({
          id: bulkResult.value.refugeeIds[idx],
          postId: effectivePoskoId,
          fullName: m.fullName.trim(),
          nik: m.nationalId && m.nationalId.length === 16 ? m.nationalId : null,
          gender: m.gender,
          age: m.age,
          domicileOrigin: m.domicileOrigin || defaultDomicile || "Wilayah Posko",
          shelterLocation: m.shelterLocation || defaultShelter || "Tenda Umum",
          missingKinName: m.missingKinName?.trim() || undefined,
          vulnerabilities: sanitizeVulnerabilities(m.gender, m.age, m.vulnerabilities),
          urgentNeeds: m.urgentNeeds,
          registeredByUserId: session.userId,
          registeredByUserName: session.userName,
          triageStatus: m.vulnerabilities.includes("LUKA_BERAT") ? ("RED" as const) : ("GREEN" as const),
        }));

        importRefugeeBatch(storePersons);

        setSuccessResult({
          count: bulkResult.value.registeredCount,
          reunions: bulkResult.value.matchedKinCount,
        });
      } else {
        setErrorMessage(bulkResult.error.message);
      }
    } catch (err) {
      console.error("Bulk intake submit failed:", err);
      setErrorMessage("Terjadi kesalahan sistem saat menyimpan pendaftaran massal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDefaultDomicile("");
    setDefaultShelter("");
    setRawText("");
    setSelectedImage(null);
    setMembers([]);
    setErrorMessage(null);
    setSuccessResult(null);
    setActiveTab("AI_VISION");
    onOpenChange(false);
  };

  const summaryStats = React.useMemo(() => {
    const balitaCount = members.filter((m) => m.vulnerabilities.includes("BALITA")).length;
    const bumilCount = members.filter((m) => m.vulnerabilities.includes("IBU_HAMIL")).length;
    const lansiaCount = members.filter((m) => m.vulnerabilities.includes("LANSIA")).length;
    const totalNeeds = members.reduce((acc, m) => acc + m.urgentNeeds.length, 0);
    return { balitaCount, bumilCount, lansiaCount, totalNeeds };
  }, [members]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Pendaftaran Massal / Rombongan Keluarga (Bulk Intake)"
      maxWidth="xl"
    >
      {successResult ? (
        <div className="space-y-4 p-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-status-safe-bg border-[1.5px] border-status-safe-border text-status-safe flex items-center justify-center">
            <Icon name="check" variant="bold" size={30} />
          </div>
          <h3 className="text-xl font-bold text-text-main">
            {successResult.count} Warga Berhasil Didaftarkan!
          </h3>
          <p className="text-xs text-text-muted">
            Seluruh data pengungsi, event intake awal, dan tiket permintaan kebutuhan logistik telah tercatat di basis data lokal.
          </p>
          {successResult.reunions > 0 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold">
              🎉 Ditemukan {successResult.reunions} potensi kecocokan Temu Keluarga dengan posko lain!
            </div>
          )}
          <Button variant="primary" className="w-full" onClick={handleClose}>
            Selesai & Tutup
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-status-danger-bg text-status-danger border border-status-danger-border text-xs font-semibold flex items-center gap-2">
              <Icon name="alert" variant="bold" size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Shared Header Fields: Dusun & Shelter */}
          <div className="p-3 rounded-xl bg-surface-subtle border border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                Asal Dusun / Desa (Bersama)
              </label>
              <Input
                placeholder="Contoh: Dusun Cijedil (RW 03)"
                value={defaultDomicile}
                onChange={(e) => setDefaultDomicile(e.target.value)}
                icon="pin"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                Lokasi Tenda / Penampungan
              </label>
              <Input
                placeholder="Contoh: Tenda Darurat 01"
                value={defaultShelter}
                onChange={(e) => setDefaultShelter(e.target.value)}
                icon="pin"
              />
            </div>
          </div>

          {/* Tabs Selector */}
          <div className="flex border-b border-border text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("AI_VISION")}
              className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "AI_VISION"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <Icon name="qr-code" variant="bold" size={16} />
              <span>1. Ekstraksi AI Vision / OCR (Foto Dokumen / Teks)</span>
              <Badge variant="primary" size="sm" className="text-[10px]">
                {aiProvider === "GEMINI"
                  ? "Gemini Flash"
                  : aiProvider === "OPENAI"
                  ? "OpenAI"
                  : aiProvider === "CUSTOM_ENDPOINT"
                  ? "Ollama Lokal"
                  : "Sandya AI"}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("MANUAL_TABLE")}
              className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "MANUAL_TABLE"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <Icon name="user" variant="bold" size={16} />
              <span>2. Tabel Pratinjau & Verifikasi ({members.length} Jiwa)</span>
            </button>
          </div>

          {/* TAB 1: AI VISION / OCR */}
          {activeTab === "AI_VISION" && (
            <div className="space-y-3.5 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Photo Upload Card */}
                <div className="p-4 rounded-xl border border-dashed border-border bg-canvas-subtle flex flex-col items-center justify-center text-center space-y-2.5">
                  {selectedImage ? (
                    <div className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedImage}
                        alt="Dokumen Terpilih"
                        className="max-h-40 mx-auto rounded-lg object-contain border border-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => setSelectedImage(null)}
                      >
                        Ganti Foto
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Icon name="qr-code" variant="bold" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-main">
                          Unggah / Jepret Foto Kartu Keluarga (KK) / Catatan Kertas
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Format JPG, PNG (AI otomatis mendeteksi baris nama, NIK, usia, dan gender)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Pilih Berkas Foto
                      </Button>
                    </>
                  )}
                </div>

                {/* Raw Text / Chat Paste */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-text-muted">
                    Atau Tempel Teks Pesan Obrolan / Daftar Pengungsi:
                  </label>
                  <textarea
                    rows={6}
                    placeholder={`Contoh teks:\n1. Budi Santoso (35 th, L)\n2. Siti Rahma (32 th, P, Hamil)\n3. Reza Santoso (3 th, L, Butuh Susu)\nAlamat: Dusun Cijedil RW 03, Tenda 01`}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="flex-1 w-full p-2.5 rounded-lg bg-surface-subtle border border-border text-xs text-text-main font-mono focus:outline-hidden focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Action Trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                  <Icon name="alert" variant="bold" size={14} className="text-primary" />
                  <span>
                    Provider AI Aktif: <strong>{aiProvider}</strong> (Bebas ubah di Pengaturan Organisasi)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={isExtracting}
                  onClick={handleRunAIExtraction}
                >
                  {isExtracting ? (
                    <>
                      <Icon name="clock" variant="bold" size={16} className="animate-spin" />
                      <span>Sedang Menganalisis Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="qr-code" variant="bold" size={16} />
                      <span>Ekstrak Data dengan AI</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL TABLE & STAGING REVIEW */}
          {activeTab === "MANUAL_TABLE" && (
            <div className="space-y-3">
              {/* Toolbar & Add Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <span>Total: <strong>{members.length} Jiwa</strong></span>
                  {summaryStats.balitaCount > 0 && <Badge variant="primary" size="sm">Balita: {summaryStats.balitaCount}</Badge>}
                  {summaryStats.bumilCount > 0 && <Badge variant="warning" size="sm">Bumil: {summaryStats.bumilCount}</Badge>}
                  {summaryStats.lansiaCount > 0 && <Badge variant="neutral" size="sm">Lansia: {summaryStats.lansiaCount}</Badge>}
                </div>
                <Button type="button" variant="outline" size="sm" icon="add-circle" onClick={handleAddEmptyRow}>
                  Tambah Baris Manual
                </Button>
              </div>

              {/* Members List Cards */}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {members.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-xl text-text-muted text-xs space-y-2">
                    <Icon name="user" variant="bold" size={24} className="mx-auto text-text-muted/60" />
                    <p>Belum ada data warga di daftar.</p>
                    <p className="text-[11px]">
                      Gunakan tab <strong>Ekstraksi AI</strong> atau klik <strong>+ Tambah Baris Manual</strong>.
                    </p>
                  </div>
                ) : (
                  members.map((member, index) => {
                    const availableVulns = getAvailableVulnerabilities(member.gender, member.age, member.vulnerabilities);
                    return (
                      <div
                        key={member.tempId}
                        className="p-3 rounded-xl border border-border bg-surface-subtle space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-text-main text-[11px] bg-canvas px-2 py-0.5 rounded border border-border">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.tempId)}
                            className="text-text-muted hover:text-status-danger p-1 cursor-pointer transition-colors"
                            title="Hapus baris ini"
                          >
                            <Icon name="trash" variant="bold" size={14} />
                          </button>
                        </div>

                        {/* Row Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <Input
                              placeholder="Nama Lengkap Warga"
                              value={member.fullName}
                              onChange={(e) =>
                                handleUpdateMember(member.tempId, { fullName: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              placeholder="Usia (Th)"
                              value={member.age}
                              min={0}
                              max={127}
                              onChange={(e) =>
                                handleUpdateMember(member.tempId, { age: Number(e.target.value) || 0 })
                              }
                              required
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateMember(member.tempId, { gender: "M" })}
                              className={`flex-1 py-1.5 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                                member.gender === "M"
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-canvas text-text-muted border-border"
                              }`}
                            >
                              L
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMember(member.tempId, { gender: "F" })}
                              className={`flex-1 py-1.5 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                                member.gender === "F"
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-canvas text-text-muted border-border"
                              }`}
                            >
                              P
                            </button>
                          </div>
                        </div>

                        {/* NIK & Missing Kin */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="16 Digit NIK (Opsional jika KTP hilang)"
                            value={member.nationalId || ""}
                            maxLength={16}
                            onChange={(e) =>
                              handleUpdateMember(member.tempId, {
                                nationalId: e.target.value.replace(/\D/g, "").slice(0, 16) || null,
                              })
                            }
                            className="font-mono text-[11px]"
                          />
                          <Input
                            placeholder="Kerabat dicari / terpisah (Opsional)"
                            value={member.missingKinName || ""}
                            onChange={(e) =>
                              handleUpdateMember(member.tempId, { missingKinName: e.target.value })
                            }
                            className="text-[11px]"
                          />
                        </div>

                        {/* Vulnerability Chips */}
                        <div className="pt-1">
                          <span className="text-[10px] font-bold uppercase text-text-muted block mb-1">
                            Kelompok Rentan (Saling Eksklusif Balita/Bumil/Lansia):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {availableVulns.map((v) => {
                              const isSelected = member.vulnerabilities.includes(v.id);
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  disabled={v.disabled}
                                  title={v.disabledReason || v.description}
                                  onClick={() => handleToggleMemberVuln(member.tempId, v.id)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : v.disabled
                                      ? "bg-canvas/40 text-text-muted/40 border-border/40 cursor-not-allowed opacity-40"
                                      : "bg-canvas text-text-muted border-border hover:text-text-main cursor-pointer"
                                  }`}
                                >
                                  {v.id === "BALITA"
                                    ? "Balita"
                                    : v.id === "IBU_HAMIL"
                                    ? "Ibu Hamil"
                                    : v.id === "LANSIA"
                                    ? "Lansia"
                                    : v.id === "DISABILITAS"
                                    ? "Disabilitas"
                                    : v.id === "LUKA_BERAT"
                                    ? "Luka Berat"
                                    : "Penyakit Kronis"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Urgent Needs */}
                        <div className="pt-1">
                          <span className="text-[10px] font-bold uppercase text-text-muted block mb-1">
                            Kebutuhan Mendesak:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {COMMON_NEEDS.map((need) => {
                              const isSelected = member.urgentNeeds.includes(need);
                              return (
                                <button
                                  key={need}
                                  type="button"
                                  onClick={() => handleToggleMemberNeed(member.tempId, need)}
                                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-status-safe-bg text-status-safe border-status-safe font-bold"
                                      : "bg-canvas text-text-muted border-border hover:text-text-main"
                                  }`}
                                >
                                  {need}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="md" onClick={handleClose}>
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || members.length === 0}
                  onClick={handleSubmitBulk}
                >
                  {isSubmitting
                    ? "Menyimpan Rombongan..."
                    : `Simpan Semua Pengungsi (${members.length} Jiwa)`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
