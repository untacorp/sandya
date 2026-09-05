"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";

export default function LandingGatewayPage() {
  const { session } = usePoskoStore();

  return (
  <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between">
  {/* 1. Header Bersih */}
  <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
  <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
  <div className="flex items-center gap-2.5">
  <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
  S
  </div>
  <div>
  <span className="text-sm font-bold tracking-tight text-text-main">
  Sandya
  </span>
  <span className="hidden sm:inline text-xs text-text-muted ml-2">
  Tanggap Darurat Posko
  </span>
  </div>
  </div>

  <div className="flex items-center gap-2 text-xs text-text-muted">
  <span className="w-2 h-2 rounded-full bg-status-safe" />
  <span className="hidden sm:inline">Posko Aktif:</span>
  <span className="font-semibold text-text-main">{session.poskoName}</span>
  </div>
  </div>
  </header>

  {/* 2. Portal Masuk Utama */}
  <main className="max-w-3xl mx-auto w-full px-4 py-8 sm:py-12 my-auto space-y-6">
  {/* Judul & Penjelasan */}
  <div className="space-y-1.5 text-center sm:text-left">
  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">
  Pusat Koordinasi & Pendataan Bencana
  </h1>
  <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
  Sistem pencatatan data warga, pemeriksaan kesehatan, dan pembagian bantuan yang dapat beroperasi mandiri tanpa koneksi internet.
  </p>
  </div>

  {/* 3 Pilihan Akses */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  {/* Pilihan 1: Masuk Petugas */}
  <Link
  href="/activate"
  className="group flex flex-col justify-between p-4 rounded-xl border border-border bg-surface hover:border-primary transition-colors cursor-pointer shadow-2xs"
  >
  <div className="space-y-2.5">
  <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
  <Icon name="qr-code" variant="bold" size={18} />
  </div>
  <div>
  <h2 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
  Masuk Petugas
  </h2>
  <p className="text-xs text-text-muted mt-1 leading-relaxed">
  Pindai kartu tugas untuk mulai mencatat warga, medis, atau logistik.
  </p>
  </div>
  </div>

  <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary">
  <span>Buka Pemindai</span>
  <Icon
  name="arrow-right"
  variant="linear"
  size={14}
  className="transition-transform group-hover:translate-x-0.5"
  />
  </div>
  </Link>

  {/* Pilihan 2: Cari Keluarga */}
  <Link
  href="/guest"
  className="group flex flex-col justify-between p-4 rounded-xl border border-border bg-surface hover:border-status-safe-border transition-colors cursor-pointer shadow-2xs"
  >
  <div className="space-y-2.5">
  <div className="w-9 h-9 rounded-lg bg-status-safe-bg text-status-safe border border-status-safe-border flex items-center justify-center">
  <Icon name="search" variant="bold" size={18} />
  </div>
  <div>
  <h2 className="text-sm font-bold text-text-main group-hover:text-status-safe transition-colors">
  Cari Keluarga
  </h2>
  <p className="text-xs text-text-muted mt-1 leading-relaxed">
  Layanan untuk warga yang mencari informasi sanak saudara di posko.
  </p>
  </div>
  </div>

  <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-status-safe">
  <span>Cari Nama / NIK</span>
  <Icon
  name="arrow-right"
  variant="linear"
  size={14}
  className="transition-transform group-hover:translate-x-0.5"
  />
  </div>
  </Link>

  {/* Pilihan 3: Pengelola Induk */}
  <Link
  href="/org"
  className="group flex flex-col justify-between p-4 rounded-xl border border-border bg-surface hover:border-border-hover transition-colors cursor-pointer shadow-2xs"
  >
  <div className="space-y-2.5">
  <div className="w-9 h-9 rounded-lg bg-surface-muted text-text-main border border-border flex items-center justify-center">
  <Icon name="buildings" variant="bold" size={18} />
  </div>
  <div>
  <h2 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
  Pengelola Induk
  </h2>
  <p className="text-xs text-text-muted mt-1 leading-relaxed">
  Pusat komando induk PMI / BPBD untuk ringkasan posko wilayah.
  </p>
  </div>
  </div>

  <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-text-main group-hover:text-primary">
  <span>Buka Menu Induk</span>
  <Icon
  name="arrow-right"
  variant="linear"
  size={14}
  className="transition-transform group-hover:translate-x-0.5"
  />
  </div>
  </Link>
  </div>

  {/* 3. Pintasan Langsung */}
  <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5">
  <p className="text-xs font-semibold text-text-muted">
  Pintasan Langsung:
  </p>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
  <Link href={`/posko/${session.poskoId}`} className="block">
  <Button
  variant="primary"
  size="sm"
  className="w-full justify-between"
  icon="home"
  iconVariant="bold"
  iconRight="arrow-right"
  >
  <span className="truncate">{session.poskoName ? `Posko ${session.poskoName}` : "Masuk ke Posko"}</span>
  </Button>
  </Link>

  <Link href={`/missions/${session.missionId}`} className="block">
  <Button
  variant="secondary"
  size="sm"
  className="w-full justify-between"
  icon="radar"
  iconVariant="bold"
  iconRight="arrow-right"
  >
  <span className="truncate">{session.missionName || "Operasi Wilayah"}</span>
  </Button>
  </Link>

  <Link href="/org" className="block">
  <Button
  variant="secondary"
  size="sm"
  className="w-full justify-between"
  icon="buildings"
  iconVariant="bold"
  iconRight="arrow-right"
  >
  <span className="truncate">{session.orgName || "Pusat Lembaga"}</span>
  </Button>
  </Link>
  </div>
  </div>
  </main>

  {/* 4. Footer Bersih */}
  <footer className="border-t border-border bg-surface px-4 py-3 text-center text-xs text-text-muted">
  Sandya • Sistem Tanggap Bencana Terdistribusi
  </footer>
  </div>
  );
}
