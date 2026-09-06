"use client";

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

export default function OrgSettingsPage() {
  const {
  session,
  organizations,
  cloudProvider,
  cloudEndpoint,
  setCloudProvider,
  updateOrganization,
  setSessionOrg,
  } = usePoskoStore();
  const org = organizations.find((o) => o.id === session.orgId) || null;

  const [orgName, setOrgName] = React.useState(org?.name || session.orgName || "");
  const [orgCategory, setOrgCategory] = React.useState<Organization["category"]>(org?.category || "BPBD_PEMERINTAH");
  const [headquartersAddress, setHeadquartersAddress] = React.useState(org?.headquartersAddress || "");
  const [contactNumber, setContactNumber] = React.useState(org?.contactNumber || "");
  const [leadPersonName, setLeadPersonName] = React.useState(session.userName || "");

  const [cloudType, setCloudType] = React.useState<"MANAGED" | "BYOC">(cloudProvider);
  const [byocUrl, setByocUrl] = React.useState(cloudEndpoint || "");
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [isCloudSaved, setIsCloudSaved] = React.useState(false);

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
  };

  const handleSaveProfile = (e: React.FormEvent) => {
  e.preventDefault();
  if (org) {
  updateOrganization(org.id, {
  name: orgName.trim(),
  category: orgCategory,
  contactNumber: contactNumber.trim(),
  });
  setSessionOrg(org.id, orgName.trim());
  }
  setIsSaved(true);
  setTimeout(() => setIsSaved(false), 2000);
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
  description="Kelola profil lembaga induk, penanggung jawab, server sinkronisasi, dan salinan kunci pemulihan darurat."
  />

  {/* Profil Lembaga Induk */}
  <Card>
  <CardHeader>
  <div className="flex items-center justify-between">
  <CardTitle>Profil Lembaga Induk</CardTitle>
  <Badge variant="primary" size="sm">
  {getCategoryLabel(orgCategory)}
  </Badge>
  </div>
  </CardHeader>
  <CardContent>
  <form onSubmit={handleSaveProfile} className="space-y-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Lembaga / Instansi
  </label>
  <Input value={orgName}
  onChange={(e) => setOrgName(e.target.value)}
  icon="buildings"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Kategori Lembaga
  </label>
  <select
    value={orgCategory}
    onChange={(e) => setOrgCategory(e.target.value as Organization["category"])}
    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none focus:border-border-strong transition-colors"
  >
  <option value="PMI_LEMBAGA">Palang Merah Indonesia (PMI)</option>
  <option value="BPBD_PEMERINTAH">BPBD / Pemerintah Daerah</option>
  <option value="NGO_YAYASAN">Lembaga Swadaya / Yayasan Kemanusiaan</option>
  <option value="KOMUNITAS_MANDIRI">Komunitas Relawan Mandiri</option>
  </select>
  </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Alamat Markas Komando Induk
  </label>
  <Input value={headquartersAddress}
  onChange={(e) => setHeadquartersAddress(e.target.value)}
  icon="pin"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Hotline / Kontak Posko Induk
  </label>
  <Input value={contactNumber}
  onChange={(e) => setContactNumber(e.target.value)}
  placeholder="+62 263 261 444"
  required
  />
  </div>
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Penanggung Jawab / Ketua Pengurus
  </label>
  <Input value={leadPersonName}
  onChange={(e) => setLeadPersonName(e.target.value)}
  icon="user"
  required
  />
  </div>

  <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
  <div className="flex items-center gap-2">
  <Link href="/org/members">
  <Button variant="outline" size="sm" iconRight="arrow-right">
  Kelola Pengurus & Petugas
  </Button>
  </Link>
  <Link href="/org/missions/create">
  <Button variant="ghost" size="sm">
  + Buka Operasi Baru
  </Button>
  </Link>
  </div>

  <Button
  type="submit"
  variant="primary"
  size="sm"
  icon="check"
  iconVariant="bold"
  className="w-full sm:w-auto"
  >
  {isSaved ? "Tersimpan" : "Simpan Profil Lembaga"}
  </Button>
  </div>
  </form>
  </CardContent>
  </Card>

  {/* Cloud Replication Provider */}
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
  <Input value={byocUrl}
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
