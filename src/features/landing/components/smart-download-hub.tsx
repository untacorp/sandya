"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";
import { Icon, type SolarIconName } from "@/shared/ui/icon";
import { detectClientOS, getPlatformDetails, type SupportedOS } from "@/shared/lib/platform";
import { useGitHubRelease } from "@/features/landing/hooks/use-github-release";

interface PlatformSpec {
  os: SupportedOS;
  title: string;
  icon: SolarIconName;
  fileFormat: string;
  minSpecs: string;
  installGuide: string;
}

const PLATFORM_SPECS: PlatformSpec[] = [
  {
    os: "windows",
    title: "Windows",
    icon: "laptop",
    fileFormat: ".exe (Instalasi Mandiri 64-bit)",
    minSpecs: "Windows 10 / 11 (64-bit), RAM 2 GB",
    installGuide: "Buka file sandya_x64-setup.exe dan ikuti panduan hingga selesai. Data langsung tersimpan lokal.",
  },
  {
    os: "macos",
    title: "macOS",
    icon: "laptop",
    fileFormat: ".dmg (Apple Silicon & Intel)",
    minSpecs: "macOS 12 Monterey ke atas, RAM 2 GB",
    installGuide: "Buka file sandya.dmg lalu seret ikon Sandya ke folder Applications di Mac Anda.",
  },
  {
    os: "linux",
    title: "Linux",
    icon: "server",
    fileFormat: ".AppImage & .deb (x86_64)",
    minSpecs: "Ubuntu 20.04+, Debian 11+, Fedora, RAM 2 GB",
    installGuide: "Jalankan berkas AppImage langsung (chmod +x) tanpa perlu izin root.",
  },
  {
    os: "android",
    title: "Android",
    icon: "smartphone",
    fileFormat: ".apk (ARM64)",
    minSpecs: "Android 8.0 ke atas, Bluetooth aktif",
    installGuide: "Unduh file APK lalu pasang di ponsel relawan. Izinkan instalasi dari peramban jika diminta.",
  },
  {
    os: "ios",
    title: "iOS",
    icon: "smartphone",
    fileFormat: "Bundle App / IPA",
    minSpecs: "iOS 15.0 ke atas, Bluetooth & Kamera",
    installGuide: "Paket aplikasi bundle mandiri untuk uji coba lapangan via TestFlight / Developer install.",
  },
];

const emptySubscribe = () => () => {};

export function SmartDownloadHub() {
  const clientOS = React.useSyncExternalStore(
    emptySubscribe,
    detectClientOS,
    () => "unknown" as SupportedOS
  );
  const [manualOS, setManualOS] = React.useState<SupportedOS | null>(null);
  const release = useGitHubRelease();

  const selectedOS = manualOS || (clientOS !== "unknown" ? clientOS : "windows");
  const setSelectedOS = (os: SupportedOS) => setManualOS(os);

  const selectedPlatform = getPlatformDetails(selectedOS, release.version);
  const activeSpec = PLATFORM_SPECS.find((p) => p.os === selectedOS) || PLATFORM_SPECS[0];
  const downloadDetails = release.getAssetForOS(selectedOS);

  return (
    <div id="unduh" className="rounded-2xl border-[1.5px] border-border bg-surface p-6 sm:p-10 space-y-8">
      {/* 1. Header Ringkas & Terfokus */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h3 className="text-xl sm:text-3xl font-bold tracking-tight text-text-main">
          Unduh Aplikasi Lapangan Sandya
        </h3>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
          Aplikasi mandiri untuk laptop posko dan ponsel relawan. Siap pakai 100% tanpa internet.
        </p>
      </div>

      {/* 2. Tombol Aksi Utama Sesuai Perangkat Pengunjung */}
      <div className="max-w-md mx-auto text-center space-y-3">
        <a
          href={downloadDetails.downloadUrl}
          target={downloadDetails.isDirect ? undefined : "_blank"}
          rel="noreferrer"
          className="block"
        >
          <Button
            variant="primary"
            size="lg"
            className="w-full h-14 justify-center text-sm sm:text-base font-bold shadow-xs cursor-pointer"
            icon="download"
            iconVariant="bold"
            suppressHydrationWarning
          >
            Unduh untuk {selectedPlatform.label.split(" ")[0]} ({release.version})
          </Button>
        </a>

        <div className="text-xs text-text-muted flex items-center justify-center gap-3" suppressHydrationWarning>
          <span>Format: <strong className="text-text-main font-mono">{activeSpec.fileFormat.split(" ")[0]}</strong></span>
          <span>•</span>
          <span>Rilis: <strong className="text-text-main font-mono">{release.version}</strong></span>
          <span>•</span>
          <span>{release.publishedDate}</span>
        </div>
      </div>

      {/* 3. Segmented Pill Pemilih Sistem Operasi Lain (Sangat Bersih) */}
      <div className="max-w-xl mx-auto pt-2 border-t border-border space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-surface-subtle rounded-xl border border-border">
          {PLATFORM_SPECS.map((spec) => {
            const isSelected = selectedOS === spec.os;

            return (
              <button
                key={spec.os}
                type="button"
                onClick={() => setSelectedOS(spec.os)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-surface text-text-main shadow-xs border border-border"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                <Icon name={spec.icon} variant={isSelected ? "bold" : "linear"} size={14} />
                <span>{spec.title}</span>
                {clientOS === spec.os && (
                  <span className="w-1.5 h-1.5 rounded-full bg-status-safe inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Petunjuk Singkat Pemasangan Platform Terpilih */}
        <div className="text-center text-xs text-text-muted max-w-lg mx-auto leading-relaxed" suppressHydrationWarning>
          <span className="font-semibold text-text-main">{activeSpec.minSpecs}</span> — {activeSpec.installGuide}
        </div>
      </div>

      {/* 4. Opsi Kompilasi Mandiri untuk Teknisi & Pengembang */}
      <div className="max-w-xl mx-auto pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-text-muted">
          Kompilasi mandiri dari kode sumber terbuka:
        </span>
        <div className="font-mono text-xs bg-surface-subtle px-2.5 py-1.5 rounded-md border border-border text-text-main select-all overflow-x-auto whitespace-nowrap">
          git clone https://github.com/untacorp/sandya.git &amp;&amp; pnpm tauri build
        </div>
      </div>
    </div>
  );
}
