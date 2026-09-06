import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";

export default function NotFound() {
  return (
  <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between p-4 sm:p-8">
  {/* Top Header */}
  <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
  <div className="flex items-center gap-2">
  <SandyaLogo size={28} />
  <div>
  <span className="font-bold text-sm text-text-main">Sandya</span>
  <span className="text-[10px] block text-text-muted">Navigasi Rute</span>
  </div>
  </div>
  </header>

  {/* Main Not Found Box */}
  <main className="max-w-md mx-auto w-full my-auto py-6">
  <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm text-center space-y-4">
  <div className="w-14 h-14 mx-auto rounded-full bg-surface-muted text-text-muted flex items-center justify-center">
  <Icon name="search" variant="linear" size={30} />
  </div>

  <div className="space-y-1.5">
  <h1 className="text-lg font-bold text-text-main tracking-tight">
  Halaman Tidak Ditemukan
  </h1>
  <p className="text-xs text-text-muted leading-relaxed">
  Posko, operasi bencana, atau rute yang Anda tuju belum terdaftar atau telah dipindahkan.
  </p>
  </div>

  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
  <Link href="/" className="flex-1">
  <Button
  variant="primary"
  className="w-full justify-center"
  icon="home"
  iconVariant="bold"
  >
  Ke Beranda
  </Button>
  </Link>
  <Link href="/org" className="flex-1">
  <Button
  variant="outline"
  className="w-full justify-center"
  icon="buildings"
  iconVariant="linear"
  >
  Markas Organisasi
  </Button>
  </Link>
  </div>
  </div>
  </main>

  {/* Footer */}
  <footer className="max-w-md mx-auto w-full text-center text-[11px] text-text-subtle py-2">
  Sandya • Sistem Siaga Kebencanaan Tangguh Offline
  </footer>
  </div>
  );
}
