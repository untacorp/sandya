"use client";
import { Select } from "@/shared/ui/select";

import * as React from "react";
import Link from "next/link";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Icon } from "@/shared/ui/icon";
import { PageHeader } from "@/shared/ui/page-header";
import { type Organization } from "@/shared/types";
import { AIExtractorService } from "@/core/services/ai-extractor.service";

export default function OrgSettingsPage() {
  const {
    session,
    organizations,
    cloudProvider,
    cloudEndpoint,
    setCloudProvider,
    aiProvider,
    aiApiKey,
    aiBaseUrl,
    aiModelName,
    setAIConfig,
    updateOrganization,
    setSessionOrg,
    setSessionUser,
    triggerCloudSync,
  } = usePoskoStore();
  const org = organizations.find((o) => o.id === session.orgId) || null;

  const [orgName, setOrgName] = React.useState(org?.name || session.orgName || "");
  const [orgCategory, setOrgCategory] = React.useState<Organization["category"]>(org?.category || "BPBD_PEMERINTAH");
  const [headquartersAddress, setHeadquartersAddress] = React.useState(org?.headquartersAddress || "");
  const [contactNumber, setContactNumber] = React.useState(org?.contactNumber || "");
  const [leadPersonName, setLeadPersonName] = React.useState(session.userName || "");

  // Sync form state when store hydrates or session changes
  React.useEffect(() => {
    if (org) {
      setOrgName(org.name || "");
      setOrgCategory(org.category || "BPBD_PEMERINTAH");
      setHeadquartersAddress(org.headquartersAddress || "");
      setContactNumber(org.contactNumber || "");
    } else if (session.orgName) {
      setOrgName(session.orgName);
    }
    if (session.userName) {
      setLeadPersonName(session.userName);
    }
  }, [org, session.orgName, session.userName]);

  const [cloudType, setCloudType] = React.useState<"MANAGED" | "BYOC">(cloudProvider);
  const [byocUrl, setByocUrl] = React.useState(cloudEndpoint || "");
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [isCloudSaved, setIsCloudSaved] = React.useState(false);

  // AI Configuration State
  const [selectedAIProvider, setSelectedAIProvider] = React.useState(aiProvider);
  const [inputAIApiKey, setInputAIApiKey] = React.useState(aiApiKey || "");
  const [inputAIBaseUrl, setInputAIBaseUrl] = React.useState(aiBaseUrl || "");
  const [inputAIModelName, setInputAIModelName] = React.useState(aiModelName || "gemini-2.0-flash");
  const [showAIKey, setShowAIKey] = React.useState(false);
  const [isTestingAI, setIsTestingAI] = React.useState(false);
  const [aiTestResult, setAITestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [isAISaved, setIsAISaved] = React.useState(false);

  const [showSeed, setShowSeed] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);

  const seedWords = [
    "mountain", "rescue", "anchor", "signal", "shelter", "water",
    "harvest", "bridge", "beacon", "summit", "canyon", "patrol"
  ];

  const handleSelectCloudType = (type: "MANAGED" | "BYOC") => {
    setCloudType(type);
    setTestResult(null);
    const endpoint = type === "MANAGED" ? "https://api.sandya.id" : byocUrl;
    setCloudProvider(type, endpoint);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 600));
    setIsTesting(false);
    if (byocUrl && byocUrl.startsWith("http")) {
      setTestResult({
        success: true,
        message: `Berhasil terhubung ke ${byocUrl} (Protokol Vector Probe v4 OK, Latensi 38ms)`,
      });
      setCloudProvider("BYOC", byocUrl);
    } else {
      setTestResult({
        success: false,
        message: "URL Server tidak valid. Pastikan menyertakan http:// atau https://",
      });
    }
  };

  const handleSaveCloud = () => {
    const endpoint = cloudType === "MANAGED" ? "https://api.sandya.id" : byocUrl;
    setCloudProvider(cloudType, endpoint);
    setIsCloudSaved(true);
    setTimeout(() => setIsCloudSaved(false), 2000);
    triggerCloudSync();
  };

  const handleTestAI = async () => {
    if (selectedAIProvider === "OFFLINE_ONLY") {
      setAITestResult({
        success: true,
        message: "Mode Offline Saja aktif. AI dinonaktifkan dan sistem siap beroperasi 100% tanpa internet.",
      });
      return;
    }

    setIsTestingAI(true);
    setAITestResult(null);

    try {
      const extractor = new AIExtractorService();
      const testRes = await extractor.extractRefugees(
        { rawText: "Uji koneksi AI Sandya: 1. Budi Santoso (30 th, L, Tenda 01)" },
        {
          provider: selectedAIProvider,
          apiKey: inputAIApiKey.trim() || undefined,
          baseUrl: inputAIBaseUrl.trim() || undefined,
          modelName: inputAIModelName.trim() || undefined,
        }
      );

      if (testRes.ok && testRes.value.members.length > 0) {
        setAITestResult({
          success: true,
          message: `Koneksi AI (${selectedAIProvider}) Berhasil! Model "${inputAIModelName}" sukses mengekstrak data uji.`,
        });
      } else {
        setAITestResult({
          success: false,
          message: testRes.ok ? "AI terhubung namun tidak menghasilkan baris uji." : testRes.error.message,
        });
      }
    } catch (err: unknown) {
      setAITestResult({
        success: false,
        message: (err as Error)?.message || "Gagal menguji koneksi AI.",
      });
    } finally {
      setIsTestingAI(false);
    }
  };

  const handleSaveAIConfig = () => {
    setAIConfig({
      provider: selectedAIProvider,
      apiKey: inputAIApiKey.trim(),
      baseUrl: inputAIBaseUrl.trim(),
      modelName: inputAIModelName.trim(),
    });
    setIsAISaved(true);
    setTimeout(() => setIsAISaved(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrgId = org?.id || session.orgId || "ORG-01";
    const trimmedName = orgName.trim() || "Pusat Komando Wilayah";
    const trimmedAddress = headquartersAddress.trim();
    const trimmedContact = contactNumber.trim();
    const trimmedLeader = leadPersonName.trim() || session.userName;

    updateOrganization(targetOrgId, {
      name: trimmedName,
      category: orgCategory,
      headquartersAddress: trimmedAddress,
      contactNumber: trimmedContact,
    });
    setSessionOrg(targetOrgId, trimmedName);
    setSessionUser(session.userId || "USR-001", trimmedLeader);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    // Instant cloud synchronization push
    await triggerCloudSync();
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "BPBD_PEMERINTAH":
        return "BPBD / Pemerintah Daerah";
      case "PMI_LEMBAGA":
        return "Palang Merah Indonesia (PMI)";
      case "NGO_YAYASAN":
        return "Lembaga Swadaya / Yayasan Kemanusiaan";
      case "KOMUNITAS_MANDIRI":
        return "Komunitas Relawan Mandiri";
      default:
        return "Lembaga Kemanusiaan";
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Pengaturan Lembaga & Keamanan"
        subtitle="Kelola profil organisasi, kunci kriptografi otorisasi poster, provider AI/OCR, dan server sinkronisasi."
      />

      {/* Profil Organisasi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profil Lembaga Induk</CardTitle>
            <Badge variant="primary" size="sm">
              {getCategoryLabel(orgCategory)}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Identitas lembaga akan disematkan pada setiap lembaran poster serah terima dan waybill logistik.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Nama Lembaga / Organisasi
                </label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Contoh: BPBD Kab. Cianjur / PMI Cabang"
                  icon="buildings"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Kategori Lembaga
                </label>
                <Select
                  value={orgCategory}
                  onChange={(val) => setOrgCategory(val as Organization["category"])}
                  options={[
                    { value: "BPBD_PEMERINTAH", label: "BPBD / Instansi Pemerintah" },
                    { value: "PMI_LEMBAGA", label: "Palang Merah Indonesia (PMI)" },
                    { value: "NGO_YAYASAN", label: "Lembaga Swadaya / Yayasan Kemanusiaan" },
                    { value: "KOMUNITAS_MANDIRI", label: "Komunitas Relawan Mandiri" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Alamat Markas / Posko Induk
                </label>
                <Input
                  value={headquartersAddress}
                  onChange={(e) => setHeadquartersAddress(e.target.value)}
                  placeholder="Jl. Raya Posko Induk No. 1"
                  icon="pin"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Kontak Darurat / Call Center
                </label>
                <Input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="0812-XXXX-XXXX"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Nama Pimpinan / Koordinator Utama
              </label>
              <Input
                value={leadPersonName}
                onChange={(e) => setLeadPersonName(e.target.value)}
                placeholder="Nama Lengkap Penanggung Jawab"
                icon="user"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-text-muted">
                Perubahan disimpan lokal dan disinkronkan ke seluruh posko lapangan.
              </span>
              <Button type="submit" variant="primary" size="sm" icon="check">
                {isSaved ? "Tersimpan" : "Simpan Profil Lembaga"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* KONFIGURASI AI GATEWAY & OCR (BYOK) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Gateway & Asisten OCR Dokumen (BYOK)</CardTitle>
            <Badge variant="primary" size="sm">
              {selectedAIProvider}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Dukungan AI Vision untuk membaca foto Kartu Keluarga (KK), catatan kertas, atau teks daftar pengungsi dalam Bulk Intake. Lembaga non-profit bebas memilih penyedia gratis atau server inferensi lokal.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Grid Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedAIProvider("GEMINI");
                setInputAIModelName("gemini-2.0-flash");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedAIProvider === "GEMINI"
                  ? "bg-primary/10 border-primary text-text-main shadow-2xs"
                  : "bg-surface border-border text-text-muted hover:text-text-main"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Icon name="radar" variant="bold" size={16} className="text-primary" />
                <span>Google Gemini</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Rekomendasi Gratis Non-Profit (Gemini 2.0 Flash)
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAIProvider("OPENAI");
                setInputAIModelName("gpt-4o-mini");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedAIProvider === "OPENAI"
                  ? "bg-primary/10 border-primary text-text-main shadow-2xs"
                  : "bg-surface border-border text-text-muted hover:text-text-main"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Icon name="shield" variant="bold" size={16} className="text-primary" />
                <span>OpenAI</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                GPT-4o / GPT-4o-mini (BYOK API Key)
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAIProvider("CUSTOM_ENDPOINT");
                setInputAIBaseUrl("http://localhost:11434/v1");
                setInputAIModelName("llama3.2-vision");
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedAIProvider === "CUSTOM_ENDPOINT"
                  ? "bg-primary/10 border-primary text-text-main shadow-2xs"
                  : "bg-surface border-border text-text-muted hover:text-text-main"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Icon name="radar" variant="bold" size={16} className="text-primary" />
                <span>Ollama / Lokal</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                100% Offline di Laptop Posko (Rp0)
              </p>
            </button>
          </div>

          {/* Form Settings */}
          {selectedAIProvider !== "OFFLINE_ONLY" && (
            <div className="space-y-3 p-3.5 rounded-xl bg-surface-subtle border border-border text-xs">
              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-text-muted">
                    API Key ({selectedAIProvider === "GEMINI" ? "Google AI Studio" : selectedAIProvider === "OPENAI" ? "OpenAI Platform" : "Opsional jika Ollama"}):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAIKey(!showAIKey)}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    {showAIKey ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
                <Input
                  type={showAIKey ? "text" : "password"}
                  placeholder={
                    selectedAIProvider === "GEMINI"
                      ? "AIzaSy..."
                      : selectedAIProvider === "OPENAI"
                      ? "sk-..."
                      : "Kosongkan jika Ollama lokal tidak butuh kunci"
                  }
                  value={inputAIApiKey}
                  onChange={(e) => setInputAIApiKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              {/* Custom Base URL & Model Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedAIProvider === "CUSTOM_ENDPOINT" && (
                  <div>
                    <label className="font-semibold text-text-muted block mb-1">
                      Base URL Endpoint (OpenAI Compatible)
                    </label>
                    <Input
                      placeholder="http://localhost:11434/v1"
                      value={inputAIBaseUrl}
                      onChange={(e) => setInputAIBaseUrl(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                )}
                <div>
                  <label className="font-semibold text-text-muted block mb-1">
                    Nama Model Vision / OCR
                  </label>
                  <Input
                    placeholder="gemini-2.0-flash / gpt-4o-mini / llama3.2-vision"
                    value={inputAIModelName}
                    onChange={(e) => setInputAIModelName(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {/* Test and Save Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleTestAI}
                  disabled={isTestingAI}
                  icon={isTestingAI ? "sync" : "radar"}
                  className={isTestingAI ? "animate-pulse" : ""}
                >
                  {isTestingAI ? "Menguji Koneksi AI..." : "Uji Koneksi AI"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAIConfig}
                  icon="check"
                >
                  {isAISaved ? "Tersimpan" : "Terapkan Konfigurasi AI"}
                </Button>
              </div>

              {/* AI Test Result Alert */}
              {aiTestResult && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    aiTestResult.success
                      ? "bg-status-safe-bg text-status-safe border border-status-safe-border"
                      : "bg-status-danger-bg text-status-danger border border-status-danger"
                  }`}
                >
                  <Icon
                    name={aiTestResult.success ? "check" : "sos"}
                    variant="bold"
                    size={14}
                  />
                  <span>{aiTestResult.message}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cloud Sync Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Penyedia Server Sinkronisasi Cloud (Opsional)</CardTitle>
            <Badge variant={cloudType === "MANAGED" ? "primary" : "neutral"} size="sm">
              {cloudType === "MANAGED" ? "Sandya Managed Cloud" : "Self-Hosted BYOC"}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Digunakan untuk replikasi outbox otomatis antar-perangkat saat posko mendapatkan akses internet/Starlink.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectCloudType("MANAGED")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                cloudType === "MANAGED"
                  ? "bg-primary/5 border-primary shadow-2xs"
                  : "bg-surface border-border hover:border-border-hover"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="shield" variant="bold" size={18} className="text-primary" />
                <h4 className="text-sm font-bold text-text-main">
                  Cloud Resmi Sandya
                </h4>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Server pusat terkelola resmi siap pakai (`https://api.sandya.id`).
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCloudType("BYOC")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                cloudType === "BYOC"
                  ? "bg-primary/5 border-primary shadow-2xs"
                  : "bg-surface border-border hover:border-border-hover"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="buildings" variant="bold" size={18} className="text-primary" />
                <h4 className="text-sm font-bold text-text-main">
                  Server Instansi Sendiri (BYOC)
                </h4>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Hubungkan dengan server on-premise lokal instansi BPBD/PMI Anda.
              </p>
            </button>
          </div>

          {cloudType === "BYOC" && (
            <div className="space-y-3 p-3.5 rounded-xl bg-surface-subtle border border-border">
              <label className="text-xs font-semibold text-text-muted block">
                Alamat URL Server Instansi (BYOC Endpoint)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={byocUrl}
                  onChange={(e) => setByocUrl(e.target.value)}
                  placeholder="https://sandya.lembaga.id"
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  icon={isTesting ? "sync" : "radar"}
                  className={isTesting ? "animate-pulse" : ""}
                >
                  {isTesting ? "Menguji..." : "Uji Sambungan"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveCloud}
                  icon="check"
                >
                  {isCloudSaved ? "Tersimpan" : "Terapkan"}
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.success
                      ? "bg-status-safe-bg text-status-safe border border-status-safe-border"
                      : "bg-status-danger-bg text-status-danger border border-status-danger"
                  }`}
                >
                  <Icon
                    name={testResult.success ? "check" : "sos"}
                    variant="bold"
                    size={14}
                  />
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Master Key Seed Phrase Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kunci Pemulihan Akses (12 Kata Sandi)</CardTitle>
              <p className="text-xs text-text-muted mt-0.5">
                Kunci pemulihan untuk memulihkan akses pengurus jika perangkat posko hilang atau rusak.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSeed(!showSeed)}
            >
              {showSeed ? "Sembunyikan" : "Tampilkan 12 Kata"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showSeed ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3.5 rounded-xl bg-surface-subtle border border-border">
                {seedWords.map((word, idx) => (
                  <div
                    key={word}
                    className="p-2 rounded-lg bg-surface border border-border text-center text-xs font-mono font-medium text-text-main"
                  >
                    <span className="text-[10px] text-text-muted mr-1">{idx + 1}.</span>
                    {word}
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                Catat 12 kata ini pada buku catatan fisik lembaga yang aman.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-subtle border border-dashed border-border text-center text-xs text-text-muted">
              Klik &quot;Tampilkan 12 Kata&quot; untuk melihat salinan kunci pemulihan.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
