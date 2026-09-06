<div align="center">
  
  # SANDYA
  ### Platform Manajemen Tanggap Darurat Bencana (Local-First & Offline Mesh)
  
  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-sandya.skensa.web.id-success?style=for-the-badge)](https://sandya.skensa.web.id)
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
  - [System Architecture](#system-architecture)
  - [Database Schema](#database-schema)
  - [Folder Structure](#folder-structure)
- [Instalasi & Setup](#-instalasi--setup)
  - [Prerequisites](#prerequisites)
  - [Langkah Instalasi](#langkah-instalasi)
  - [Opsi Deployment](#opsi-deployment)
- [Penggunaan](#-penggunaan)
  - [Menjalankan Aplikasi](#menjalankan-aplikasi)
  - [User Guide](#user-guide)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
  - [Running Tests](#running-tests)
  - [Hasil Pengujian Unit](#hasil-pengujian-unit)
- [Lisensi](#-lisensi)

---

## 👥 Tim Developer

| Foto Profil | Nama Lengkap | Peran & Kontribusi | GitHub |
| :---: | :--- | :--- | :--- |
| <a href="https://github.com/auttomus"><img src="https://github.com/auttomus.png" width="60" height="60" style="border-radius:50%;" alt="@auttomus"/></a> | **[@auttomus](https://github.com/auttomus)** | **Project Lead & Product Strategist**<br/>Perencanaan produk, perumusan kebutuhan sistem tanggap darurat, dan koordinasi arsitektur umum. | [![GitHub](https://img.shields.io/badge/GitHub-auttomus-181717?style=flat-square&logo=github)](https://github.com/auttomus) |
| <a href="https://github.com/Oktazz"><img src="https://github.com/Oktazz.png" width="60" height="60" style="border-radius:50%;" alt="@Oktazz"/></a> | **[@Oktazz](https://github.com/Oktazz)** | **Full Stack & Systems Developer**<br/>Pengembangan antarmuka responsif Next.js 16, state management Zustand, modul logistik single-writer, dan implementasi fitur end-to-end. | [![GitHub](https://img.shields.io/badge/GitHub-Oktazz-181717?style=flat-square&logo=github)](https://github.com/Oktazz) |
| <a href="https://github.com/kasumadana"><img src="https://github.com/kasumadana.png" width="60" height="60" style="border-radius:50%;" alt="@kasumadana"/></a> | **[@kasumadana](https://github.com/kasumadana)** | **Core System Architect & Security Lead**<br/>Perancangan sinkronisasi jaringan offline via BLE mesh, pemulihan poster QR paritas XOR, skema autentikasi Ed25519, dan pengujian performa sistem. | [![GitHub](https://img.shields.io/badge/GitHub-kasumadana-181717?style=flat-square&logo=github)](https://github.com/kasumadana) |

---

## 🎯 Tentang Proyek

### Latar Belakang

Indonesia berada pada kawasan cincin api pasifik (*Pacific Ring of Fire*) dan zona pertemuan lempeng tektonik aktif dunia (Indo-Australia, Eurasia, dan Pasifik), dengan lebih dari 295 sesar aktif yang teridentifikasi (Pusat Studi Gempa Nasional/Pusgen). Data Informasi Bencana Indonesia (DIBI) Badan Nasional Penanggulangan Bencana (BNPB) mencatat Indonesia mengalami **lebih dari 3.000 hingga 5.000 kejadian bencana setiap tahunnya**, didominasi oleh bencana hidrometeorologi basah dan kering serta gempa bumi merusak.

Ketika gempa tektonik dangkal, tsunami, banjir bandang, atau letusan gunung berapi berskala besar melanda suatu kawasan, menit dan jam pertama masa tanggap darurat (*the golden hours*) kerap dihadapkan pada kelumpuhan infrastruktur total:

1. **Kelumpuhan Jaringan Telekomunikasi & Pasokan Energi**:
   - Pada **Gempa Cianjur (2022, M 5.6)**, pasokan listrik PLN terputus bagi ratusan ribu pelanggan dan lebih dari 110 Base Transceiver Station (BTS) seluler *off-air* di jam-jam pertama akibat kerusakan transmisi serat optik dan keterbatasan daya cadangan, mengisolasi komunikasi posko lapangan di wilayah episentrum seperti Cugenang dan Pacet.
   - Pada **Gempa & Tsunami Palu-Donggala (2018, M 7.4)**, lebih dari 500 site BTS operator seluler padam total dan jalur serat optik darat/bawah laut putus, melumpuhkan koordinasi evakuasi medis dan pemetaan logistik selama lebih dari 48 jam.
2. **Keterbatasan Pendataan Administratif Konvensional**:
   - Mayoritas warga terdampak mengungsi secara mendadak tanpa sempat menyelamatkan dokumen fisik kependudukan (KTP/KK). Sistem pendataan yang mensyaratkan NIK secara kaku menimbulkan hambatan birokrasi di meja pendaftaran awal. Di sisi lain, formulir kertas manual rentan rusak, basah oleh hujan, tercecer di tenda darurat, serta membutuhkan waktu rekapitulasi berhari-hari.
3. **Pencatatan Triase Korban Massal yang Tercecer**:
   - Di tenda IGD darurat dengan keterbatasan dokter, penanganan korban massal mengandalkan protokol Simple Triage and Rapid Treatment (START) sesuai pedoman penanggulangan krisis Kementerian Kesehatan RI dan WHO. Tanpa sistem pencatatan digital lokal, riwayat tanda vital pasien dan tiket resep farmasi darurat kerap tercecer, meningkatkan risiko kekeliruan pemberian dosis obat saat pergantian shift relawan medis.
4. **Ketimpangan Rantai Pasok Logistik Kemanusiaan**:
   - Piagam Kemanusiaan dan Standar Minimum Respon Bencana (**The Sphere Project Handbook**) serta **Peraturan Kepala BNPB No. 7 Tahun 2008** menetapkan standar asupan harian minimum 2.100 kkal dan 15 liter air bersih per jiwa/hari. Namun di lapangan, ketiadaan data stok terpusat memicu ketimpangan distribusi: posko di dekat jalan utama mengalami penumpukan bantuan pangan (*over-supply*), sementara kantong-kantong pengungsian terpencil di perbukitan mengalami krisis pangan dan obat-obatan (*under-supply*).
5. **Keluarga Terpisah Tanpa Papan Informasi Terkoneksi**:
   - Berdasarkan prinsip *Restoring Family Links* (RFL) kemanusiaan, penelusuran anggota keluarga yang terpisah di kamp pengungsian berbeda menjadi kebutuhan mendesak. Di lapangan, pencarian terhambat oleh keterbatasan koordinasi antar-posko, perbedaan dialek atau nama panggilan lokal, serta kekeliruan penulisan nama pada papan pengumuman manual.

Sebagian besar aplikasi manajemen bencana mengasumsikan koneksi internet stabil atau server cloud selalu tersedia. Namun ketika infrastruktur telekomunikasi terputus total di garis depan bencana, sistem-sistem berbasis cloud tidak dapat diakses dan kehilangan fungsinya pada momen yang paling krusial.

### Solusi yang Ditawarkan

**Sandya** hadir sebagai platform manajemen tanggap darurat bencana berbasis *local-first* dan *offline mesh*. Sandya dirancang agar seluruh alur operasional posko penyelamatan—mulai dari pendataan pengungsi, triase medis, pengelolaan logistik, hingga komunikasi taktis—dapat berjalan penuh tanpa koneksi internet.

Pendekatan utama yang diterapkan Sandya:
- **Penyimpanan Lokal (Device-First SQLite)**: Seluruh data warga, triase medis, mutasi logistik, dan pesan taktis tersimpan langsung di SQLite lokal perangkat tanpa memerlukan server eksternal.
- **Sinkronisasi Multi-Jalur (Multi-Transport Sync)**:
  - **Jalur Nirkabel**: Bluetooth Low Energy (BLE) Mesh berbasis protokol gossip untuk pertukaran data otomatis antar-perangkat posko terdekat.
  - **Jalur Visual & Fisik**: Animated QR Code (streaming visual kamera) dan poster cetak QR dengan kode paritas XOR (Erasure Coding) yang tetap dapat dibaca meskipun sebagian kertas robek atau kotor.
- **Pengelolaan Logistik Single-Writer & Acuan Standar Kemanusiaan**: Mengunci hak mutasi fisik gudang posko ke satu perangkat penanggung jawab guna mencegah pencatatan ganda, dilengkapi estimasi ketahanan konsumsi harian berbasis standar kemanusiaan **SPHERE Project** dan acuan BNPB/PMI.
- **Autentikasi Kriptografis Ed25519 & Role Pass QR**: Verifikasi wewenang relawan dan koordinator dilakukan secara offline menggunakan tanda tangan digital tanpa perlu login server terpusat.
- **Pencarian Keluarga Terpisah (Offline Family Reunion)**: Mesin pencarian kerabat hilang offline dengan normalisasi nama dan pencocokan fonetik/Levenshtein untuk mentoleransi kesalahan eja nama warga.
- **Komunikasi Suara Push-to-Talk (PTT)**: Komunikasi suara darurat 3.2 kbps berbasis kompresi Opus melalui jaringan mesh lokal pada 4 kanal operasional (`#all`, `#medis`, `#logistik`, `#sos`).

### Tujuan Proyek

- 🎯 **Tujuan Utama**: Menyediakan ekosistem perangkat lunak tanggap darurat bencana yang beroperasi penuh tanpa ketergantungan pada internet publik maupun server terpusat.
- 📊 **Target Pengguna**: 7 Peran Operasional (Pimpinan Organisasi, Komandan Misi, Koordinator Posko, Petugas Medis, Petugas Logistik, Relawan Lapangan, dan Pengungsi/Tamu).
- 💡 **Value Proposition**:
  - *Siap Pakai Tanpa Cloud*: Beroperasi seketika di lokasi bencana sejak hari pertama.
  - *Pendaftaran Cepat*: Pendataan warga selesai dalam waktu singkat tanpa mewajibkan kepemilikan NIK.
  - *Integritas Stok Logistik*: Menghindari duplikasi pencatatan stok bantuan berkat mekanisme single-writer.
  - *Kepatuhan Standar Kemanusiaan*: Membantu memantau kecukupan kebutuhan kalori dasar (2.100 kkal) dan air bersih (3 liter/jiwa/hari).

---

## ✨ Fitur Unggulan

### Fitur Utama

| Fitur | Deskripsi | Keunggulan |
| :--- | :--- | :--- |
| **Pendaftaran Pengungsi Cepat & Riwayat Terstruktur** | Pendaftaran warga di garis depan dengan pencatatan riwayat terstruktur (intake, pemeriksaan kesehatan, kebutuhan bantuan, dan penyaluran logistik). | Proses pendataan cepat, mendukung pendaftaran tanpa syarat NIK wajib bagi warga yang kehilangan dokumen, dengan urutan data yang konsisten. |
| **Triase Medis START & E-Resep** | Protokol klasifikasi darurat Simple Triage and Rapid Treatment (Merah, Kuning, Hijau, Hitam) terintegrasi catatan tanda vital dan farmasi. | Penerbitan tiket resep obat otomatis yang langsung terhubung ke inventaris logistik medis posko. |
| **Pengelolaan Logistik Single-Writer & Standar SPHERE** | Pengelolaan stok gudang posko dengan hak penulisan tunggal untuk mencegah duplikasi alokasi, dilengkapi proyeksi ketahanan konsumsi. | Menjaga konsistensi pencatatan stok dan menghitung estimasi sisa hari konsumsi pangan/air sesuai standar SPHERE dan BNPB. |
| **Pencarian Keluarga Terpisah (Offline)** | Pencarian anggota keluarga yang terpisah antar-posko tanpa membutuhkan koneksi internet ke server pusat. | Mendukung normalisasi nama, variasi panggilan, dan pencocokan fonetik/Levenshtein untuk mentoleransi perbedaan ejaan. |
| **Komunikasi Radio Push-to-Talk (PTT)** | Komunikasi walkie-talkie suara darurat via BLE mesh pada 4 kanal operasional (`#all`, `#medis`, `#logistik`, `#sos`). | Dilengkapi sirene darurat SOS dengan atribusi identitas pengirim dan indikator kedekatan hop. |
| **Sinkronisasi Multi-Transport (BLE & QR Paritas)** | Pertukaran data antar-posko melalui radio Bluetooth Low Energy atau media visual kode QR (streaming dan poster cetak). | Kode paritas XOR memungkinkan pemulihan paket data secara utuh meskipun sebagian kotak QR pada poster rusak atau terpotong. |

### Fitur Tambahan

- **Distribusi Bantuan Langsung & Pencegahan Penimbunan**: Penyaluran sembako langsung di meja logistik untuk warga terdaftar, dilengkapi pengaman otomatis (jeda klaim berulang) guna mencegah distribusi ganda.
- **Surat Jalan Antar-Posko (Transit Waybill)**: Surat jalan digital untuk pelacakan distribusi armada bantuan antar-gudang posko dengan validasi tanda tangan penerima.
- **Kartu Identitas Petugas (Role Pass Ed25519)**: Kartu tanda pengenal relawan berbasis kode QR dengan tanda tangan digital asimetris yang dapat diverifikasi secara offline oleh posko mana pun.
- **Sinkronisasi Bertahap ke Server (Transactional Outbox)**: Antrean pengunggahan data otomatis ke database cloud (Supabase atau PostgreSQL) secara idempoten saat koneksi internet kembali aktif.
- **Kios Mandiri Pengungsi (Guest Portal)**: Mode pencarian mandiri yang ramah privasi untuk warga yang mencari anggota keluarganya di papan pengumuman digital posko.

---

## 📸 Demo & Screenshot

### Live Demo

🔗 **[Kunjungi Website](https://sandya.skensa.web.id)**  
*(Mode demo web menyediakan simulasi in-memory SQLite dan antarmuka operasional 7 peran).*

### Screenshot Aplikasi

<div align="center">

  <img src="./docs/showcase/situational-dashboard.png" alt="Situational Awareness Dashboard" width="850"/>
  <p><em>1. Situational Awareness & Posko Dashboard - Pemantauan triase, hunian pengungsi, dan ketersediaan logistik secara real-time.</em></p>

  <img src="./docs/showcase/refugees-intake.png" alt="Fast Mobile Intake" width="850"/>
  <p><em>2. Pendaftaran Cepat Pengungsi - Pendaftaran warga pengungsi dengan pemilahan demografi kelompok rentan.</em></p>

  <img src="./docs/showcase/medical-triage.png" alt="START Medical Triage" width="850"/>
  <p><em>3. Triase Medis START - Klasifikasi pasien IGD darurat, pencatatan tanda vital, dan e-resep farmasi bencana.</em></p>

  <img src="./docs/showcase/logistics-resilience.png" alt="Logistics Warehouse & Resilience" width="850"/>
  <p><em>4. Gudang Logistik & Ketahanan SPHERE - Pelacakan stok fisik single-writer dan proyeksi sisa hari konsumsi per komoditas.</em></p>

  <img src="./docs/showcase/family-reunion.png" alt="Offline Family Reunion" width="850"/>
  <p><em>5. Pencarian Keluarga Terpisah - Rekonsiliasi kerabat hilang dengan algoritma toleran kesalahan eja.</em></p>

  <img src="./docs/showcase/tactical-intercom.png" alt="Tactical Intercom PTT" width="850"/>
  <p><em>6. Komunikasi Push-to-Talk - Push-to-Talk (PTT) suara darurat 4 kanal dan tombol sirene darurat SOS.</em></p>

</div>

---

## 🛠️ Teknologi

### Tech Stack

#### Frontend & Antarmuka
```text
Framework    : Next.js 16.3.3 (App Router, React 19 Server/Client Components, Turbopack)
Styling      : Tailwind CSS v4 & Tailwind Merge
Icons        : Solar Icons (@iconify-json/solar)
Data Viz     : Recharts v3 (Visualisasi Komposisi Stok & Indikator Peringatan)
State Mgmt   : Zustand v5 (Persist Middleware Offline-First)
Validation   : Zod v4 (Validasi Skema & Kontrak Data)
```

#### Native Desktop, Mobile, & Runtime
```text
Native Layer : Tauri v2.11.1 (Rust Toolchain >= 1.78)
Target OS    : Linux (.deb, .AppImage), Windows (.msi), Android (.apk)
Plugins      : @tauri-apps/plugin-barcode-scanner, @tauri-apps/plugin-notification
Native Audio : Pipeline PTT Audio Frame Splitter (Opus 3.2 kbps)
Native Mesh  : Rust BLE Peripheral & Central Stack
```

#### Database & Penyimpanan
```text
Edge Database: SQLite 3 (rusqlite pada desktop/Android, in-memory engine pada web test)
Cloud DB     : PostgreSQL 16+ (Supabase Managed atau Self-Hosted VPS)
API Gateway  : PostgREST 12+ (Penyedia RESTful otomatis dari skema relasional)
Pola Desain  : Transactional Outbox Pattern (Penyimpanan idempoten sebelum sinkronisasi)
```

#### Kriptografi & Kompresi Data
```text
Tanda Tangan : Ed25519 Asymmetric Signatures
Handshake    : Noise Protocol Framework (XX Pattern)
Binary Codec : Encoding Biner Ringkas (Kamus Bencana uint8)
Parity Codec : Multi-QR XOR Parity (Erasure Coding N+1)
```

### Alasan Pemilihan Teknologi

| Teknologi | Alasan Pemilihan & Manfaat Operasional |
| :--- | :--- |
| **Next.js 16 (React 19)** | Pemisahan komponen server dan klien yang jelas, performa kompilasi cepat dengan Turbopack, serta fleksibilitas render antarmuka tangguh lintas perangkat tanpa ketergantungan runtime eksternal. |
| **Tauri v2 (Rust Backend)** | Berukuran ringan (<15 MB) dan hemat memori dibandingkan alternatif berbasis Chromium, memanfaatkan webview bawaan sistem operasi serta menyediakan akses native langsung ke modul Bluetooth Low Energy (BLE) dan SQLite lokal. |
| **SQLite (Device-First)** | Basis data in-process yang tangguh dan teruji. Transaksi ACID menjamin integritas rekam medis dan data logistik tetap aman meskipun perangkat mati tiba-tiba akibat kehabisan baterai. |
| **Tailwind CSS v4** | Menghasilkan ukuran berkas CSS yang efisien dengan variabel semantik yang menjaga kontras visual tinggi agar antarmuka tetap mudah terbaca di lingkungan lapangan. |
| **Zustand v5** | Manajemen state berukuran ringkas (<2 KB) yang mendukung persistensi ke penyimpanan lokal secara efisien, cocok untuk arsitektur aplikasi offline-first. |

### Dependencies Utama

Dikutip langsung dari konfigurasi [`package.json`](package.json):

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

Sandya mengadopsi arsitektur terdesentralisasi berbasis Domain-Driven Design (DDD) dan Event Sourcing:

```mermaid
flowchart TD
    subgraph Frontline["Zona Lapangan Posko (Offline)"]
        D1["Perangkat Relawan Lapangan<br/>(Pendaftaran Warga)"]
        D2["Perangkat Medis Posko<br/>(Triase START)"]
        D3["Perangkat Gudang Logistik<br/>(Pencatatan Stok Single-Writer)"]
        
        D1 & D2 & D3 -->|Tersimpan Langsung| DB_LOCAL[("Basis Data Lokal SQLite<br/>(Transactional Outbox)")]
    end

    subgraph MeshSync["Sinkronisasi Multi-Jalur (Air-Gap)"]
        DB_LOCAL -->|Jalur Nirkabel| BLE["BLE Mesh<br/>Protokol Gossip"]
        DB_LOCAL -->|Jalur Visual Kamera| QR_ANIM["Animated QR<br/>(Streaming Kamera)"]
        DB_LOCAL -->|Jalur Fisik Kertas| QR_POSTER["Poster QR Paritas XOR<br/>(Tahan Kerusakan Kertas)"]
    end

    subgraph DataMule["Mekanisme Data Mule (Kurir Fisik)"]
        BLE & QR_ANIM & QR_POSTER --> MULE["Relawan / Petugas Lapangan<br/>(Membawa Manifes Data)"]
    end

    subgraph Upstream["Pusat Komando (Saat Ada Internet)"]
        MULE -->|Tiba di Posko Induk| GATEWAY["API Ingest Gateway<br/>(/api/v1/sync/ingest-packet)"]
        GATEWAY --> CLOUD_DB[("PostgreSQL 16 / Supabase<br/>(Sinkronisasi Idempoten)")]
        CLOUD_DB --> DASHBOARD["Dashboard Pusat Komando"]
    end
```

### Database Schema

Skema basis data relasional Sandya dirancang untuk mendukung integritas audit riwayat data dan penyimpanan lokal sebelum sinkronisasi:

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

### Struktur Direktori

Struktur kode diorganisasikan menggunakan pola arsitektur modular yang rapi:

```text
sandya/
├── src/
│   ├── app/                               # Next.js 16 App Router Pages & API Routes
│   │   ├── api/v1/                        # Endpoint REST & SSE Bencana
│   │   │   ├── analytics/                 # Ringkasan triase, ketahanan stok, & pencarian keluarga
│   │   │   ├── logistics/                 # Mutasi stok Single-Writer
│   │   │   ├── refugees/                  # Pendaftaran pengungsi & timeline data
│   │   │   ├── sync/                      # Ingest paket biner & vector probe
│   │   │   └── tactical/                  # Broadcast pesan & SSE streaming
│   │   ├── missions/                      # Manajemen misi makro & command center
│   │   ├── posko/[poskoId]/               # Antarmuka operasional 5-Tab Posko
│   │   │   ├── logistics/                 # Gudang logistik, visualisasi stok, & waybill
│   │   │   ├── refugees/                  # Direktori warga, triase medis, & temu keluarga
│   │   │   ├── sync/                      # Pemindai Animated QR & cetak poster paritas
│   │   │   └── tactical/                  # Komunikasi PTT & indikator radar kedekatan
│   │   └── guest/                         # Kios publik mandiri pencarian keluarga
│   ├── core/                              # Lapisan Domain Murni & Logika Bisnis
│   │   ├── domain/                        # Agregat, Entities, & Nilai Objek
│   │   │   ├── logistics/                 # Logika inventaris & estimasi konsumsi
│   │   │   ├── refugees/                  # Agregat pengungsi & catatan riwayat data
│   │   │   └── tactical/                  # Model pesan taktis & aturan kanal
│   │   ├── codecs/                        # Kamus bencana uint8, paritas XOR, & Role Pass
│   │   └── use-cases/                     # Logika alur kerja utama aplikasi
│   ├── features/                          # Fitur UI Domain & State Management
│   │   ├── auth/                          # Pemindaian & verifikasi Role Pass Ed25519
│   │   ├── logistics/                     # Antarmuka mutasi & distribusi bantuan
│   │   ├── posko/store/                   # Zustand store & persistensi data posko
│   │   ├── refugees/                      # Formulir pendaftaran cepat & papan triase START
│   │   └── tactical/                      # Perekam audio PTT & antarmuka radio
│   ├── infrastructure/                    # Implementasi Database, Driver, & Komunikasi
│   │   ├── db/sqlite/                     # Driver SQLite & implementasi repositori
│   │   ├── db/supabase-postgres-schema.sql# DDL skema relasional Cloud PostgreSQL
│   │   ├── network/ble/                   # Modul jaringan BLE Mesh & protokol sinkronisasi
│   │   └── services/                      # Layanan analisis bencana & kontainer service
│   └── shared/                            # Komponen UI Reusable & Utilitas
│       ├── types/                         # Definisi tipe TypeScript
│       └── ui/                            # Komponen tombol, kartu, badge, modal, ikon, dll.
├── src-tauri/                             # Runtime Desktop Native (Tauri v2)
│   ├── src/main.rs                        # Inisialisasi plugin native & command handler
│   └── tauri.conf.json                    # Konfigurasi native BLE, audio, & file system
├── tests/                                 # Rangkaian Pengujian Otomatis
│   ├── unit/                              # Pengujian unit domain, codec, & algoritma
│   └── integration/                       # Pengujian integrasi API & sinkronisasi database
└── docs/                                  # Dokumentasi Teknis & Panduan Desain
```

---

## ⚙️ Instalasi & Setup

### Prerequisites

Pastikan perangkat pengembang Anda telah terpasang:
- **Node.js**: `v20.x` atau lebih baru
- **Package Manager**: `pnpm` (disarankan, v9+) atau `npm` (v10+)
- **Rust Toolchain**: `rustc` dan `cargo` >= 1.78 (diperlukan jika mengompilasi aplikasi desktop Tauri v2)
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

#### 2️⃣ Install Dependencies
```bash
pnpm install
```

#### 3️⃣ Setup Environment Variables
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

Sandya mendukung beberapa skenario deployment sesuai kondisi infrastruktur lapangan:

#### 🟢 Opsi 1: Mode Offline Lokal / SQLite (Bawaan Tanpa Setup)
Mode standar untuk operasi di lokasi bencana. Aplikasi berjalan langsung di perangkat lokal tanpa memerlukan koneksi internet, instalasi database eksternal, atau akun cloud.
```bash
# Jalankan pada peramban web
pnpm dev

# Atau jalankan sebagai aplikasi desktop native Tauri v2
pnpm tauri dev
```

#### 🔵 Opsi 2: Mode Supabase Cloud (Managed Online)
Digunakan saat posko induk memiliki sambungan internet (misalnya melalui koneksi satelit atau seluler darurat) untuk mengonsolidasikan data secara terpusat:
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor**, salin dan jalankan file `src/infrastructure/db/supabase-postgres-schema.sql`.
3. Atur `NEXT_PUBLIC_CLOUD_DRIVER=SUPABASE` pada berkas `.env.local`.
4. Jalankan `pnpm dev` atau `pnpm tauri dev`.

#### 🟡 Opsi 3: Mode Local Docker PostgreSQL (Uji Coba Pengembang)
Digunakan untuk menguji alur sinkronisasi PostgreSQL secara lokal via container:
```bash
# Menyalakan container PostgreSQL 16 & PostgREST
npm run db:up

# Menjalankan aplikasi web
pnpm dev

# Mematikan container setelah selesai
npm run db:down
```

#### 🟣 Opsi 4: Mode Self-Hosted VPS (BYOC untuk Instansi)
Digunakan oleh instansi (BPBD, PMI, Basarnas) yang mengelola server basis data bencana mandiri di pusat data internal:
```bash
# Migrasi skema database ke server VPS tujuan
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

#### Untuk Petugas Lapangan (Frontliners)
1. **Pendaftaran Warga Cepat**:
   - Masuk ke tab **Warga & Triase** -> Klik tombol **+ Intake Cepat**.
   - Masukkan Nama, Usia, Jenis Kelamin, dan Lokasi Tenda (NIK bersifat opsional).
   - Sistem secara otomatis mencatat data pengungsi dan memperbarui rekapitulasi kebutuhan bantuan.
2. **Pemeriksaan Pasien Tenda Medis (START Triage)**:
   - Pilih pengungsi dari daftar -> Klik **Periksa Triase**.
   - Tetapkan kategori triase (Merah, Kuning, Hijau, Hitam), isi tanda vital pasien (tensi, nadi, SpO2, suhu), dan resepkan obat yang dibutuhkan.
   - Tiket resep farmasi otomatis diteruskan ke inventaris logistik.
3. **Serah Terima Logistik di Gudang (Single-Writer)**:
   - Buka tab **Logistik Gudang** -> Klik **Catat Barang Masuk (Restock)** untuk bantuan logistik yang baru tiba.
   - Untuk serah terima warga: Buka detail warga -> Klik **Serahkan Bantuan Langsung** (Sistem memvalidasi jeda pengambilan guna mencegah distribusi ganda).
4. **Komunikasi Radio Taktis (Push-to-Talk)**:
   - Buka tab **Komunikasi Taktis** -> Pilih kanal operasional (`#all`, `#medis`, `#logistik`, `#sos`).
   - Tahan tombol mikrofon untuk mengirim pesan suara darurat, atau gunakan tombol SOS saat menghadapi bahaya mendesak.
5. **Pertukaran Data Antar-Posko Tanpa Internet**:
   - Buka tab **Sinkronisasi**.
   - Gunakan **Animated QR** untuk transfer data langsung layar-ke-kamera.
   - Atau cetak **Poster Multi-QR Paritas** untuk dipasang di posko, yang dapat dipindai oleh petugas lapangan bermobil (*Data Mule*).

#### Untuk Pimpinan & Koordinator Posko
1. **Inisialisasi Organisasi & Misi**:
   - Buka menu **Setup Organisasi** -> Masukkan nama lembaga dan generate pasangan kunci induk Ed25519.
   - Buat misi bencana baru beserta posko-posko koordinasi lapangan.
2. **Penerbitan Kartu Identitas Petugas (Role Pass)**:
   - Terbitkan kode QR Role Pass untuk setiap petugas sesuai fungsinya (*Medis, Logistik, Relawan*).
   - Petugas memindai kode QR Role Pass untuk mengaktifkan sesi kerja di posko tanpa perlu kata sandi.
3. **Pemantauan Ketahanan Logistik**:
   - Pantau indikator hari ketahanan barang (*Burn Rate*) pada kartu inventaris dan grafik logistik. Bila komoditas berstatus kritis (<24 Jam), segera ajukan permohonan pasokan tambahan ke posko induk.

---

## 📚 API Documentation

Sandya menyediakan antarmuka REST API dan Server-Sent Events (SSE) yang mematuhi standar **RFC 7807 Problem Details** untuk penanganan galat terstandarisasi.

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
  - *Deskripsi*: Mengambil ringkasan distribusi triase pasien, proyeksi ketahanan stok standar SPHERE, dan hasil pencocokan kerabat keluarga.
  - *Response (200 OK)*: Menyajikan objek `triageHeatmap`, `burnRateForecast`, dan `reunionMatches`.

#### 3. Manajemen Pengungsi
- **`GET /api/v1/refugees?poskoId=POS-01`**: Mengambil daftar pengungsi terdaftar di posko.
- **`POST /api/v1/refugees`**: Mendaftarkan warga baru via formulir cepat.
- **`GET /api/v1/refugees/[refugeeId]/timeline`**: Mengambil kronologis riwayat catatan pengungsi.

#### 4. Sinkronisasi Data Mule & Vector Probe
- **`POST /api/v1/sync/ingest-packet`**: Menerima manifes paket data dari kurir pembawa data offline.
- **`GET /api/v1/sync/vector-probe?poskoId=POS-01`**: Memeriksa status interval vector clock untuk sinkronisasi delta.

#### 5. Komunikasi Taktis
- **`GET /api/v1/tactical/messages?channel=POSKO_ALL`**: Mengambil riwayat pesan taktis pada kanal tertentu.
- **`GET /api/v1/tactical/sse`**: Langganan stream pesan radio real-time via Server-Sent Events (SSE).

---

## 🧪 Testing

Sandya dilengkapi rangkaian 17 suite pengujian otomatis untuk memverifikasi fungsionalitas domain, codec data biner, protokol sinkronisasi BLE mesh, pengelolaan logistik, dan alur triase medis.

### Running Tests

```bash
# 1. Menjalankan seluruh 17 suite unit test
pnpm test:unit

# 2. Menjalankan pengujian integrasi API dan sinkronisasi database
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
| 1 | **Siklus Hidup Data Posko** | `tests/unit/zero-dummy-lifecycle.test.ts` | **PASS (100%)** |
| 2 | **Jembatan Transportasi Native BLE** | `tests/unit/ble-transport-bridge.test.ts` | **PASS (100%)** |
| 3 | **Mesin Jaringan BLE Mesh** | `tests/unit/ble-mesh-engine.test.ts` | **PASS (100%)** |
| 4 | **Relay Intercom Taktis Lapangan** | `tests/unit/tactical-intercom-relay.test.ts` | **PASS (100%)** |
| 5 | **Gossip Protokol & Vector Clock** | `tests/unit/vector-clock-gossip.test.ts` | **PASS (100%)** |
| 6 | **Integrasi Antarmuka Mesh UI** | `tests/unit/mesh-ui-integration.test.ts` | **PASS (100%)** |
| 7 | **Domain Core & Invarian Agregat** | `tests/unit/core-domain.test.ts` | **PASS (100%)** |
| 8 | **Autentikasi Kriptografis Role Pass** | `tests/unit/role-pass-auth.test.ts` | **PASS (100%)** |
| 9 | **Intake Pengungsi & Temu Keluarga** | `tests/unit/refugees-and-reunion.test.ts` | **PASS (100%)** |
| 10 | **Triase Medis START & Farmasi** | `tests/unit/triage-medis.test.ts` | **PASS (100%)** |
| 11 | **Gudang Logistik Single-Writer** | `tests/unit/logistics-single-writer.test.ts` | **PASS (100%)** |
| 12 | **Distribusi Ad-Hoc & Pencegahan Penimbunan** | `tests/unit/adhoc-logistics-distribution.test.ts` | **PASS (100%)** |
| 13 | **Ketahanan Konsumsi SPHERE & BNPB** | `tests/unit/consumption-resilience.test.ts` | **PASS (100%)** |
| 14 | **Intercom Push-to-Talk & Sirene SOS** | `tests/unit/tactical-intercom.test.ts` | **PASS (100%)** |
| 15 | **Codec QR Teranimasi & Role Pass QR** | `tests/unit/qr-codecs.test.ts` | **PASS (100%)** |
| 16 | **Transport Dinamis & Paritas XOR** | `tests/unit/dynamic-sync-transports.test.ts` | **PASS (100%)** |
| 17 | **Framing Protokol BLE Mesh** | `tests/unit/ble-mesh-protocol.test.ts` | **PASS (100%)** |

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

---

<div align="center">

  **Made with ❤️ by SkensaJaya for ITECHNO CUP 2026**

</div>
