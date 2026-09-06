"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";
import { LandingNavbar } from "./landing-navbar";
import { InteractivePoskoTerminal } from "./interactive-posko-terminal";
import { SmartDownloadHub } from "./smart-download-hub";
import { DemoLauncherModal } from "./demo-launcher-modal";

export function WebLandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col selection:bg-primary selection:text-primary-foreground font-sans antialiased">
      {/* 1. NAVBAR RESPONSIF DENGAN DUKUNGAN TABLET & MOBILE */}
      <LandingNavbar
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      {/* 2. HERO SECTION DENGAN TERMINAL KOMANDO LAPANGAN */}
      <section className="pt-16 sm:pt-24 lg:pt-28 pb-20 sm:pb-28 lg:pb-36 px-4 sm:px-6 lg:px-8 bg-canvas">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-main leading-[1.12]">
            Sistem Operasi Bencana yang Bekerja Saat Sinyal dan Listrik Padam Total
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Saat gempa bumi atau banjir memutus seluruh jaringan seluler, Sandya membantu posko mendata ribuan pengungsi,
            memilah korban kritis dengan triase 4 warna internasional, mengontrol stok sembako agar tidak dobel ambil,
            dan mempertemukan keluarga yang terpisah—seluruhnya beroperasi secara mandiri di komputer atau ponsel Anda tanpa internet.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#unduh" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-7 h-12 justify-center font-bold text-sm sm:text-base shadow-xs cursor-pointer"
                icon="download"
                iconVariant="bold"
              >
                Unduh Aplikasi
              </Button>
            </a>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto px-7 h-12 justify-center font-semibold text-sm sm:text-base cursor-pointer"
              icon="play"
              iconVariant="bold"
              onClick={() => setIsDemoModalOpen(true)}
            >
              Coba Demo Web
            </Button>
          </div>

          <div className="pt-1 text-xs text-text-muted">
            Tersedia untuk Windows, macOS, Linux, dan Android • Open-source berlisensi MIT oleh Unta Corp.
          </div>
        </div>

        {/* CENTERPIECE: TERMINAL KOMANDO POSKO NYATA */}
        <div id="posko-terminal" className="max-w-6xl mx-auto mt-14 sm:mt-20">
          <div className="mb-3 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Icon name="radar" variant="bold" size={16} className="text-primary" />
              <span className="font-semibold text-text-main">
                Simulasi Operasional Lapangan: Posko Balai Desa Nagrak, Cugenang
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Luncurkan Demo Web Lengkap</span>
              <Icon name="arrow-right" variant="linear" size={14} />
            </button>
          </div>

          <InteractivePoskoTerminal />
        </div>
      </section>

      {/* 3. REALITAS LAPANGAN (EDITORIAL DOKUMENTER DENGAN GAP LEBAR) */}
      <section id="lapangan" className="py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 border-y border-border bg-surface-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Kolom Kiri: Pernyataan Fakta Lapangan */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-main leading-tight">
                Dirancang dari Realitas Pahit di Garis Depan Bencana
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Sebagian besar aplikasi modern gagal saat bencana karena mengasumsikan sinyal seluler selalu aktif,
                server cloud selalu terhubung, dan pasokan listrik selalu menyala.
              </p>
              <p className="text-sm text-text-muted leading-relaxed">
                Sandya dibangun dengan filosofi zero-infrastructure: seluruh data dan logika komando tersimpan permanen
                di memori perangkat posko Anda.
              </p>
            </div>

            {/* Kolom Kanan: 4 Kasus Lapangan Nyata & Solusi */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-7 rounded-xl border-[1.5px] border-border bg-surface space-y-3">
                <h3 className="font-bold text-text-main text-base sm:text-lg">
                  Kabel Optik Putus &amp; Menara BTS Tumbang
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Saat gempa dahsyat atau tanah longsor terjadi, tiang seluler roboh dan aliran listrik terputus.
                  Aplikasi yang mewajibkan login Google atau server online seketika macet di layar putih dan tidak dapat dibuka.
                </p>
                <div className="pt-2 text-xs sm:text-sm text-text-main font-semibold">
                  Solusi Sandya: Aplikasi dan seluruh datanya tersimpan di memori lokal laptop atau ponsel. Buka dan gunakan langsung tanpa butuh sinyal seluler.
                </div>
              </div>

              <div className="p-6 sm:p-7 rounded-xl border-[1.5px] border-border bg-surface space-y-3">
                <h3 className="font-bold text-text-main text-base sm:text-lg">
                  Kekacauan Logistik Kertas &amp; Pengambilan Bantuan Ganda
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Pencatatan beras, selimut, dan obat di atas kertas mudah hancur terkena hujan dan lumpur. Warga bisa mengantre
                  di dua posko berbeda dan mengambil bantuan dobel, sementara posko terpencil kehabisan persediaan pokok.
                </p>
                <div className="pt-2 text-xs sm:text-sm text-text-main font-semibold">
                  Solusi Sandya: Satu komputer memegang kunci buku gudang. Stok terpotong otomatis dan diverifikasi sehingga bantuan tidak bisa dikeluarkan dua kali.
                </div>
              </div>

              <div className="p-6 sm:p-7 rounded-xl border-[1.5px] border-border bg-surface space-y-3">
                <h3 className="font-bold text-text-main text-base sm:text-lg">
                  Puluhan Pasien Tiba Bersamaan di Pos Medis Darurat
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Di jam-jam pertama evakuasi, korban reruntuhan berdatangan serentak sementara tenaga medis sangat terbatas.
                  Tanpa pemilahan terstruktur, korban dengan henti napas atau pendarahan masif bisa terlambat ditangani.
                </p>
                <div className="pt-2 text-xs sm:text-sm text-text-main font-semibold">
                  Solusi Sandya: Standar Triase 4 Warna START Internasional (Merah, Kuning, Hijau, Hitam) yang memandu relawan memilah prioritas darurat di bawah 60 detik.
                </div>
              </div>

              <div className="p-6 sm:p-7 rounded-xl border-[1.5px] border-border bg-surface space-y-3">
                <h3 className="font-bold text-text-main text-base sm:text-lg">
                  Keluarga Terpisah di Berbagai Lokasi Pengungsian
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Anak dan orang tua terpisah saat menyelamatkan diri. Warga harus berjalan kaki menembus jalanan rusak
                  dari satu posko ke posko lain hanya untuk mengecek nama kerabat di papan pengumuman.
                </p>
                <div className="pt-2 text-xs sm:text-sm text-text-main font-semibold">
                  Solusi Sandya: Pencarian nama cerdas yang mengenali panggilan keluarga dan toleran terhadap ejaan lokal, bekerja langsung di perangkat tanpa internet.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CARA DATA BERPINDAH TANPA SINYAL (ARSITEKTUR TRANSMISI) */}
      <section id="tanpa-sinyal" className="py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-canvas">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-main">
              Empat Jalur Perpindahan Data Tanpa Jaringan Internet
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Sandya memadukan jalur transmisi nirkabel lokal, pemindaian visual optik, dan lembaran fisik agar
              informasi posko tetap mengalir meski seluruh koneksi luar terputus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            <div className="p-6 sm:p-7 rounded-xl border-[1.5px] border-border bg-surface space-y-3">
              <div className="text-xs font-semibold text-text-muted">
                Jalur Transmisi 1 (Otomatis)
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-main">
                Pertukaran Bluetooth Antar-Ponsel
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Ponsel dua relawan bertukar paket data pengungsi, rekam medis, dan mutasi stok secara otomatis
                saat mereka berpapasan dalam jarak 15–30 meter, tanpa perlu memasangkan (pairing) perangkat atau memasukkan sandi.
              </p>
              <div className="pt-2 text-xs text-text-main font-semibold">
                Relawan tidak perlu bolak-balik ke posko utama hanya untuk menyalin catatan data.
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-xl border-[1.5px] border-border bg-surface space-y-3">
              <div className="text-xs font-semibold text-text-muted">
                Jalur Transmisi 2 (Visual Cepat)
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-main">
                Pemindaian Aliran Barcode Layar-ke-Layar
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Layar ponsel memancarkan rangkaian barcode berkecepatan tinggi. Kamera ponsel kedua cukup menyorot
                layar tersebut selama 6 detik untuk menyalin puluhan data warga dan resep obat seketika tanpa kabel data.
              </p>
              <div className="pt-2 text-xs text-text-main font-semibold">
                Bisa digunakan di lingkungan bising, kendaraan bergerak, atau antar-ponsel beda tipe.
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-xl border-[1.5px] border-border bg-surface space-y-3">
              <div className="text-xs font-semibold text-text-muted">
                Jalur Transmisi 3 (Fisik)
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-main">
                Poster Barcode Fisik Tahan Sobek
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Daftar warga dapat dicetak menjadi selembar poster barcode untuk ditempel di papan posko. Berkat
                perhitungan cadangan khusus (Reed-Solomon), kamera tetap membaca data utuh meski poster tergores atau sobek 30%.
              </p>
              <div className="pt-2 text-xs text-text-main font-semibold">
                Relawan dari lembaga luar dapat langsung memindai seluruh manifes warga ke HP masing-masing.
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-xl border-[1.5px] border-border bg-surface space-y-3">
              <div className="text-xs font-semibold text-text-muted">
                Jalur Transmisi 4 (Pemulihan)
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-main">
                Penyatuan Otomatis Saat Sinyal Pulih
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Saat tim posko tiba di area yang memiliki sambungan satelit atau kembali ke jangkauan seluler,
                seluruh mutasi otomatis terkirim ke markas BPBD tanpa ada risiko data tertimpa atau hilang.
              </p>
              <div className="pt-2 text-xs text-text-main font-semibold">
                Pusat komando mendapat rekapitulasi darurat tanpa perlu menginput ulang secara manual.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PUSAT UNDUHAN TERFOKUS (GAP BESAR & ELEGAN) */}
      <section id="unduh" className="py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 border-t border-border bg-surface-subtle">
        <div className="max-w-4xl mx-auto space-y-6">
          <SmartDownloadHub />
        </div>
      </section>

      {/* 6. FOOTER RESMI & BERSIH */}
      <footer className="border-t border-border bg-surface py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-xs text-text-muted">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <SandyaLogo size={30} />
                <span className="text-base sm:text-lg font-bold tracking-tight text-text-main">
                  Sandya
                </span>
              </div>
              <p className="text-xs text-text-muted max-w-md leading-relaxed">
                Sistem Operasi Tanggap Darurat Bencana &amp; Manajemen Posko Lapangan Mandiri (Offline-First).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="hover:text-text-main font-semibold transition-colors cursor-pointer"
              >
                Coba Demo Web
              </button>
              <a href="#posko-terminal" className="hover:text-text-main transition-colors font-semibold">
                Simulasi Posko
              </a>
              <a href="#lapangan" className="hover:text-text-main transition-colors font-semibold">
                Realitas Lapangan
              </a>
              <a href="#tanpa-sinyal" className="hover:text-text-main transition-colors font-semibold">
                Pindah Data
              </a>
              <a href="#unduh" className="hover:text-text-main transition-colors font-semibold">
                Pusat Unduhan
              </a>
              <a
                href="https://github.com/untacorp/sandya"
                target="_blank"
                rel="noreferrer"
                className="hover:text-text-main transition-colors flex items-center gap-1 font-bold text-text-main"
              >
                <span>GitHub untacorp/sandya</span>
                <Icon name="arrow-right" variant="linear" size={13} />
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <div>
              Dirilis di bawah <strong className="text-text-main font-semibold">MIT License</strong> • Hak Cipta &copy; 2026 <strong className="text-text-main font-semibold">Unta Corp.</strong>
            </div>
            <div className="text-text-muted font-medium text-xs">
              Inisiatif Kemanusiaan Mandiri Sandya
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL PELUNCUR DEMO INSTAN */}
      <DemoLauncherModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}
