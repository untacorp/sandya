---
name: "Sandya"
description: "Sistem Operasi Tanggap Darurat Bencana & Logistik Lapangan Offline-First"
colors:
  primary: "#0F172A"
  primary-hover: "#1E293B"
  primary-foreground: "#FFFFFF"
  accent: "#0284C7"
  canvas: "#FFFFFF"
  surface: "#FFFFFF"
  surface-subtle: "#F8FAFC"
  surface-muted: "#F1F5F9"
  border: "#E2E8F0"
  border-hover: "#CBD5E1"
  border-strong: "#94A3B8"
  text-main: "#0F172A"
  text-muted: "#475569"
  text-subtle: "#94A3B8"
  text-inverse: "#FFFFFF"
  status-safe: "#059669"
  status-safe-bg: "#ECFDF5"
  status-safe-border: "#A7F3D0"
  status-warning: "#D97706"
  status-warning-bg: "#FFFBEB"
  status-warning-border: "#FDE68A"
  status-danger: "#DC2626"
  status-danger-bg: "#FEF2F2"
  status-danger-border: "#FECACA"
  triage-red: "#DC2626"
  triage-yellow: "#D97706"
  triage-green: "#059669"
  triage-black: "#1E293B"
typography:
  display:
    fontFamily: "var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  mono:
    fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.status-danger}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  card-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
---

# Design System: Sandya

## Overview

**Creative North Star: "Pos Komando Lapangan (The Field Command Post)"**

Sandya adalah sistem operasi perangkat lunak lapangan yang dikalibrasi untuk kondisi krisis darurat kemanusiaan: gempa bumi, banjir bandang, erupsi gunung, dan tanah longsor. Sistem ini digunakan di tenda posko darurat, antrean distribusi logistik berlumpur, pos medis bergerak, dan lingkungan terik matahari langsung dengan keterbatasan akses internet, listrik, maupun stabilitas fisik operator. 

Filosofi desain Sandya menuntut **disiplin tinggi, keterbacaan instan di luar ruangan (outdoor sunlight contrast), dan zero visual noise**. Setiap piksel dan elemen antarmuka dirancang untuk membantu relawan, dokter, dan komandan lapangan membuat keputusan kritis dalam hitungan detik. Kami menggunakan permukaan putih bersih bertingkat (*tonal layering*), batas struktural presisi 1.5px Slate, tipografi **Plus Jakarta Sans** dengan hierarki bobot yang terukur, serta ikon garis **Solar Icons** tanpa dekorasi yang tidak perlu.

Anti-reference yang ditolak secara mutlak:
1. **No Purple/Neon SaaS Clichés**: Menolak gradien ungu, kartu kaca blur (glassmorphism) berlebih, atau estetika marketing SaaS generik yang membebani daya render GPU dan sulit dibaca di bawah sinar matahari.
2. **No Frivolous Emojis**: Dilarang menampilkan emoji kartun atau ilustrasi 3D ceria pada tombol aksi operasional dan navigasi sistem.
3. **No Generic Fonts**: Menolak tipografi generik tanpa identitas seperti Inter default. Tipografi resmi adalah Plus Jakarta Sans yang dipadukan dengan Geist Mono khusus identitas teknis.
4. **No Heavy Weight Saturation**: Menghindari penggunaan font weight 800/900 secara berlebihan yang membuat teks tampak menggumpal di layar lapangan; hierarki dibangun melalui kontras ukuran dan penataan spasial.

**Key Characteristics:**
- **High-Contrast Sunlight Calibration**: Rasio kontras teks utama terhadap canvas mencapai 15.8:1 (Slate 900 `#0F172A` di atas White `#FFFFFF`), melampaui standar WCAG AAA.
- **Precision 1.5px Architectural Wireframes**: Pembagian ruang antar-kartu dan tabel menggunakan border tegas 1.5px `#E2E8F0` yang stabil di layar tablet kasar maupun layar ponsel retak.
- **Large Field Touch Targets**: Seluruh trigger interaktif mempertahankan area sentuh minimal 40px hingga 48px untuk operator bersarung tangan medis atau tangan kotor/berdebu.
- **Strict Monospace Quarantine**: Font monospace diisolasi khusus untuk data kriptografis, koordinat, NIK, dan identitas logistik.

