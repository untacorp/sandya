"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { generate12WordSeed } from "@/core/crypto/seed-phrase";
import { IsomorphicEd25519, KeyPairResult } from "@/core/crypto/ed25519-isomorphic";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { type Organization } from "@/shared/types";

export default function OrgSetupPage() {
  const router = useRouter();
  const { addOrganization, addMission, addPosko, setSessionOrg, setSessionMission, setSessionPosko, setSessionRole } = usePoskoStore();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [orgName, setOrgName] = React.useState("");
  const [orgCategory, setOrgCategory] = React.useState<Organization["category"]>("PMI_LEMBAGA");
  const [missionName, setMissionName] = React.useState("");
  const [poskoName, setPoskoName] = React.useState("");
  const [seedWords, setSeedWords] = React.useState<string[]>([]);
  const [keyPair, setKeyPair] = React.useState<KeyPairResult | null>(null);
  const [seedConfirmed, setSeedConfirmed] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
  // Generate fresh 12-word seed and Ed25519 keypair
  const words = generate12WordSeed();
  setSeedWords(words);

  IsomorphicEd25519.generateKeyPair().then((keys) => {
  setKeyPair(keys);
  });
  }, []);

  const handleFinish = async () => {
  setIsGenerating(true);

  const masterPubkey = keyPair?.rawPublicKeyHex
  ? `did:sandya:org_ed25519_${keyPair.rawPublicKeyHex.slice(0, 16)}`
  : `did:sandya:org_ed25519_${Date.now().toString(16)}`;

  // 1. Create Organization
  const createdOrg = addOrganization({
  name: orgName.trim(),
  category: orgCategory,
  masterPubkey,
  });

  // 2. Create Initial Mission
  const createdMission = addMission({
  orgId: createdOrg.id,
  name: missionName.trim(),
  disasterType: "GEMPA_BUMI",
  status: "ACTIVE_EMERGENCY",
  targetDays: 14,
  location: orgName.trim() || poskoName.trim() || "Wilayah Operasi",
  });

  // 3. Create First Field Posko
  const createdPosko = addPosko({
  orgId: createdOrg.id,
  missionId: createdMission.id,
  name: poskoName.trim(),
  postType: "FIELD_SHELTER",
  status: "OPERATIONAL_NORMAL",
  capacity: 500,
  locationName: poskoName.trim(),
  });

  // 4. Set Active Session as PEMIMPIN_ORGANISASI
  setSessionOrg(createdOrg.id, createdOrg.name);
  setSessionMission(createdMission.id, createdMission.name);
  setSessionPosko(createdPosko.id, createdPosko.name);
  setSessionRole("PEMIMPIN_ORGANISASI");

  setIsGenerating(false);
  router.push(`/posko/${createdPosko.id}`);
  };

  return (
  <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between p-4 sm:p-8">
  {/* Header */}
  <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
  <Link href="/">
  <Button variant="ghost" size="sm" icon="arrow-left" iconVariant="linear">
  Kembali
  </Button>
  </Link>
  <span className="text-xs font-semibold text-text-muted">
  Langkah {step} dari 3
  </span>
  </header>

  {/* Main Container */}
  <main className="max-w-md mx-auto w-full my-auto space-y-5">
  <div className="text-center space-y-1">
  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main">
  Buka Lembaga & Posko Baru
  </h2>
  <p className="text-xs text-text-muted">
  Siapkan data induk lembaga dan posko pertama yang akan bertugas.
  </p>
  </div>

  {step === 1 && (
  <Card className="p-5 sm:p-6 space-y-4 shadow-2xs">
  <CardHeader className="p-0">
  <CardTitle>Identitas Lembaga</CardTitle>
  </CardHeader>
  <div className="space-y-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Lembaga / Organisasi
  </label>
  <Input value={orgName}
  onChange={(e) => setOrgName(e.target.value)}
  placeholder="Contoh: BPBD / PMI / Yayasan"
  icon="buildings"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Kategori
  </label>
  <select
    value={orgCategory}
    onChange={(e) => setOrgCategory(e.target.value as Organization["category"])}
    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-xs text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none focus:border-border-strong transition-colors"
  >
  <option value="PMI_LEMBAGA">PMI / Lembaga Kemanusiaan</option>
  <option value="BPBD_PEMERINTAH">BPBD / Pemerintah</option>
  <option value="NGO_YAYASAN">Yayasan / LSM</option>
  <option value="KOMUNITAS_MANDIRI">Komunitas Relawan Mandiri</option>
  </select>
  </div>

  <div className="pt-2">
  <Button
  variant="primary"
  className="w-full justify-center"
  icon="arrow-right"
  iconVariant="bold"
  disabled={!orgName.trim()}
  onClick={() => setStep(2)}
  >
  Lanjut
  </Button>
  </div>
  </div>
  </Card>
  )}

  {step === 2 && (
  <Card className="p-5 sm:p-6 space-y-4 shadow-2xs">
  <CardHeader className="p-0">
  <CardTitle>Operasi & Posko Pertama</CardTitle>
  </CardHeader>
  <div className="space-y-3">
  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Operasi Tanggap Bencana
  </label>
  <Input value={missionName}
  onChange={(e) => setMissionName(e.target.value)}
  placeholder="Contoh: Tanggap Gempa Cianjur"
  icon="shield"
  required
  />
  </div>

  <div>
  <label className="text-xs font-semibold text-text-muted block mb-1">
  Nama Posko Lapangan Pertama
  </label>
  <Input value={poskoName}
  onChange={(e) => setPoskoName(e.target.value)}
  placeholder="Contoh: Posko Lapangan RW 03 Cijedil"
  icon="home"
  required
  />
  </div>

  <div className="flex gap-2 pt-2">
  <Button variant="outline" onClick={() => setStep(1)}>
  Kembali
  </Button>
  <Button
  variant="primary"
  className="flex-1 justify-center"
  icon="arrow-right"
  iconVariant="bold"
  disabled={!missionName.trim() || !poskoName.trim()}
  onClick={() => setStep(3)}
  >
  Lanjut ke Kunci Kriptografi
  </Button>
  </div>
  </div>
  </Card>
  )}

  {step === 3 && (
  <Card className="p-5 sm:p-6 space-y-4 shadow-2xs">
  <CardHeader className="p-0 text-center">
  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-1">
  <Icon name="shield" variant="bold" size={20} />
  </div>
  <CardTitle>Master Key Ed25519 & 12 Kata Sandi</CardTitle>
  <p className="text-xs text-text-muted mt-1">
  Catat 12 kata pemulihan ini pada buku posko fisik untuk mengamankan Master Authority Key lembaga.
  </p>
  </CardHeader>

  {/* Seed Words Grid */}
  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-subtle border border-border">
  {seedWords.map((word, idx) => (
  <div
  key={`${word}-${idx}`}
  className="p-1.5 rounded-lg bg-surface border border-border text-center text-xs font-mono font-medium text-text-main shadow-2xs"
  >
  <span className="text-[10px] text-text-muted mr-1">{idx + 1}.</span>
  {word}
  </div>
  ))}
  </div>

  {keyPair && (
  <div className="p-2.5 rounded-lg bg-surface-subtle border border-border space-y-0.5 text-left text-xs">
  <span className="text-[11px] text-text-muted font-medium block">Public Authority Key:</span>
  <span className="font-mono text-[11px] font-bold text-primary block truncate">
  did:sandya:org_ed25519_{keyPair.rawPublicKeyHex.slice(0, 24)}...
  </span>
  </div>
  )}

  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border text-xs text-text-main">
  <input
  type="checkbox"
  id="confirmSeed"
  checked={seedConfirmed}
  onChange={(e) => setSeedConfirmed(e.target.checked)}
  className="w-4 h-4 rounded text-primary cursor-pointer"
  />
  <label htmlFor="confirmSeed" className="cursor-pointer font-medium">
  Saya sudah mencatat 12 kata sandi dan kunci darurat ini.
  </label>
  </div>

  <Button
  variant="primary"
  className="w-full justify-center"
  disabled={!seedConfirmed || isGenerating}
  icon="check"
  iconVariant="bold"
  onClick={handleFinish}
  >
  {isGenerating ? "Mendirikan Lembaga & Posko..." : "Buka Posko & Mulai Bertugas"}
  </Button>
  </Card>
  )}
  </main>

  <footer className="max-w-md mx-auto w-full text-center py-2 text-xs text-text-subtle">
  Sandya • Offline-First Humanitarian System
  </footer>
  </div>
  );
}
