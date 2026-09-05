# Dokumentasi Sistem Sandya (Offline-First Disaster Management)

> **Status Proyek**: Spesifikasi Arsitektur & Desain Resmi  
> **Platform Target**: Next.js 16 (React 19 App Router) + Tauri v2 (Desktop & Mobile)  
> **Karakteristik Utama**: *Offline-First*, *Zero-Touch BLE Mesh*, *Single-Writer Ledger*, *Animated QR & Poster Paritas*, *Ed25519 Cryptography*.

Dokumentasi ini memuat spesifikasi rekayasa, arsitektur data terdistribusi, protokol komunikasi jaringan lapangan, sistem desain antarmuka, dan alur pengguna (*user flow*) untuk **Sandya**—sistem penanganan bencana terdesentralisasi yang dirancang untuk beroperasi secara mandiri tanpa ketergantungan koneksi internet.

---

## Struktur Direktori Dokumentasi

```text
docs/
├── README.md                                    # Indeks utama dokumentasi (file ini)
├── analisis-arsitektur.md                       # Analisis kelayakan & mitigasi race condition
├── event-sourcing-dan-hierarki.md               # Arsitektur Event Sourcing & Universal Data Mule
├── spesifikasi-mesh-dan-intercom.md             # Protokol Bluetooth LE Mesh & Intercom Taktis (PTT)
├── spesifikasi-transfer-animated-dan-poster.md  # Protokol Animated QR Dinamis & Poster Paritas XOR
├── tata-kelola-organisasi-dan-kriptografi.md    # Hierarki 3-tingkat, 4-peran RBAC, & Kriptografi
├── tokenisasi-nama-dan-paritas-qr.md            # Tokenisasi nama Indonesia & evaluasi paritas
├── metode-transfer-dan-kamus-bencana.md         # Kamus bencana bawaan & serialisasi biner v4
├── arsitektur-ui-dan-dashboard.md               # Tata letak antarmuka mobile & desktop
│
├── design/                                      # Dokumen Teknis Desain & Arsitektur
│   ├── README.md                                # Indeks rancangan desain teknis
│   ├── architecture/
│   │   └── README.md                            # Spesifikasi arsitektur sistem terdistribusi
│   ├── database/
│   │   └── README.md                            # Skema database SQLite & arsitektur event store
│   └── ui-ux/
│       ├── README.md                            # Indeks desain visual antarmuka
│       ├── 01-arsitektur-frontend-sandya.md     # Blueprint komponen React 19 / Next.js 16
│       ├── 02-pedoman-solar-icons.md            # Pedoman standar ikonografi Solar Icons
│       └── 03-sistem-desain-dan-token-warna.md  # Token warna semantik & Tailwind CSS v4
│
├── userflow/                                    # Spesifikasi Alur Pengguna (User Flow)
│   ├── 00-arsitektur-dan-peta-userflow.md       # Peta induk user flow & taksonomi peran
│   ├── 01-onboarding-dan-manajemen-organisasi.md# Onboarding, aktivasi tim, & master key
│   ├── 02-pendataan-warga-dan-event-sourcing.md # Fast Intake 30 detik & timeline warga
│   ├── 03-triase-medis-dan-rekam-kesehatan.md   # Triase START & rekam medis darurat
│   ├── 04-logistik-dan-distribusi-single-writer.md # Buku kas logistik & alokasi bantuan
│   ├── 05-sinkronisasi-p2p-dan-poster-paritas.md # Sinkronisasi BLE Mesh & poster paritas
│   ├── 06-temu-keluarga-offline.md              # Rekonsiliasi pencarian keluarga terpisah
│   ├── 07-komunikasi-taktis-dan-mesh-intercom.md# Chat taktis 4 saluran & Push-to-Talk (PTT)
│   └── roles/                                   # Spesifikasi Alur per Peran Pengguna
│       ├── 01-pemimpin-organisasi.md            # Pemimpin Organisasi (Superadmin)
│       ├── 02-komandan-misi.md                  # Komandan Misi Bencana (Incident Lead)
│       ├── 03-koordinator-posko.md              # Koordinator Posko Lapangan (Posko Lead)
│       ├── 04-petugas-medis.md                  # Petugas Medis / Dokter (Medical Officer)
│       ├── 05-petugas-logistik.md               # Petugas Logistik (Warehouse Master)
│       ├── 06-relawan-lapangan.md               # Relawan Lapangan (Field Volunteer)
│       └── 07-warga-dan-tamu.md                 # Warga Pengungsi & Tamu Publik (Guest)
│
└── archive/                                     # Arsip Dokumen Historis & Riset Awal
    ├── README.md                                # Indeks dokumen terarsip / deprecated
    ├── idea.md                                  # Catatan konsep awal & problem statement
    └── evaluasi-jabcode-dan-perbandingan.md     # Evaluasi barcode warna (JabCode) yang dibatalkan
```

---

## Peta Modul & Panduan Navigasi

