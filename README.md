<div align="center">
  
  # SANDYA
  ### Platform Manajemen Tanggap Darurat Bencana Mandiri (Local-First & Offline-Mesh Ecosystem)
  
  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-sandya.id-success?style=for-the-badge)](https://sandya.id)
  [![GitHub](https://img.shields.io/badge/GitHub-untacorp%2Fsandya-181717?style=for-the-badge&logo=github)](https://github.com/untacorp/sandya)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE) <br/>
  [![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
  [![Tauri v2](https://img.shields.io/badge/Tauri-v2_Cross--Platform-24C8D8?style=for-the-badge&logo=tauri)](https://v2.tauri.app)
  [![SQLite](https://img.shields.io/badge/Database-SQLite_Local--First-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org)
  
  **Submission for ITECHNO CUP 2026 - Web Development**
  
  **By SkensaJaya**
  
</div>

---

## 📋 Daftar Isi

- [Tim Developer](#-tim-developer)
- [Tentang Proyek](#-tentang-proyek)
  - [Latar Belakang](#latar-belakang)
  - [Solusi yang Ditawarkan](#solusi-yang-ditawarkan)
  - [Tujuan Proyek](#tujuan-proyek)
- [Fitur Unggulan](#-fitur-unggulan)
  - [Fitur Utama](#fitur-utama)
  - [Fitur Tambahan](#fitur-tambahan)
- [Demo & Screenshot](#-demo--screenshot)
  - [Live Demo](#live-demo)
  - [Screenshot Aplikasi](#screenshot-aplikasi)
- [Teknologi](#-teknologi)
  - [Tech Stack](#tech-stack)
  - [Alasan Pemilihan Teknologi](#alasan-pemilihan-teknologi)
  - [Dependencies Utama](#dependencies-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
  - [System Architecture Diagram](#system-architecture)
  - [Database Schema (ERD)](#database-schema)
  - [Folder Structure](#folder-structure)
- [Instalasi & Setup](#-instalasi--setup)
  - [Prerequisites](#prerequisites)
  - [Langkah Instalasi](#langkah-instalasi)
  - [Opsi Deployment](#opsi-deployment)
- [Penggunaan](#-penggunaan)
  - [Menjalankan Aplikasi](#menjalankan-aplikasi)
  - [User Guide per Peran](#user-guide)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
  - [Menjalankan Test Suite](#running-tests)
  - [Hasil Pengujian Unit](#test-coverage)
- [Lisensi](#-lisensi)

---

## 👥 Tim Developer

| Foto Profil | Nama Lengkap | Peran & Kontribusi | GitHub |
| :---: | :--- | :--- | :--- |
| <a href="https://github.com/auttomus"><img src="https://github.com/auttomus.png" width="60" height="60" style="border-radius:50%;" alt="@auttomus"/></a> | **[@auttomus](https://github.com/auttomus)** | **Project Lead & Product Strategist**<br/>Memimpin perumusan visi kemanusiaan, tata kelola proyek, strategi produk tanggap darurat, dan koordinasi arsitektur umum. | [![GitHub](https://img.shields.io/badge/GitHub-auttomus-181717?style=flat-square&logo=github)](https://github.com/auttomus) |
| <a href="https://github.com/Oktazz"><img src="https://github.com/Oktazz.png" width="60" height="60" style="border-radius:50%;" alt="@Oktazz"/></a> | **[@Oktazz](https://github.com/Oktazz)** | **Full Stack & Systems Developer**<br/>Mengembangkan antarmuka responsif Next.js 16, pipeline state management Zustand, integrasi Single-Writer logistik, dan rekayasa end-to-end fitur. | [![GitHub](https://img.shields.io/badge/GitHub-Oktazz-181717?style=flat-square&logo=github)](https://github.com/Oktazz) |
| <a href="https://github.com/kasumadana"><img src="https://github.com/kasumadana.png" width="60" height="60" style="border-radius:50%;" alt="@kasumadana"/></a> | **[@kasumadana](https://github.com/kasumadana)** | **Core System Architect & Security Lead**<br/>Merancang protokol jaringan *offline-mesh* (SMP v1), algoritma pemulihan Poster Paritas XOR, skema kriptografi Ed25519, dan audit performa biner. | [![GitHub](https://img.shields.io/badge/GitHub-kasumadana-181717?style=flat-square&logo=github)](https://github.com/kasumadana) |

---

## 🎯 Tentang Proyek

### Latar Belakang

Indonesia terletak pada kawasan cincin api pasifik (*Pacific Ring of Fire*) dan pertemuan tiga lempeng tektonik aktif dunia. Berdasarkan data Badan Nasional Penanggulangan Bencana (BNPB), Indonesia mengalami lebih dari **3.000 bencana alam setiap tahunnya**, mulai dari gempa bumi dangkal, tsunami, banjir bandang, hingga erupsi gunung berapi.

Saat bencana katastropik berskala masif menghantam suatu wilayah, terjadi fenomena **Zero-Infrastructure Crisis**:
1. **Lumpuhnya Jaringan Telekomunikasi & Internet**: Menara BTS seluler roboh, transmisi kabel fiber optik terputus, dan pasokan listrik PLN padam total.
2. **Pendataan Pengungsi Konvensional Sangat Lambat**: Formulir kertas basah, sobek, mudah hilang, dan membutuhkan waktu rekapitulasi manual berhari-hari.
3. **Krisis Triase Medis & Kehilangan Riwayat Pasien**: Petugas medis di IGD tenda darurat kewalahan mendata tanda vital korban massal dan sering kali salah memberikan obat karena tidak adanya riwayat resep terstruktur.
4. ***Phantom Inventory* & Penimbunan Logistik**: Stok bantuan pangan dan obat-obatan tidak terkontrol. Alokasi ganda (*double-allocation*) kerap terjadi di satu posko, sementara posko tetangga mengalami kelaparan ekstrem.
5. **Keluarga Terpisah Tanpa Informasi**: Ribuan anak terpisah dari orang tuanya tanpa papan informasi yang terhubung antar-kamp pengungsian.
6. **Ketiadaan Komunikasi Taktis**: Petugas lapangan tidak memiliki saluran komunikasi suara mandiri tanpa pulsa atau sinyal seluler.

Aplikasi manajemen bencana konvensional yang beredar saat ini berasumsi bahwa koneksi internet stabil atau cloud server selalu tersedia—sebuah asumsi yang keliru dan fatal pada menit-menit pertama tanggap darurat di garis depan bencana.

### Solusi yang Ditawarkan

**Sandya** (*Sansekerta: Persatuan & Cahaya Senja Pengharapan*) hadir sebagai **Sistem Operasi Manajemen Tanggap Darurat Bencana Mandiri (Local-First & Zero-Infrastructure Offline-Mesh)**. Sandya dirancang dengan filosofi **"Continuity Over Connectivity"**—setiap alur operasional penyelamatan nyawa harus berfungsi 100% tanpa internet.

Pendekatan inovatif yang dihadirkan Sandya:
- 🛡️ **Penyimpanan Lokal Edge (Device-First SQLite)**: Setiap data warga, triase medis, mutasi logistik sembako, dan pesan taktis langsung tersimpan secara instan di SQLite lokal perangkat tanpa memerlukan server.
- 📡 **Multi-Transport Air-Gap Synchronization**:
  - **Tier 1 (Jalur Utama)**: *Zero-Touch* Bluetooth Low Energy (BLE) Mesh (*Sandya Mesh Protocol / SMP v1*) berbasis protokol gossip BitChat berkecepatan tinggi antar-perangkat posko.
  - **Tier 2 (Cadangan Udara & Fisik)**: *Animated Dynamic Multipart QR* (kamera streaming 6 FPS) dan *Poster Multi-QR Paritas XOR* berteknologi *Erasure Coding* yang tahan sobekan fisik kertas hingga 25–50%.
- ⚖️ **Single-Writer Ledger & Ketahanan Pangan Standar Internasional**: Mengunci hak mutasi fisik gudang posko ke satu perangkat otoritatif guna mencegah *phantom inventory*, dilengkapi kalkulasi ketahanan konsumsi dinamis mengadopsi standar kemanusiaan **SPHERE Project** dan **BNPB/PMI**.
- 🔐 **Kriptografi Asimetris Ed25519 & Role Pass QR**: Otoritas relawan dan komandan diverifikasi secara desentralisasi menggunakan tanda tangan kriptografis tanpa *login server*.
- 👨‍👩‍👧‍👦 **Offline Indonesian Family Reunion**: Mesin pencocokan kerabat hilang offline yang dilengkapi tokenisasi nama suku Indonesia dan jarak Levenshtein toleran salah eja.
- 🎙️ **Tactical Mesh Intercom (Push-to-Talk Radio)**: Komunikasi suara darurat 3.2 kbps berbasis kompresi audio Opus di 4 kanal operasional (`#all`, `#medis`, `#logistik`, `#sos`).

### Tujuan Proyek

- 🎯 **Tujuan Utama**: Menghadirkan ekosistem perangkat lunak tanggap darurat bencana yang beroperasi penuh tanpa ketergantungan pada internet publik, dan server terpusat.
- 📊 **Target Pengguna**: 7 Peran Operasional (Pemimpin Organisasi/BPBD/PMI, Komandan Misi, Koordinator Posko, Petugas Medis, Petugas Logistik, Relawan Lapangan, serta Warga Pengungsi/Tamu).
- 💡 **Value Proposition**:
  - *Zero Setup Zero Cloud*: Beroperasi seketika di hari pertama bencana.
  - *Sub-30s Mobile Intake*: Pendaftaran warga kurang dari 30 detik tanpa syarat NIK wajib.
  - *Zero Phantom Resources*: Tidak ada stok ganda berkat integritas *Single-Writer*.
  - *Humanitarian Standard Compliance*: Menjamin kebutuhan kalori 2.100 kkal dan air minum 3L/jiwa/hari terpenuhi secara terukur.

---

## ✨ Fitur Unggulan

### Fitur Utama

| Fitur | Deskripsi | Keunggulan Inovatif |
| :--- | :--- | :--- |
| **Fast Mobile Intake & Event Sourcing** | Pendaftaran pengungsi instan di garis depan dengan pencatatan *immutable append-only* riwayat hidup warga (INTAKE, HEALTH_CHECK, NEED_REPORTED, AID_RECEIVED). | Pendaftaran rampung dalam <30 detik. Mendukung *dynamic null-bypass* untuk warga yang kehilangan KTP saat bencana, dengan monotonic sequence anti-konflik. |
| **Triase Medis START 4-Warna & E-Resep** | Protokol klasifikasi darurat Simple Triage and Rapid Treatment (Merah/Gawat Darurat, Kuning/Mendesak, Hijau/Ringan, Hitam/Meninggal) terintegrasi catatan tanda vital dan farmasi. | Penerbitan tiket resep obat otomatis yang langsung terhubung ke Kamus Bencana uint8 dan sistem inventaris logistik medis posko. |
| **Single-Writer Ledger & Ketahanan SPHERE** | Pengelolaan stok gudang posko dengan hak penulisan tunggal (*Single-Writer invariant*) dan proyeksi sisa hari konsumsi pangan/air dinamis berbasis populasi pengungsi. | Mencegah *double-allocation* secara absolut. Menghitung laju konsumsi harian beras, air galon, popok balita, dan sanitasi wanita berdasarkan standar internasional SPHERE Project & BNPB. |
| **Offline Family Reunion Matcher** | Mesin pencarian kerabat hilang yang beroperasi secara offline antar-posko tanpa membutuhkan sinkronisasi internet ke server pusat. | Mengadopsi tokenisasi nama Indonesia, penanganan nama panggilan (*nicknames*), dan pencocokan fonetik/Levenshtein toleran salah eja nama warga. |
| **Tactical Mesh Intercom & PTT Radio** | Komunikasi walkie-talkie Push-to-Talk (PTT) suara berkecepatan 3.2 kbps via BLE Mesh terbagi ke 4 kanal taktis (`#all`, `#medis`, `#logistik`, `#sos`). | Dilengkapi sirene SOS darurat *slide-to-confirm* dengan atribusi identitas kriptografis dan indikator kedekatan hop (*proximity radar*). |
| **Multi-Transport Sync (BLE & QR Paritas)** | Sinkronisasi data antar-posko melalui gelombang radio Bluetooth Low Energy atau media visual kamera streaming dan cetak kertas. | Mampu memulihkan paket data manifes bencana 100% utuh meskipun 1 lembar kotak QR pada poster sobek atau terkena lumpur (*XOR Erasure Recovery*). |

### Fitur Tambahan

- **Ad-Hoc Distribution & Anti-Hoarding**: Serah terima sembako langsung di meja logistik untuk warga terdaftar, dilengkapi pengaman anti-penimbunan otomatis (blokir klaim ganda < 72 jam).
- **Inter-Posko Transit Waybill**: Surat jalan digital pengiriman armada truk bantuan antar-gudang posko dengan validasi tanda tangan penerima.
- **Cryptographic Role Pass (Ed25519)**: Kartu tanda pengenal relawan berbasis QR Code berstempel digital asimetris yang dapat diverifikasi secara offline oleh posko manapun.
- **Upstream Transactional Outbox**: Antrean pengunggahan data otomatis ke cloud (Supabase atau PostgreSQL mandiri) secara idempoten saat internet kembali menyala.
- **Kios Publik Survivor (Guest Portal)**: Mode pencarian mandiri ramah privasi untuk warga yang mencari anggota keluarganya di papan pengumuman digital posko.

---

## 📸 Demo & Screenshot

### Live Demo

🔗 **[Kunjungi Aplikasi Web Sandya](https://sandya.id)**  
*(Mode demo web menyediakan simulasi in-memory SQLite dan antarmuka operasional 7 peran).*

### Screenshot Aplikasi

<div align="center">

  <img src="https://raw.githubusercontent.com/untacorp/sandya/main/docs/design/screenshots/mockup-situational-dashboard.png" alt="Situational Awareness Dashboard" width="850"/>
  <p><em>1. Situational Awareness & Posko Dashboard - Pemantauan triase, hunian pengungsi, dan ketersediaan logistik secara real-time.</em></p>

  <img src="https://raw.githubusercontent.com/untacorp/sandya/main/docs/design/screenshots/mockup-refugees-intake.png" alt="Fast Mobile Intake" width="850"/>
  <p><em>2. Fast Mobile Intake - Pendaftaran warga pengungsi sub-30 detik dengan pemilahan demografi kelompok rentan.</em></p>

  <img src="https://raw.githubusercontent.com/untacorp/sandya/main/docs/design/screenshots/mockup-medical-triage.png" alt="START Medical Triage" width="850"/>
  <p><em>3. Triase Medis START 4-Warna - Klasifikasi pasien IGD darurat, pencatatan tanda vital, dan e-resep farmasi bencana.</em></p>

  <img src="https://raw.githubusercontent.com/untacorp/sandya/main/docs/design/screenshots/mockup-logistics-resilience.png" alt="Logistics Warehouse & Resilience" width="850"/>
  <p><em>4. Gudang Logistik & Ketahanan SPHERE - Pelacakan stok fisik Single-Writer dan proyeksi sisa hari konsumsi per komoditas.</em></p>

  <img src="https://raw.githubusercontent.com/untacorp/sandya/main/docs/design/screenshots/mockup-family-reunion.png" alt="Offline Family Reunion" width="850"/>
  <p><em>5. Offline Family Reunion - Rekonsiliasi graf kerabat hilang dengan algoritma fonetik toleran salah ketik.</em></p>

  <img src="https://raw.githubusercontent.com/untacorp/sandya/main/docs/design/screenshots/mockup-tactical-intercom.png" alt="Tactical Intercom PTT" width="850"/>
  <p><em>6. Tactical Mesh Intercom - Push-to-Talk (PTT) suara darurat 4 kanal dan tombol sirene darurat SOS.</em></p>

</div>

---

## 🛠️ Teknologi

### Tech Stack

#### Frontend & Antarmuka
```text
Framework    : Next.js 16.3.3 (App Router, React 19 Server/Client Components, Turbopack)
Styling      : Tailwind CSS v4 & Tailwind Merge
Icons        : Solar Icons (@iconify-json/solar) - Crisp 1.5px Stroke Design
Data Viz     : Recharts v3 (Visualisasi Komposisi Stok & Peringatan Kritis)
State Mgmt   : Zustand v5 (Persist Middleware Offline-First)
Validation   : Zod v4 (Skema Kontrak Domain & Payload Biner)
```

#### Native Desktop, Mobile, & Runtime
```text
Native Layer : Tauri v2.11.1 (Rust Toolchain >= 1.78)
Target OS    : Linux (.deb, .AppImage), Windows (.msi), Android (.apk)
Plugins      : @tauri-apps/plugin-barcode-scanner, @tauri-apps/plugin-notification
Native Audio : Pipeline PTT Opus 3.2 kbps Audio Frame Splitter
Native Mesh  : Rust BLE Peripheral & Central Stack (Sandya Mesh Protocol v1)
```

#### Database & Penyimpanan
```text
Edge Database: SQLite 3 (rusqlite pada desktop/Android, in-memory engine pada web test)
Cloud DB     : PostgreSQL 16+ (Supabase Managed atau Self-Hosted VPS)
API Gateway  : PostgREST 12+ (Penyedia RESTful otomatis dari skema relasional)
Pattern      : Transactional Outbox Pattern (Penyimpanan idempoten sebelum sinkronisasi)
```

#### Kriptografi & Kompresi Jaringan
```text
Signatures   : Ed25519 Asymmetric Cryptographic Signatures
Handshake    : Noise Protocol Framework (XX Pattern)
Binary Codec : Ultra-Dense v4 Bit-Packing (Kamus Bencana uint8)
Erasure Code : Multi-QR XOR Parity Matrix (Dynamic N+1 Recovery System)
```

### Alasan Pemilihan Teknologi

| Teknologi | Alasan Pemilihan & Keunggulan bagi Operasi Bencana |
| :--- | :--- |
| **Next.js 16 (React 19)** | Menghadirkan *Server & Client Component boundaries* yang jelas, performa kompilasi instan dengan Turbopack, serta kemampuan perenderan antarmuka tangguh lintas perangkat tanpa ketergantungan server runtime eksternal. |
| **Tauri v2 (Rust Backend)** | Berbeda dengan Electron yang memboroskan RAM ratusan megabyte, Tauri v2 berbasis Rust hanya berukuran <15 MB, menggunakan WebKit/Blink bawaan OS, serta memberikan akses native langsung ke chip Bluetooth Low Energy (BLE) dan SQLite lokal tanpa overhead. |
| **SQLite (Device-First)** | Mesin basis data *in-process* paling teruji di dunia. Transaksi ACID menjamin integritas rekam medis dan saldo logistik tidak akan korup meskipun daya baterai ponsel habis tiba-tiba saat gempa susulan. |
| **Tailwind CSS v4** | Menghasilkan bundel CSS ultra-ringan dengan variabel CSS token semantik yang memastikan kontras tinggi (WCAG AAA) agar antarmuka terbaca jelas di bawah terik matahari tenda pengungsian. |
| **Zustand v5** | State manager berbobot <2 KB yang fleksibel, mendukung sinkronisasi reaktif real-time ke penyimpanan lokal browser tanpa boilerplate berlebih, sangat ideal untuk sistem *offline-first*. |

### Dependencies Utama

Dikutip langsung dari konfigurasi produksi [`package.json`](file:///home/okuta/Documents/sandya/package.json):

```json
{
  "dependencies": {
    "next": "16.3.3",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "@tauri-apps/api": "^2.11.1",
    "@tauri-apps/plugin-barcode-scanner": "~2.4.6",
    "@tauri-apps/plugin-notification": "~2.4.0",
    "zustand": "^5.0.15",
    "zod": "^4.5.4",
    "recharts": "^3.10.1",
    "tailwind-merge": "^3.6.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "@iconify-json/solar": "^1.2.10",
    "@iconify/react": "^6.0.2"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "@types/node": "^22.19.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "tailwindcss": "^4.2.1",
    "tsx": "^4.23.13"
  }
}
```

---

## 🏗️ Arsitektur Sistem

### System Architecture

Sandya mengadopsi arsitektur desentralisasi berbasis *Domain-Driven Design (DDD)* dan *Event Sourcing*:

```mermaid
flowchart TD
    subgraph Frontline["Frontline Emergency Zone (100% Offline)"]
        D1["Perangkat Relawan Lapangan<br/>(Fast Mobile Intake)"]
        D2["Perangkat Medis Posko<br/>(Triase START 4-Warna)"]
        D3["Perangkat Gudang Logistik<br/>(Single-Writer Ledger)"]
        
        D1 & D2 & D3 -->|Tersimpan Seketika| DB_LOCAL[("Basis Data Lokal SQLite<br/>(Transactional Outbox)")]
    end

    subgraph MeshSync["Multi-Transport Air-Gap Sync"]
        DB_LOCAL -->|Tier 1: Radio Nirkabel| BLE["BLE Mesh (SMP v1)<br/>BitChat Gossip & LRU Drop"]
        DB_LOCAL -->|Tier 2: Visual Kamera| QR_ANIM["Animated Multipart QR<br/>(Streaming 6 FPS)"]
        DB_LOCAL -->|Tier 2: Kertas Fisik| QR_POSTER["Poster Paritas XOR<br/>(Tahan Robek / Erasure Coding)"]
    end

    subgraph DataMule["Universal Data Mule Courier"]
        BLE & QR_ANIM & QR_POSTER --> MULE["Kurir Relawan / Ambulans Bergerak<br/>(Membawa Manifes Biner Terkompresi)"]
    end

    subgraph Upstream["Command Center (Saat Internet Tersedia)"]
        MULE -->|Tiba di Posko Induk| GATEWAY["API Sync Ingest Gateway<br/>(/api/v1/sync/ingest-packet)"]
        GATEWAY --> CLOUD_DB[("PostgreSQL 16 / Supabase<br/>(Idempotent Merkle Upsert)")]
        CLOUD_DB --> DASHBOARD["Pusat Komando Makro BPBD / PMI"]
    end
```

### Database Schema

Skema basis data relasional Sandya dirancang untuk mendukung integritas audit *append-only event sourcing* dan *transactional outbox*:

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ DISASTER_MISSIONS : commissions
    ORGANIZATIONS {
        string id PK
        string name
        string category
        string master_pubkey
        bigint created_at
    }

    DISASTER_MISSIONS ||--o{ POSTS : deploys
    DISASTER_MISSIONS {
        string id PK
        string org_id FK
        string name
        string disaster_type
        string status
        int target_days
    }

    POSTS ||--o{ REFUGEES : shelters
    POSTS ||--o{ INVENTORY_ITEMS : stores
    POSTS {
        string id PK
        string mission_id FK
        string name
        string post_type
        int capacity
        int current_refugees
    }

    REFUGEES ||--o{ REFUGEE_EVENTS : records
    REFUGEES {
        string id PK
        string post_id FK
        string full_name
        string national_id
        char gender
        int age
        string current_triage
        jsonb vulnerabilities
    }

    REFUGEE_EVENTS {
        string id PK
        string refugee_id FK
        string author_id
        string event_type
        jsonb event_payload
        int logical_seq
        bigint device_timestamp
    }

    INVENTORY_ITEMS ||--o{ INVENTORY_TRANSACTIONS : mutates
    INVENTORY_ITEMS {
        string id PK
        string post_id FK
        string item_name
        string category
        decimal current_quantity
        string unit
        decimal burn_rate_days
    }

    INVENTORY_TRANSACTIONS {
        string id PK
        string item_id FK
        string post_id FK
        string officer_id
        string tx_type
        decimal quantity_change
        int logical_seq
    }

    REFUGEES ||--o{ NEEDS_TICKETS : requests
    NEEDS_TICKETS {
        string id PK
        string refugee_id FK
        string post_id FK
        string item_name
        int quantity
        string status
    }

    POSTS ||--o{ TACTICAL_MESSAGES : broadcasts
    TACTICAL_MESSAGES {
        string id PK
        string post_id FK
        string channel
        string sender_name
        string content_type
        text text_content
        boolean is_urgent
    }
```

### Folder Structure

Struktur kode diorganisasikan menggunakan pola **Domain-Driven Design (DDD)** modular dan bersih:

```text
sandya/
├── src/
│   ├── app/                               # Next.js 16 App Router Pages & API Routes
│   │   ├── api/v1/                        # Endpoint REST & SSE Bencana
│   │   │   ├── analytics/                 # Triage heatmap, burn rate, & reunion matches
│   │   │   ├── logistics/                 # Mutasi stok Single-Writer
│   │   │   ├── refugees/                  # Fast intake & event timeline
│   │   │   ├── sync/                      # Ingest paket biner & vector probe
│   │   │   └── tactical/                  # Broadcast pesan & SSE streaming
│   │   ├── missions/                      # Manajemen misi makro & command center
│   │   ├── posko/[poskoId]/               # Antarmuka lapangan 5-Tab Posko
│   │   │   ├── logistics/                 # Gudang logistik, charts, & waybills
│   │   │   ├── refugees/                  # Direktori warga, triase medis, & temu keluarga
│   │   │   ├── sync/                      # Animated QR scanner & cetak poster paritas
│   │   │   └── tactical/                  # PTT Walkie-Talkie & radar proximity
│   │   └── guest/                         # Kios publik mandiri pencarian keluarga
│   ├── core/                              # Lapisan Domain Murni & Use Cases (Zero Dependency)
│   │   ├── domain/                        # Agregat, Entities, & Value Objects
│   │   │   ├── logistics/                 # InventoryAggregate & Consumption Resilience
│   │   │   ├── refugees/                  # RefugeeAggregate & Event Sourcing
│   │   │   └── tactical/                  # TacticalMessage & Channel invariants
│   │   ├── codecs/                        # Kamus Bencana uint8, Paritas XOR, & Role Pass
│   │   └── use-cases/                     # Logika bisnis use cases teruji
│   ├── features/                          # Fitur UI Spesifik Domain & State Management
│   │   ├── auth/                          # Scanner & verifikasi Role Pass Ed25519
│   │   ├── logistics/                     # Modal Ad-hoc distribution & inventaris
│   │   ├── posko/store/                   # Zustand posko store & offline persistence
│   │   ├── refugees/                      # Formulir intake cepat & START triage board
│   │   └── tactical/                      # PTT voice recorder & kanal radio
│   ├── infrastructure/                    # Implementasi Database, Driver, & Repositories
│   │   ├── db/sqlite/                     # SQLite driver & repositories
│   │   ├── db/supabase-postgres-schema.sql# DDL relasional Cloud PostgreSQL
│   │   ├── network/ble/                   # Sandya Mesh Protocol (SMP v1) engine
│   │   └── services/                      # DisasterAnalyticsService & ServiceContainer
│   └── shared/                            # Komponen UI Reusable & Utilitas Primitif
│       ├── types/                         # Kontrak tipe TypeScript domain bersama
│       └── ui/                            # Button, Card, Badge, Dialog, Solar Icon, dll.
├── src-tauri/                             # Rust Native Backend (Tauri v2)
│   ├── src/main.rs                        # Inisialisasi plugin native & command handlers
│   └── tauri.conf.json                    # Konfigurasi perizinan native BLE, audio, & file
├── tests/                                 # Rangkaian 17 Suite Pengujian Otomatis
│   ├── unit/                              # Pengujian unit domain, codecs, & algoritma
│   └── integration/                       # Pengujian integrasi API & sinkronisasi SQLite
└── docs/                                  # Spesifikasi Teknis & Panduan Desain Lengkap
```

---

## ⚙️ Instalasi & Setup

### Prerequisites

Pastikan perangkat pengembang Anda telah terpasang:
- **Node.js**: `v20.x` atau lebih tinggi
- **Package Manager**: `pnpm` (disarankan, v9+) atau `npm` (v10+)
- **Rust Toolchain**: `rustc` dan `cargo` >= 1.78 (diperlukan jika mengompilasi Tauri v2)
- **Dependensi Sistem Linux (Ubuntu / Debian)**:
  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

### Langkah Instalasi

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/untacorp/sandya.git
cd sandya
```

#### 2️⃣ Pasang Dependensi
```bash
pnpm install
```

#### 3️⃣ Konfigurasi Environment Variables
Buat berkas `.env.local` pada direktori root proyek:
```env
# Mode Driver Sinkronisasi Cloud: 'NONE' | 'SUPABASE' | 'POSTGRES_VPS'
NEXT_PUBLIC_CLOUD_DRIVER=NONE

# Konfigurasi Supabase (Opsional - Jika menggunakan Opsi 2)
NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=kunci-anon-supabase-anda
SUPABASE_SERVICE_ROLE_KEY=kunci-service-role-anda

# Konfigurasi Mandiri PostgreSQL VPS (Opsional - Jika menggunakan Opsi 3 atau 4)
DATABASE_URL=postgresql://sandya_admin:sandya_secret_password@localhost:5432/sandya_db
NEXT_PUBLIC_VPS_SYNC_ENDPOINT=http://localhost:3001
VPS_SYNC_API_KEY=kunci-rahasia-api-vps-anda
```

---

### Opsi Deployment

Sandya mendukung 4 opsi skenario deployment sesuai kebutuhan lapangan:

#### 🟢 Opsi 1: Mode Offline Murni / Local SQLite (Bawaan Tanpa Setup)
Mode ini adalah konfigurasi standar garis depan bencana. Aplikasi berjalan 100% di perangkat lokal tanpa memerlukan internet, instalasi database eksternal, ataupun registrasi cloud.
```bash
# Jalankan langsung di browser
pnpm dev

# Atau jalankan sebagai aplikasi desktop native Tauri v2
pnpm tauri dev
```

#### 🔵 Opsi 2: Mode Supabase Cloud (Managed Online)
Digunakan saat posko induk memiliki sambungan internet satelit (Starlink) atau seluler untuk mengonsolidasikan data secara otomatis:
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor**, salin dan jalankan file `src/infrastructure/db/supabase-postgres-schema.sql`.
3. Set `NEXT_PUBLIC_CLOUD_DRIVER=SUPABASE` pada `.env.local`.
4. Jalankan `pnpm dev` atau `pnpm tauri dev`.

#### 🟡 Opsi 3: Mode Local Docker PostgreSQL (Uji Coba Pengembang)
Digunakan untuk menguji alur sinkronisasi PostgreSQL + PostgREST secara lokal via container:
```bash
# Nyalakan container PostgreSQL 16 & PostgREST
npm run db:up

# Jalankan aplikasi web
pnpm dev

# Mematikan container setelah selesai
npm run db:down
```

#### 🟣 Opsi 4: Mode Self-Hosted VPS (BYOC untuk Pemerintah / Instansi)
Digunakan untuk instansi (BPBD, PMI, Basarnas) yang ingin meng-host server data bencana mandiri di data center lokal:
```bash
# Migrasi skema database ke server VPS target
DATABASE_URL="postgresql://user:password@ip-vps:5432/sandya_db" npm run db:migrate
```

---

## 🚀 Penggunaan

### Menjalankan Aplikasi

```bash
# 1. Mode Web Development (Port 3000)
pnpm dev

# 2. Kompilasi Produksi & Menjalankan Server Web
pnpm build
pnpm start

# 3. Mode Desktop Native (Tauri v2)
pnpm tauri dev

# 4. Build Paket Installer Desktop (.deb, .AppImage, .msi)
pnpm tauri build

# 5. Menjalankan Seluruh Pengujian Unit
pnpm test:unit
```

### User Guide

#### Untuk Petugas Garis Depan (Frontliners)
1. **Pendaftaran Warga Cepat (<30 Detik)**:
   - Masuk ke tab **Warga & Triase** -> Klik tombol **+ Intake Cepat**.
   - Masukkan Nama, Usia, Jenis Kelamin, dan Lokasi Tenda (NIK bersifat opsional).
   - Sistem secara otomatis mencatat *event* `INTAKE`, menetapkan tanda pengenal, dan mengalkulasi kebutuhan logistik.
2. **Pemeriksaan Pasien Tenda Medis (START Triage)**:
   - Pilih pengungsi dari daftar -> Klik **Periksa Triase**.
   - Tetapkan warna triase (Merah, Kuning, Hijau, Hitam), isi tanda vital pasien (tensi, nadi, SpO2, suhu), dan resepkan obat.
   - Tiket resep farmasi otomatis diterbitkan ke gudang logistik.
3. **Serah Terima Logistik di Gudang (Single-Writer)**:
   - Buka tab **Logistik Gudang** -> Klik **Catat Barang Masuk (Restock)** untuk bantuan truk yang baru tiba.
   - Untuk serah terima warga: Buka detail warga -> Klik **Serahkan Bantuan Langsung** (Sistem memvalidasi batas anti-penimbunan 72 jam).
4. **Komunikasi Radio Taktis (Push-to-Talk)**:
   - Buka tab **Komunikasi Taktis** -> Pilih kanal operasional (`#all`, `#medis`, `#logistik`, `#sos`).
   - Tahan tombol mikrofon untuk mengirim rekaman suara darurat 3.2 kbps, atau geser tombol SOS saat terjadi situasi darurat.
5. **Pertukaran Data Antar-Posko Tanpa Internet**:
   - Buka tab **Sinkronisasi**.
   - Gunakan **Animated QR** untuk transfer cepat layar-ke-kamera (6 FPS).
   - Atau cetak **Poster Multi-QR Paritas** untuk ditempel di papan pengumuman posko, yang dapat dipindai oleh relawan bermobil (*Data Mule*).

#### Untuk Pimpinan & Koordinator Posko
1. **Inisialisasi Organisasi & Misi**:
   - Buka menu **Setup Organisasi** -> Masukkan nama lembaga dan generate pasangan kunci induk Ed25519.
   - Terbitkan misi bencana baru beserta titik-titik posko koordinasi lapangan.
2. **Penerbitan Role Pass Relawan**:
   - Terbitkan QR Role Pass untuk setiap petugas lapangan sesuai perannya (*Medis, Logistik, Relawan*).
   - Petugas memindai QR Role Pass untuk mengaktifkan sesi kerja tanpa memerlukan kata sandi.
3. **Pemantauan Ketahanan Konsumsi**:
   - Pantau indikator hari ketahanan pangan (*Burn Rate*) pada kartu inventaris dan grafik logistik. Bila komoditas berstatus *Kritis (<24 Jam)*, segera ajukan bantuan pasokan ke posko pusat.

---

## 📚 API Documentation

Sandya menyediakan antarmuka REST API dan Server-Sent Events (SSE) berkinerja tinggi yang mematuhi standar **RFC 7807 Problem Details** untuk penanganan galat terstandarisasi.

### Base URL
```text
Development : http://localhost:3000/api/v1
Production  : https://sandya.id/api/v1
```

### Endpoints

#### 1. Mutasi Stok Gudang (Single-Writer)
- **`POST /api/v1/logistics/mutate`**
  - *Deskripsi*: Melakukan mutasi stok fisik (RESTOCK, DISTRIBUTION, DAMAGE, TRANSFER).
  - *Headers*: `Content-Type: application/json`
  - *Request Body*:
    ```json
    {
      "poskoId": "POS-01",
      "itemId": "POS-01-ITEM-BERAS",
      "officerId": "USR-LOGISTIK-01",
      "officerRole": "PETUGAS_LOGISTIK",
      "txType": "DISTRIBUTION",
      "quantityChange": 5,
      "logicalSeq": 4,
      "referenceTicketId": "TKT-101",
      "notes": "Penyaluran sembako tenda 3"
    }
    ```
  - *Response (200 OK)*:
    ```json
    {
      "success": true,
      "item": {
        "id": "POS-01-ITEM-BERAS",
        "currentQuantity": 45,
        "version": 4
      }
    }
    ```

#### 2. Analisis & Ketahanan Bencana
- **`GET /api/v1/analytics?poskoId=POS-01`**
  - *Deskripsi*: Mengambil ringkasan heatmap triase pasien, proyeksi ketahanan stok (*burn-rate forecast*) standar SPHERE, dan rekonsiliasi temu keluarga.
  - *Response (200 OK)*: Menyajikan objek `triageHeatmap`, `burnRateForecast`, dan `reunionMatches`.

#### 3. Manajemen Pengungsi & Event Sourcing
- **`GET /api/v1/refugees?poskoId=POS-01`**: Mengambil daftar pengungsi terdaftar di posko.
- **`POST /api/v1/refugees`**: Mendaftarkan warga baru via Fast Intake.
- **`GET /api/v1/refugees/[refugeeId]/timeline`**: Mengambil kronologis riwayat hidup (*event timeline*) pengungsi.

#### 4. Sinkronisasi Data Mule & Vector Probe
- **`POST /api/v1/sync/ingest-packet`**: Menerima manifes biner terkompresi dari kurir pembawa data offline.
- **`GET /api/v1/sync/vector-probe?poskoId=POS-01`**: Memeriksa status interval vector clock untuk sinkronisasi delta.

#### 5. Komunikasi Taktis
- **`GET /api/v1/tactical/messages?channel=POSKO_ALL`**: Mengambil riwayat pesan taktis pada kanal tertentu.
- **`GET /api/v1/tactical/sse`**: Langganan stream pesan radio real-time via Server-Sent Events (SSE).

---

## 🧪 Testing

Sandya dibangun dengan metodologi **Test-Driven Rigor**. Seluruh algoritma biner, codec QR paritas, protokol BLE mesh, tata kelola logistik, dan rekam medis diverifikasi menggunakan 17 suite pengujian otomatis mandiri tanpa mock palsu (*zero dummy lifecycle*).

### Menjalankan Test Suite

```bash
# 1. Menjalankan seluruh 17 suite unit test
pnpm test:unit

# 2. Menjalankan pengujian integrasi API dan sinkronisasi SQLite-Cloud
pnpm test:integration

# 3. Menjalankan seluruh rangkaian tes (Unit + Integrasi)
pnpm test

# 4. Menjalankan simulasi performa QR Codec & Erasure Recovery
pnpm sim:final
```

### Hasil Pengujian Unit

Eksekusi perintah `pnpm test:unit` mencakup verifikasi menyeluruh terhadap 17 suite komponen:

| No | Suite Pengujian | Berkas Uji | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Siklus Hidup Data Bersih (Zero-Dummy)** | `tests/unit/zero-dummy-lifecycle.test.ts` | **PASS (100%)** |
| 2 | **Jembatan Transportasi Native BLE** | `tests/unit/ble-transport-bridge.test.ts` | **PASS (100%)** |
| 3 | **Mesin Jaringan BLE Mesh** | `tests/unit/ble-mesh-engine.test.ts` | **PASS (100%)** |
| 4 | **Relay Intercom Taktis Lapangan** | `tests/unit/tactical-intercom-relay.test.ts` | **PASS (100%)** |
| 5 | **Gossip Protokol & Vector Clock** | `tests/unit/vector-clock-gossip.test.ts` | **PASS (100%)** |
| 6 | **Integrasi Antarmuka Mesh UI** | `tests/unit/mesh-ui-integration.test.ts` | **PASS (100%)** |
| 7 | **Domain Core & Invarian Agregat** | `tests/unit/core-domain.test.ts` | **PASS (100%)** |
| 8 | **Autentikasi Kriptografis Role Pass** | `tests/unit/role-pass-auth.test.ts` | **PASS (100%)** |
| 9 | **Intake Pengungsi & Temu Keluarga** | `tests/unit/refugees-and-reunion.test.ts` | **PASS (100%)** |
| 10 | **Triase Medis START & Farmasi** | `tests/unit/triage-medis.test.ts` | **PASS (100%)** |
| 11 | **Gudang Logistik Single-Writer Ledger** | `tests/unit/logistics-single-writer.test.ts` | **PASS (100%)** |
| 12 | **Distribusi Ad-Hoc & Anti-Hoarding** | `tests/unit/adhoc-logistics-distribution.test.ts` | **PASS (100%)** |
| 13 | **Ketahanan Konsumsi SPHERE & BNPB** | `tests/unit/consumption-resilience.test.ts` | **PASS (100%)** |
| 14 | **Intercom Push-to-Talk & Sirene SOS** | `tests/unit/tactical-intercom.test.ts` | **PASS (100%)** |
| 15 | **Codec QR Teranimasi & Role Pass QR** | `tests/unit/qr-codecs.test.ts` | **PASS (100%)** |
| 16 | **Transport Dinamis & Paritas XOR** | `tests/unit/dynamic-sync-transports.test.ts` | **PASS (100%)** |
| 17 | **Framing Protokol Biner SMP v1** | `tests/unit/ble-mesh-protocol.test.ts` | **PASS (100%)** |

---

## 📄 Lisensi

Proyek **Sandya** dilisensikan di bawah lisensi ganda [MIT License](LICENSE) dan Apache-2.0. Dikembangkan untuk mendukung operasi tanggap darurat kemanusiaan, penanganan krisis bencana, dan perlindungan masyarakat di seluruh pelosok tanah air.

---

<div align="center">

  **Made with dedication & humanity by Skensa Jaya for ITECHNO CUP 2026**

</div>
