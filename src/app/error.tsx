"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
  // Log runtime exception safely
  console.error("Caught in Sandya ErrorBoundary:", error);
  }, [error]);

  return (
  <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between p-4 sm:p-8">
  {/* Top Header */}
  <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
  <div className="flex items-center gap-2">
  <SandyaLogo size={28} className="text-status-danger" />
  <div>
  <span className="font-bold text-sm text-text-main">Sandya</span>
  <span className="text-[10px] block text-text-muted">Protokol Penanganan Kendala</span>
  </div>
  </div>
  </header>

  {/* Main Error Box */}
  <main className="max-w-md mx-auto w-full my-auto py-6">
  <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm text-center space-y-4">
  <div className="w-14 h-14 mx-auto rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center">
  <Icon name="alert" variant="bold" size={32} />
  </div>

  <div className="space-y-1.5">
  <h1 className="text-lg font-bold text-text-main tracking-tight">
  Terjadi Kendala Memuat Halaman
  </h1>
  <p className="text-xs text-text-muted leading-relaxed">
  Sistem mendeteksi kendala pada state atau pemanggilan rute aktif. Data offline Anda tetap aman tersimpan di perangkat lokal.
  </p>
  </div>

  {error?.message && (
  <div className="p-3 rounded-lg bg-surface-muted border border-border text-left font-mono text-[11px] text-text-muted break-all max-h-28 overflow-y-auto">
  {error.message}
  {error.digest && <span className="block mt-1 text-[10px] text-text-subtle">ID Digest: {error.digest}</span>}
  </div>
  )}

  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
  <Button
  variant="primary"
  className="flex-1 justify-center"
  icon="sync"
  iconVariant="bold"
  onClick={() => reset()}
  >
  Coba Lagi
  </Button>
  <Link href="/" className="flex-1">
  <Button
  variant="outline"
  className="w-full justify-center"
  icon="home"
  iconVariant="linear"
  >
  Ke Beranda
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