---

## Colors

Palet warna Sandya berkarakter disiplin operasional lapangan: dominan monokromatik slate teratur dengan aksen fungsional berdaya pandang tinggi yang hanya aktif saat terjadi peristiwa klinis, logistik, atau peringatan darurat.

### Primary
- **Midnight Slate** (`#0F172A`): Warna jangkar utama untuk tombol aksi utama, header navigasi, teks pokok, dan identitas otoritas posko. Memberikan kesan tenang, tegas, dan berwibawa.
- **Midnight Slate Hover** (`#1E293B`): State interaktif saat tombol ditekan atau di-hover.
- **Canvas White** (`#FFFFFF`): Teks kontras tinggi di atas elemen Midnight Slate.

### Secondary & Accent
- **Tactical Sky** (`#0284C7`): Aksen koordinasi taktis dan fokus interaktif. Digunakan secara selektif pada tautan aktif, tab terpilih, indikator saluran komunikasi radio, dan radio switch.

### Functional Status (Crisis & Health Cues)
- **Operational Emerald** (`#059669`): Indikator kondisi aman, sinkronisasi berhasil, stok mencukupi, dan triase luka ringan (Hijau P3). Dilengkapi dengan varian surface subtle (`#ECFDF5`) dan border (`#A7F3D0`).
- **Caution Amber** (`#D97706`): Indikator peringatan logistik, buffer persediaan tipis, dan triase mendesak/delayed (Kuning P2). Dilengkapi dengan varian surface subtle (`#FFFBEB`) dan border (`#FDE68A`).
- **Emergency Ruby** (`#DC2626`): Sinyal kritis SOS, bahaya evakuasi, stok habis, dan triase gawat darurat immediate (Merah P1). Dilengkapi dengan varian surface subtle (`#FEF2F2`) dan border (`#FECACA`).
- **Expectant Charcoal** (`#1E293B`): Kategori triase START Hitam (P0 - Korban meninggal dunia / tidak tertolong).

### Neutral & Canvas
- **Pure Canvas** (`#FFFFFF`): Latar belakang utama seluruh viewport dan panel modal.
- **Field Slate Subtle** (`#F8FAFC`): Background baris data tabel selang-seling, badge netral, dan kartu sekunder.
- **Field Slate Muted** (`#F1F5F9`): Background input fields dan kontrol tombol nonaktif.
- **Precision Border** (`#E2E8F0`): Border netral 1.5px untuk kartu, list, dan pembatas section.
- **Precision Border Hover** (`#CBD5E1`): Feedback visual saat hover pada elemen card interaktif.
- **Precision Border Strong** (`#94A3B8`): Indikator status fokus input atau border seleksi aktif.

### Named Rules
**The One-Voice Accent Rule.** Warna aksen Tactical Sky (`#0284C7`) digunakan pada ≤10% total luas layar visual. Kelangkaannya memastikan mata operator langsung tertuju pada titik tindakan utama tanpa terdistraksi.

**The Single-Writer Warning Rule.** Setiap komponen atau modal mutasi inventaris gudang posko yang tidak memiliki hak otorisasi mutasi fisik wajib menampilkan banner pembatas Caution Amber secara permanen.

---

## Typography

**Display & Body Font:** Plus Jakarta Sans (`var(--font-plus-jakarta-sans)`, sans-serif)  
**Monospace / Cryptographic Font:** Geist Mono (`var(--font-geist-mono)`, monospace)