### 1. Fondasi Konseptual & Analisis Arsitektur
- **[Analisis Kritis & Blueprint Arsitektur](./analisis-arsitektur.md)**: Evaluasi kelayakan, eliminasi *race condition* logistik (*single-writer*), dan arsitektur transfer bertingkat.
- **[Tata Kelola Organisasi & Kriptografi](./tata-kelola-organisasi-dan-kriptografi.md)**: Model hierarki 3-tingkat (Organisasi -> Misi -> Posko), 4 peran RBAC, dan otorisasi Ed25519.
- **[Arsip Konsep Awal & Problem Statement](./archive/idea.md)**: Catatan ideasi awal masalah operasional bencana dan visi desentralisasi.

### 2. Protokol Jaringan, Sinkronisasi, & Komunikasi
- **[Spesifikasi Bluetooth LE Mesh & Intercom Taktis](./spesifikasi-mesh-dan-intercom.md)**: *Zero-Touch Background Gossip Sync*, protokol *Sandya Mesh Protocol (SMP v1)*, 4 saluran radio lapangan, dan audio PTT terkompresi Opus 3.2 kbps.
- **[Spesifikasi Transfer Animated QR & Poster Paritas](./spesifikasi-transfer-animated-dan-poster.md)**: Transfer asinkron *Animated Multipart QR* (6 FPS) dan cetak poster fisik dengan redundansi paritas XOR.
- **[Metode Transfer & Kamus Bencana](./metode-transfer-dan-kamus-bencana.md)**: Serialisasi biner *Ultra-Dense v4*, tokenisasi 256 katalog kebutuhan bawaan, dan eliminasi *field* kosong (*null-bypass*).
- **[Tokenisasi Nama Indonesia & Poster Multi-QR](./tokenisasi-nama-dan-paritas-qr.md)**: Tokenisasi nama deterministik berbasis kamus frekuensi tanpa AI dan ketahanan sobekan kertas poster.
- **[Arsip Evaluasi Eksperimen JabCode](./archive/evaluasi-jabcode-dan-perbandingan.md)**: Catatan arsip riset evaluasi *Color 2D Barcode* dan pertimbangan pembatalannya untuk situasi bencana.

### 3. Arsitektur Data & Model Persistensi
- **[Event Sourcing, Hierarki Organisasi, & Universal Data Mule](./event-sourcing-dan-hierarki.md)**: Model *append-only log*, pencegahan konflik stok fisik (*finite resource*), mitigasi *clock drift*, dan skema DDL SQLite lengkap.
- **[Katalog Rancangan Database](./design/database/README.md)**: Spesifikasi tabel, diagram relasi entitas, dan strategi indeks pencarian cepat.

### 4. Desain Antarmuka & Frontend
- **[Arsitektur Antarmuka & Navigasi Dashboard](./arsitektur-ui-dan-dashboard.md)**: Tata letak *Thumb-Friendly Mobile-First* (5-Tab) dan *Master-Detail Command Center* desktop.
- **[Blueprint Arsitektur Frontend](./design/ui-ux/01-arsitektur-frontend-sandya.md)**: Struktur rute Next.js 16 App Router, batasan RSC/Client Components, dan matriks 6-status UI.
- **[Pedoman Standar Solar Icons](./design/ui-ux/02-pedoman-solar-icons.md)**: Aturan penggunaan varian `linear` dan `bold` serta katalog pemetaan ikon resmi.
- **[Sistem Desain & Token Warna](./design/ui-ux/03-sistem-desain-dan-token-warna.md)**: Variabel CSS semantik, palet triase START, dan integrasi Tailwind CSS v4.

### 5. Alur Pengguna (User Flow)
- **[Peta Induk User Flow](./userflow/00-arsitektur-dan-peta-userflow.md)**: Diagram makro alur perjalanan sistem, taksonomi peran, dan isolasi akses publik.
- **[Indeks User Flow Fitur](./userflow/)**: Rincian alur operasional per modul (Onboarding, Intake, Triase, Logistik, Sync, Temu Keluarga, Komunikasi Taktis).
- **[Indeks User Flow Peran](./userflow/roles/)**: Panduan langkah demi langkah untuk setiap persona pengguna dari Pemimpin Organisasi hingga Warga Publik.

### 6. Arsip Dokumen Terarsip (Deprecated / Archive)
- **[Indeks Dokumen Arsip](./archive/README.md)**: Kumpulan dokumen eksplorasi dan riset terdahulu yang telah digantikan oleh spesifikasi resmi.

---

## Prinsip Standar Dokumentasi

1. **Akurasi & Integritas Data**: Seluruh spesifikasi mencerminkan mekanisme implementasi nyata pada kode sumber tanpa spekulasi fiktif.
2. **Keterbacaan Manusia**: Disajikan secara sistematis dengan diagram Mermaid, tabel perbandingan, dan format ASCII visual.
3. **Bebas Elemen Klise**: Format dokumentasi teknis bersih, tegas, dan konsisten tanpa penggunaan emoji pada teks formal.
4. **Navigasi Relatif Konsisten**: Seluruh tautan antardokumen menggunakan format relatif yang valid saat ditelusuri langsung di antarmuka GitHub repository.
