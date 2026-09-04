"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Dialog } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon";

export default function PublicGuestPage() {
  const [searchName, setSearchName] = React.useState("");
  const [searchOrigin, setSearchOrigin] = React.useState("");
  const [hasSearched, setHasSearched] = React.useState(false);
  const [result, setResult] = React.useState<any | null>(null);
  const [scanModalOpen, setScanModalOpen] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    if (searchName.toLowerCase().includes("siti") || searchName.toLowerCase().includes("rahma")) {
      setResult({
        fullName: "Siti Rahmawati",
        age: 32,
        gender: "Perempuan",
        domicileOrigin: "Dusun Cijedil (RW 03)",
        poskoName: "Posko GOR Pacet",
        shelterLocation: "Ruang Kelas 2B SDN 1 Pacet",
        condition: "Sehat / Stabil (Ibu Hamil)",
        recordedAt: "Hari ini, 10:15 WIB",
      });
    } else if (searchName.toLowerCase().includes("budi")) {
      setResult({
        fullName: "Muhammad Budi Santoso",
        age: 34,
        gender: "Laki-laki",
        domicileOrigin: "Dusun Cijedil (RW 03)",
        poskoName: "Posko Lapangan RW 03 Cijedil",
        shelterLocation: "Tenda Darurat 02",
        condition: "Sehat / Aktif",
        recordedAt: "Hari ini, 08:30 WIB",
      });
    } else {
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" icon="arrow-left" iconVariant="linear">
              Kembali
            </Button>
          </Link>
          <span className="text-xs text-text-muted">Pencarian Keluarga</span>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-md mx-auto w-full px-4 py-8 my-auto space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main">
            Pencarian Keluarga & Kerabat
          </h1>
          <p className="text-xs text-text-muted">
            Cari data keberadaan sanak saudara yang terdaftar di posko pengungsian.
          </p>
        </div>

        {/* Form Pencarian */}
        <Card className="p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main block">
                Nama Keluarga yang Dicari
              </label>
              <Input
                placeholder="misal: Siti Rahmawati"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                icon="search"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main block">
                Asal Dusun / Desa (Opsional)
              </label>
              <Input
                placeholder="misal: Dusun Cijedil"
                value={searchOrigin}
                onChange={(e) => setSearchOrigin(e.target.value)}
                icon="pin"
                className="text-xs"
              />
            </div>

            <div className="pt-1 flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 justify-center"
                icon="search"
                iconVariant="bold"
              >
                Cari Data
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1 justify-center"
                icon="qr-code"
                iconVariant="bold"
                onClick={() => setScanModalOpen(true)}
              >
                Pindai Kertas Posko
              </Button>
            </div>
          </form>
        </Card>

        {/* Hasil Pencarian */}
        {hasSearched && (
          <div>
            {result ? (
              <Card className="p-4 border-status-safe-border bg-status-safe-bg/20 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-status-safe flex items-center gap-1.5">
                    <Icon name="check" variant="bold" size={16} />
                    Data Ditemukan
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {result.recordedAt}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-bold text-text-main">
                    {result.fullName} ({result.age} th)
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Asal: {result.domicileOrigin} • Kondisi: {result.condition}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-border space-y-1 text-xs">
                  <p className="text-text-muted">
                    Posko: <strong className="text-text-main">{result.poskoName}</strong>
                  </p>
                  <p className="text-text-muted">
                    Lokasi Tenda: <strong className="text-text-main">{result.shelterLocation}</strong>
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-5 text-center space-y-1.5 shadow-2xs">
                <Icon name="users" variant="linear" size={24} className="mx-auto text-text-muted" />
                <h2 className="text-sm font-bold text-text-main">
                  Data Belum Ditemukan
                </h2>
                <p className="text-xs text-text-muted max-w-xs mx-auto">
                  Pastikan penulisan nama sudah benar atau tanyakan ke meja informasi posko terdekat.
                </p>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Modal Pindai Kertas Posko */}
      <Dialog
        open={scanModalOpen}
        onOpenChange={setScanModalOpen}
        title="Pindai Berkas Posko"
        description="Arahkan kamera ke lembaran kode QR yang tertempel di papan pengumuman posko."
      >
        <div className="space-y-3 pt-1">
          <div className="h-44 rounded-lg bg-slate-900 flex flex-col items-center justify-center text-white text-center p-4">
            <Icon name="qr-code" variant="linear" size={36} className="text-white/40" />
            <p className="text-xs text-white/70 mt-2 font-medium">
              Arahkan kamera ke kode QR posko
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() => setScanModalOpen(false)}
          >
            Tutup
          </Button>
        </div>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-4 py-3 text-center text-xs text-text-muted">
        Layanan pencarian warga ini dapat diakses bebas tanpa perlu login.
      </footer>
    </div>
  );
}