**Character:** Modern geometric humanist sans-serif dengan legibilitas tinggi pada ukuran kecil dan kejernihan angka tabular. Menggunakan bobot proporsional (400, 500, 600, 700) tanpa font weight 800/900 yang berlebihan agar tetap tajam dan tidak menggumpal pada resolusi layar rendah.

### Hierarchy
- **Display** (Bold 700, 1.75rem / 28px, line-height 1.2, letter-spacing -0.025em): Digunakan khusus pada hero headline gerbang utama (`/`) dan judul ringkasan operasi wilayah.
- **Headline** (Bold 700, 1.25rem / 20px, line-height 1.25, letter-spacing -0.02em): Digunakan untuk judul modal besar, header modul (Refugees, Logistics, Triage, Tactical), dan nama posko aktif.
- **Title** (SemiBold 600, 1.00rem / 16px, line-height 1.3, letter-spacing -0.01em): Digunakan pada judul kartu widget, sub-header daftar penerima bantuan, dan nama pasien/warga.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5): Teks konten utama, deskripsi status, petunjuk operasional, dan riwayat rekam peristiwa pengungsi.
- **Label / Micro** (SemiBold 600, 0.75rem / 12px, line-height 1.2, letter-spacing 0.05em, uppercase): Label input form, tag status kartu tugas, header kolom tabel, dan meta-info baris data.
- **Monospace Quarantine** (Medium 500, 0.75rem / 12px, line-height 1.4, tabular-nums): Public key Ed25519, hash outbox, nomor sequence event, NIK KTP, kode tiket bantuan, dan koordinat GPS.

### Named Rules
**The Monospace Quarantine Rule.** Font Geist Mono dilarang keras digunakan untuk teks naratif, label tombol, atau instruksi umum. Font ini dikarantina eksklusif untuk deretan angka identitas, token kamus bencana, dan tanda tangan kriptografi.

---

## Layout

Tata letak Sandya dirancang modular dengan arsitektur responsif adaptif yang menyatukan kenyamanan monitor komando desktop dengan kecepatan operasional jempol pada ponsel lapangan.

