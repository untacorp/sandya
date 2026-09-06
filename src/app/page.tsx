"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/badge";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { getRoleDisplayName } from "@/features/auth/utils/role-routing";
import { SandyaLogo } from "@/shared/ui/sandya-logo";

export default function LandingGatewayPage() {
  const { session } = usePoskoStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasActiveSession = isMounted && Boolean(session.poskoId || session.missionId);

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between">
      {/* 1. Header Ringkas & Status Perangkat */}
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SandyaLogo size={30} />
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-text-main">
                Sandya
              </span>
              <Badge variant="neutral" size="sm" className="text-[10px] font-semibold">
                v2.4
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-safe-bg text-status-safe border border-status-safe-border font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
              Siaga Offline (0 Internet)
            </span>
          </div>
        </div>
      </header>

      {/* 2. Portal Masuk Utama */}
      <main className="max-w-3xl mx-auto w-full px-4 py-6 sm:py-10 my-auto space-y-6">
        {/* Banner Sesi Aktif (Jika Petugas sudah Scan QR sebelumnya) */}
        {hasActiveSession && (
          <div className="p-4 sm:p-5 rounded-2xl bg-surface border-2 border-primary/40 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon name="shield" variant="bold" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Kartu Tugas Aktif
                    </span>
                    <Badge variant="primary" size="sm">
                      {session.userRole}
                    </Badge>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-text-main mt-0.5">
                    {session.userName} • {getRoleDisplayName(session.userRole)}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {session.poskoName ? `Posko: ${session.poskoName}` : ""}
                    {session.missionName ? ` • Misi: ${session.missionName}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center gap-2">
              {session.poskoId && (
                <Link href={`/posko/${session.poskoId}`} className="w-full sm:flex-1">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    icon="home"
                    iconVariant="bold"
                    iconRight="arrow-right"
                  >
                    Lanjutkan Tugas di Posko
                  </Button>
                </Link>
              )}
              {session.missionId && (
                <Link href={`/missions/${session.missionId}`} className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full justify-center"
                    icon="radar"
                    iconVariant="bold"
                  >
                    Ruang Situasi Misi
                  </Button>
                </Link>
              )}
              <Link href="/activate" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full justify-center text-xs text-text-muted hover:text-text-main"
                >
                  Ganti Kartu / Pindai Ulang
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3 Pintu Akses Terstruktur */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* PINTU 1: Scan Kartu Tugas (Pilihan Utama Petugas) */}
          <Link
            href="/activate"
            className="group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 border-primary/30 bg-surface hover:border-primary hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                  <Icon name="qr-code" variant="bold" size={22} />
                </div>
                <Badge variant="primary" size="sm">
                  Petugas / Tim
                </Badge>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text-main group-hover:text-primary transition-colors">
                  Pindai Kartu Tugas
                </h2>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                  Untuk Dokter, Petugas Logistik, dan Relawan. Sorot kamera ke QR atau ketik kode manual dari Koordinator.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Buka Pemindai QR</span>
              <Icon
                name="arrow-right"
                variant="linear"
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          {/* PINTU 2: Mode Warga (Cari Keluarga) */}
          <Link
            href="/guest"
            className="group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-border bg-surface hover:border-status-safe-border hover:shadow-md transition-all cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-status-safe-bg text-status-safe border border-status-safe-border flex items-center justify-center">
                  <Icon name="search" variant="bold" size={22} />
                </div>
                <Badge variant="triage-green" size="sm">
                  Publik / Warga
                </Badge>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text-main group-hover:text-status-safe transition-colors">
                  Cari Keluarga
                </h2>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                  Layanan pencarian kerabat terpisah atau meninjau daftar warga antar-posko tanpa perlu akun atau izin khusus.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs font-bold text-status-safe">
              <span>Cari Kerabat / Poster</span>
              <Icon
                name="arrow-right"
                variant="linear"
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          {/* PINTU 3: Inisiasi Lembaga (Khusus Pimpinan Organisasi) */}
          <Link
            href="/org-setup"
            className="group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-border bg-surface hover:border-border-hover hover:shadow-md transition-all cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-surface-muted text-text-main border border-border flex items-center justify-center">
                  <Icon name="buildings" variant="bold" size={22} />
                </div>
                <Badge variant="neutral" size="sm">
                  Pimpinan
                </Badge>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text-main group-hover:text-primary transition-colors">
                  Setup Lembaga Baru
                </h2>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                  Inisiasi lembaga PMI, BPBD, atau Yayasan baru, generate Master Key Ed25519, dan buka Misi Bencana.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs font-semibold text-text-muted group-hover:text-text-main">
              <span>Inisiasi Master Key</span>
              <Icon
                name="arrow-right"
                variant="linear"
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>
        </div>

        {/* 4. Opsi Akses Darurat / Fallback */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-text-muted text-center sm:text-left">
            <Icon name="shield" variant="linear" size={18} className="shrink-0 text-text-muted" />
            <span>Kamera ponsel bermasalah atau lensa rusak di reruntuhan bencana?</span>
          </div>
          <Link href="/activate" className="shrink-0">
            <Button variant="outline" size="sm">
              Gunakan Kode Manual (SAN-...)
            </Button>
          </Link>
        </div>
      </main>

      {/* 5. Footer Bersih */}
      <footer className="border-t border-border bg-surface px-4 py-3 text-center text-xs text-text-muted">
        Sandya • Sistem Tanggap Darurat Bencana Mandiri
      </footer>
    </div>
  );
}
