"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export default function OrgSetupPage() {
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [orgName, setOrgName] = React.useState("PMI Kabupaten Cianjur");
  const [orgCategory, setOrgCategory] = React.useState("PMI_LEMBAGA");
  const [missionName, setMissionName] = React.useState("Tanggap Darurat Gempa Cianjur");
  const [poskoName, setPoskoName] = React.useState("Posko Lapangan RW 03 Cijedil");
  const [seedConfirmed, setSeedConfirmed] = React.useState(false);

  const seedWords = [
    "mountain", "rescue", "anchor", "signal", "shelter", "water",
    "harvest", "bridge", "beacon", "summit", "canyon", "patrol"
  ];

  const handleFinish = () => {
    router.push("/posko/POS-01");
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
          <Card className="p-5 sm:p-6 space-y-4">
            <CardHeader className="p-0">
              <CardTitle>Identitas Lembaga</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Nama Lembaga / Organisasi
                </label>
                <Input
                  value={orgName}
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
                  onChange={(e) => setOrgCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary"
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
                  onClick={() => setStep(2)}
                >
                  Lanjut
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-5 sm:p-6 space-y-4">
            <CardHeader className="p-0">
              <CardTitle>Operasi & Posko Pertama</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Nama Operasi Tanggap Bencana
                </label>
                <Input
                  value={missionName}
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
                <Input
                  value={poskoName}
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
                  onClick={() => setStep(3)}
                >
                  Lanjut ke Kunci Cadangan
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-5 sm:p-6 space-y-4">
            <CardHeader className="p-0 text-center">
              <CardTitle>Cadangan 12 Kata Kunci</CardTitle>
              <p className="text-xs text-text-muted mt-1">
                Catat 12 kata ini pada buku posko fisik untuk memulihkan akun pengurus jika perangkat hilang.
              </p>
            </CardHeader>

            {/* Seed Words Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-subtle border border-border">
              {seedWords.map((word, idx) => (
                <div
                  key={word}
                  className="p-1.5 rounded-lg bg-surface border border-border text-center text-xs font-mono font-medium text-text-main"
                >
                  <span className="text-[10px] text-text-muted mr-1">{idx + 1}.</span>
                  {word}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border text-xs text-text-main">
              <input
                type="checkbox"
                id="confirmSeed"
                checked={seedConfirmed}
                onChange={(e) => setSeedConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-primary cursor-pointer"
              />
              <label htmlFor="confirmSeed" className="cursor-pointer">
                Saya sudah mencatat 12 kata sandi ini.
              </label>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              disabled={!seedConfirmed}
              icon="check"
              iconVariant="bold"
              onClick={handleFinish}
            >
              Buka Posko & Mulai Bertugas
            </Button>
          </Card>
        )}
      </main>

      <footer className="max-w-md mx-auto w-full text-center py-2 text-xs text-text-subtle">
        Sanidya
      </footer>
    </div>
  );
}