### Spacing & Grid System
- **Spacing Scale:** Base 4px (`xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `2xl: 48px`).
- **Container Max-Width:**
  - Gerbang Otentikasi & Scanner: `max-w-md` (448px) atau `max-w-xl` (576px) terpusat secara vertikal.
  - Dashboard Posko & Taktis: `max-w-7xl` (1280px) dengan padding adaptif `px-4 sm:px-6 lg:px-8`.

### Responsive Adaptation Matrix
- **Desktop Viewport (≥1024px):**
  - Menggunakan sidebar navigasi tetap kiri (`w-64 shrink-0`) yang mencakup status posko aktif, profil peran, sinyal mesh BLE, dan tautan modul utama.
  - Halaman logistik menampilkan layout 2 kolom: katalog stok di kiri dan ledger transaksi kasir keluar-masuk di sticky sidebar kanan.
- **Mobile / Tablet Viewport (<1024px):**
  - Sidebar desktop disembunyikan; beralih ke navigasi bawah tetap (*fixed bottom bar*) berukuran 56px dengan 5 tab utama (Ringkasan, Warga, Logistik, Taktis, Sync).
  - Aksi vital lapangan (seperti pendataan kilat warga) diwadahi dalam tombol mengambang melayang (*Fast Intake Floating Action Button*) di sudut kanan bawah di atas bottom bar.
  - Aman terhadap notch dan bar sistem operasi dengan `pb-[calc(env(safe-area-inset-bottom)+4rem)]`.

---

## Elevation & Depth

Sandya menganut filosofi **Tonal Layering & Flat Structural Definition**, bukan bayangan tebal melayang (*floating drop shadows*). Dalam kondisi lapangan yang kotor atau silau matahari, bayangan buram (*ambient shadows*) mengurangi ketajaman kontur antarmuka.

### Depth Vocabulary
- **Level 0 (Base Canvas):** Background datar `#FFFFFF` untuk viewport aplikasi.
- **Level 1 (Structural Surface):** Kartu, tabel, dan form menggunakan background `#FFFFFF` atau `#F8FAFC` dengan border fisik 1.5px `#E2E8F0` dan `shadow-2xs` (`0 1px 2px rgba(0, 0, 0, 0.04)`).
- **Level 2 (Interactive Elements):** Tombol aksi dan kartu klik memiliki micro-shadow `shadow-xs` (`0 1px 3px rgba(0, 0, 0, 0.08)`). Saat ditekan (*active state*), elemen merespons dengan micro-scale taktil: `active:scale-[0.98]`.
- **Level 3 (Overlays & Dialogs):** Modal dialog dan popover lembar aksi menggunakan backdrop netral `bg-black/60` berkontras tinggi dengan elevasi bayangan terfokus `shadow-xl`.

---

## Shapes

Bentuk geometris Sandya merefleksikan peralatan darurat yang kokoh (*rugged, dependable hardware*) dengan sudut membulat yang nyaman disentuh jempol:

- **Border Radius Hierarchy:**
  - `rounded-md` (6px): Digunakan untuk badge status kecil, tombol compact `sm`, dan chip filter kategori.
  - `rounded-lg` (8px): Standar untuk seluruh input text, select dropdown, tombol ukuran reguler (`h-10`), dan item baris daftar.
  - `rounded-xl` (12px): Standar wadah kartu data (*Cards*), dialog modal, banner peringatan krisis, dan container status.
  - `rounded-2xl` (16px): Wadah hero scanner QR dan portal pintu masuk utama.
  - `rounded-full` (9999px): Indikator status radio online/offline, avatar identitas, dan pil filter status.
- **Border Stroke Standard:**
  - Border standar seluruh kartu dan kontrol interaktif adalah **1.5px solid** (`border-[1.5px] border-border`). Standar ini mencegah tampilan antarmuka terlihat rapuh saat dirender pada browser WebView mobile.

---

## Components

### Buttons
Komponen tombol adalah penggerak utama penyelamatan jiwa dan mutasi logistik. Didesain taktil, tegas, dan anti-salah sentuh.
- **Height & Touch Target:** Regular `h-10` (40px) dengan padding horizontal `px-4`, Hero/Mobile Primary `h-12` (48px) dengan `px-5`.
- **Primary:** Background Midnight Slate `#0F172A`, teks putih `#FFFFFF`, border `#0F172A`, hover `#1E293B`.
- **Secondary:** Background White `#FFFFFF`, teks Slate 900, border 1.5px `#E2E8F0`, hover `#F8FAFC`.
- **Danger (SOS / Checkout):** Background Emergency Ruby `#DC2626`, teks putih, hover `opacity-90`.
- **Taktil Feedback:** Transisi 150ms dengan `active:scale-[0.98]` dan focus ring ganda `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- **Icon Support:** Terintegrasi langsung dengan Solar Icons (`name`, `iconVariant`, `iconRight`).

### Cards & Containers
- **Corner Style:** `rounded-xl` (12px).
- **Border:** 1.5px presisi `#E2E8F0`.
- **Variants:**
  - `default`: `bg-surface border-border shadow-2xs`.
  - `subtle`: `bg-surface-subtle border-border shadow-none`.
  - `interactive`: `bg-surface border-border shadow-2xs hover:border-border-hover hover:shadow-xs cursor-pointer active:scale-[0.99]`.
- **Internal Padding:** Konsisten `p-4 sm:p-5` dengan header dan konten terpisah rapi.

### Inputs & Selects
- **Height:** Standar operasional `h-10` (40px) untuk seluruh field isian teks, angka, dan dropdown.
- **Typography:** Ukuran teks `text-xs sm:text-sm`, berat `font-semibold`, warna teks `#0F172A`, placeholder `#94A3B8`.
- **Icon Slots:** Slot ikon kiri 18px berjarak `left-3.5` untuk mempermudah identifikasi konteks (nama, NIK, lokasi, stok).
- **Number Field Behavior:** Spinner panah angka disembunyikan secara global melalui CSS untuk mencegah saltik sentuhan di layar sentuh.

### Badges & Status Indicators
- **Format:** `inline-flex items-center gap-1.5 font-medium border-[1.5px] select-none`.
- **Ukuran:** `sm` (`px-2 py-0.5 text-[11px] rounded-md`) dan `md` (`px-2.5 py-1 text-xs rounded-lg`).
- **START Triage Badges:**
  - `triage-red`: Background `#DC2626`, teks `#FFFFFF`, border `#DC2626`, font-bold, uppercase.
  - `triage-yellow`: Background `#D97706`, teks `#FFFFFF`, border `#D97706`, font-bold, uppercase.
  - `triage-green`: Background `#059669`, teks `#FFFFFF`, border `#059669`, font-bold, uppercase.
  - `triage-black`: Background `#1E293B`, teks `#FFFFFF`, border `#1E293B`, font-bold, uppercase.

### Alert Banners
- **Format:** Wadah `rounded-xl border flex items-start p-3.5 gap-3 shadow-2xs`.
- **Variants:**
  - `danger`: Border `#DC2626`, background `#FEF2F2`, teks `#DC2626`.
  - `warning`: Border `#FDE68A`, background `#FFFBEB`, teks `#D97706`.
  - `safe`: Border `#A7F3D0`, background `#ECFDF5`, teks `#059669`.
  - `info`: Border `#E2E8F0`, background `#F8FAFC`, teks `#0F172A`.

---

## Do's and Don'ts

### Do:
- **Do** gunakan token semantik Tailwind resmi (`bg-surface`, `border-border`, `text-text-main`, `bg-status-danger`) di setiap komponen UI baru.
- **Do** terapkan **The 48px Field Target Rule**: pastikan seluruh tombol sentuh utama lapangan memiliki tinggi minimal 40px hingga 48px.
- **Do** gunakan **Plus Jakarta Sans** untuk seluruh tipografi antarmuka dan batasi font weight pada rentang 400 (Regular), 500 (Medium), 600 (SemiBold), dan 700 (Bold).
- **Do** isolasi **Geist Mono** hanya untuk hash transaksi, kunci publik Ed25519, NIK, token heksadesimal kamus bencana, dan koordinat.
- **Do** gunakan icon stroke bergaris presisi dari pustaka **Solar Icons** (`name="box"`, `name="health"`, `name="shield"`).
- **Do** sediakan label status teks jelas di samping kode warna (misal: tulisan "P1 - Kritis" mendampingi warna merah) untuk mendukung relawan dengan defisiensi penglihatan warna (aksesibilitas WCAG).

### Don't:
- **Don't** menuliskan warna heksadesimal arbitrer secara langsung di dalam kode komponen (misal: `bg-[#0f172a]` atau `text-[#ef4444]`). Seluruh nilai warna wajib merujuk ke token `globals.css`.
- **Don't** menggunakan emoji kartun (seperti 🚨, 📦, 🏥, ⚠️) pada tombol aksi, label menu, atau status posko. Gunakan Solar Icons SVG.
- **Don't** menggunakan font generik seperti Inter atau membiarkan fallback font default browser tanpa deklarasi CSS yang tepat.
- **Don't** menggunakan font weight 800 (ExtraBold) atau 900 (Black) secara berlebihan pada teks panjang karena membuat teks tampak berat dan sulit dibaca di bawah cahaya silau matahari.
- **Don't** menerapkan efek bayangan buram berat (*blurry drop shadow*) atau transparansi kaca (*glassmorphism*) yang merusak kontras outdoor.
- **Don't** menempatkan elemen penting di area bawah layar ponsel tanpa memperhitungkan padding aman navigasi bawah (`bottom-nav safe-area`).
