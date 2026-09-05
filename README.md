# Sandya

Platform Manajemen Tanggap Darurat Bencana Mandiri (*Local-First & Offline-Mesh Ecosystem*) untuk pendataan pengungsi, triase medis darurat, pengelolaan logistik gudang posko dengan prinsip *Single-Writer*, pelacakan keluarga terpisah (*Offline Family Reunion*), dan komunikasi taktis Push-to-Talk (PTT) dalam kondisi tanpa internet (*Zero-Infrastructure Disaster Recovery*).

---

## Arsitektur Sistem

Sandya dibangun di atas prinsip **Local-First Resilient Architecture**:

1. **Penyimpanan Lokal Edge (Device-First SQLite)**: Seluruh pencatatan data warga, resep medis, mutasi logistik sembako, dan pesan taktis selalu disimpan ke basis data lokal SQLite perangkat terlebih dahulu.
2. **Multi-Transport Offline Sync**: Sinkronisasi antar-posko tetap beroperasi tanpa koneksi internet menggunakan:
   - **Tier 1 (Jalur Utama)**: Zero-Touch Bluetooth Low Energy (BLE) Mesh (*Sandya Mesh Protocol / SMP v1* berbasis arsitektur BitChat).
   - **Tier 2 (Cadangan Udara & Fisik)**: Animated Dynamic Multipart QR (6 FPS) dan Poster Multi-QR Paritas XOR (*Erasure Coding* tahan sobekan fisik).
3. **Upstream Cloud Synchronization**: Ketika koneksi internet (Starlink, seluler, atau ISP posko induk) tersedia, antrean *Transactional Outbox* secara otomatis mengunggah data ke server Cloud (Supabase atau PostgreSQL VPS mandiri) secara idempoten dan bebas duplikasi.
4. **Otoritas Kriptografi Asimetris**: Seluruh mutasi dan kartu tugas ditandatangani menggunakan kunci kriptografi Ed25519 dan komunikasi rahasia diamankan dengan *Noise Protocol XX*.

---

## Kebutuhan Sistem & Prasyarat

- **Node.js**: >= 20.x
- **Package Manager**: pnpm >= 9.x (atau npm >= 10.x)
- **Rust Toolchain**: `rustc` & `cargo` >= 1.78.x (diperlukan untuk menjalankan dan mengompilasi Tauri v2)
- **Dependensi Sistem Native (Linux / Ubuntu / Debian)**:
  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```
- **Android SDK / NDK** (opsional, untuk build target Android): Android Studio & NDK r26+
- **Docker & Docker Compose** (opsional, untuk pengujian lokal container PostgreSQL 16)
- **PostgreSQL 16+ atau Akun Supabase** (opsional, untuk sinkronisasi upstream cloud)

---

## Panduan Menjalankan Aplikasi (Development Workflow)

### 1. Menjalankan Mode Native Desktop / Mobile App (Tauri v2)

Mode ini menjalankan aplikasi dengan akses penuh ke backend native Rust, SQLite lokal (`rusqlite`), native BLE mesh stack, audio pipeline Opus PTT, dan filesystem lokal.

```bash
# 1. Pasang dependensi proyek
pnpm install

# 2. Jalankan development server Tauri v2 (Desktop)
pnpm tauri dev

# Atau menggunakan runner npm / cargo:
npm run tauri dev
cargo tauri dev
```

#### Perintah Build & Target Platform Lainnya:
```bash
# Build paket installer desktop (.deb, .AppImage, .msi, .dmg)
pnpm tauri build

# Development untuk Android (Emulator atau HP fisik via USB debugging)
pnpm tauri android init
pnpm tauri android dev

# Build paket biner Android (.apk / .aab)
pnpm tauri android build
```

---

### 2. Menjalankan Mode Web Browser (Next.js 16 App Router)

Mode ini menjalankan aplikasi antarmuka web murni untuk pengujian UI/UX dan simulasi browser.

```bash
# Jalankan development server Next.js pada http://localhost:3000
pnpm dev

# Build dan jalankan versi produksi web
pnpm build
pnpm start
```

---

## Opsi Aktivasi dan Konfigurasi Database

Sandya mendukung 4 opsi mode deployment sesuai kebutuhan operasional lapangan:

### Opsi 1: Mode Offline Murni / Local-First SQLite (Bawaan)
Mode ini adalah konfigurasi standar. Aplikasi berjalan 100% di perangkat lokal tanpa memerlukan setup cloud server, database eksternal, ataupun koneksi internet.

Langkah aktivasi:
1. Pasang dependensi:
   ```bash
   pnpm install
   ```
2. Jalankan aplikasi:
   ```bash
   pnpm tauri dev   # atau pnpm dev
   ```
Semua mutasi otomatis tersimpan pada database lokal SQLite dan antrean Outbox siap disinkronisasikan antar-perangkat via BLE Mesh atau QR.

---

### Opsi 2: Mode Supabase Cloud (Managed)
Gunakan opsi ini jika ingin menghubungkan posko-posko ke platform Supabase Cloud terkelola saat konektivitas internet tersedia.

Langkah aktivasi:
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor** pada dashboard Supabase Anda.
3. Salin dan jalankan seluruh isi file skema DDL:
   `src/infrastructure/db/supabase-postgres-schema.sql`
4. Buat file `.env.local` pada direktori root proyek:
   ```env
   NEXT_PUBLIC_CLOUD_DRIVER=SUPABASE
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
5. Jalankan aplikasi:
   ```bash
   pnpm tauri dev   # atau pnpm dev
   ```

---

### Opsi 3: Mode Local Docker PostgreSQL (Pengujian Integrasi Lokal)
Gunakan opsi ini untuk menguji siklus sinkronisasi PostgreSQL + PostgREST secara lokal di mesin pengembang menggunakan Docker Compose.

Langkah aktivasi:
1. Nyalakan container PostgreSQL 16 dan PostgREST:
   ```bash
   npm run db:up
   ```
   Container akan otomatis menginisialisasi skema `supabase-postgres-schema.sql` pada port `5432` (PostgreSQL) dan port `3001` (PostgREST API).

2. Buat file `.env.local`:
   ```env
   NEXT_PUBLIC_CLOUD_DRIVER=POSTGRES_VPS
   NEXT_PUBLIC_VPS_SYNC_ENDPOINT=http://localhost:3001
   DATABASE_URL=postgresql://sandya_admin:sandya_secret_password@localhost:5432/sandya_db
   ```
3. Jalankan aplikasi:
   ```bash
   pnpm tauri dev   # atau pnpm dev
   ```
4. Untuk mematikan container:
   ```bash
   npm run db:down
   ```
   Atau untuk reset total data pengujian:
   ```bash
   npm run db:reset
   ```

---

### Opsi 4: Mode Production PostgreSQL pada VPS (Self-Hosted / BYOC)
Gunakan opsi ini untuk deployment mandiri pada server VPS (*Bring Your Own Cloud*) milik BPBD, PMI, atau instansi terkait.

Langkah aktivasi:
1. Siapkan PostgreSQL 16+ pada server VPS Anda.
2. Jalankan migrasi skema database ke VPS:
   ```bash
   DATABASE_URL="postgresql://user:password@vps-ip:5432/sandya_db" npm run db:migrate
   ```
   Atau jalankan langsung via CLI di server VPS:
   ```bash
   psql -U sandya_admin -d sandya_db -f src/infrastructure/db/supabase-postgres-schema.sql
   ```
3. Buat file `.env.local` pada aplikasi:
   ```env
   NEXT_PUBLIC_CLOUD_DRIVER=POSTGRES_VPS
   NEXT_PUBLIC_VPS_SYNC_ENDPOINT=https://api-sync.domain-vps-anda.com/api/v1/sync
   VPS_SYNC_API_KEY=kunci-rahasia-api-vps-anda
   DATABASE_URL=postgresql://user:password@vps-ip:5432/sandya_db
   ```

---

## Ringkasan Perintah Proyek

| Perintah | Deskripsi |
| :--- | :--- |
| `pnpm tauri dev` | Menjalankan aplikasi native Tauri v2 desktop dalam mode pengembangan |
| `pnpm tauri build` | Mengompilasi paket instalasi native biner desktop |
| `pnpm tauri android dev` | Menjalankan aplikasi native pada target emulator/perangkat Android |
| `pnpm dev` | Menjalankan Next.js 16 web development server pada port 3000 |
| `pnpm build` | Melakukan type-checking dan kompilasi produksi Next.js |
| `pnpm test` | Menjalankan seluruh test suite unit, protokol biner, dan integrasi |
| `pnpm test:unit` | Menjalankan pengujian domain core, RBAC, triase, logistik, dan BLE mesh |
| `pnpm test:integration` | Menjalankan pengujian integrasi API dan sinkronisasi SQLite-Cloud |
| `pnpm sim:qr` | Menjalankan benchmark simulasi kompresi dan kapasitas QR Code |
| `pnpm sim:parity` | Menjalankan simulasi rekonstruksi Poster Multi-QR Paritas XOR |
| `pnpm sim:ultra` | Menjalankan benchmark format biner Ultra-Dense v4 |
| `pnpm sim:final` | Menjalankan seluruh suite simulasi dan benchmark performa |
| `npm run db:up` | Menjalankan Docker PostgreSQL 16 + PostgREST lokal |
| `npm run db:down` | Menghentikan container database pengujian lokal |
| `npm run db:reset` | Menghapus volume dan merestart database lokal dari awal |
| `npm run db:migrate` | Menjalankan migrasi DDL `supabase-postgres-schema.sql` ke database target |

---

## Indeks Dokumentasi Teknis

Dokumentasi lengkap sistem Sandya tersusun di direktori [`docs/`](./docs/README.md):

- **Spesifikasi Rekayasa & Protokol Jaringan**:
  - [Analisis Arsitektur & Mitigasi Race Condition](./docs/analisis-arsitektur.md)
  - [Spesifikasi Bluetooth LE Mesh & Intercom Taktis PTT](./docs/spesifikasi-mesh-dan-intercom.md)
  - [Spesifikasi Animated QR & Poster Paritas XOR](./docs/spesifikasi-transfer-animated-dan-poster.md)
  - [Kamus Bencana & Bit-Packing Ultra-Dense v4](./docs/metode-transfer-dan-kamus-bencana.md)
  - [Tokenisasi Nama Indonesia & Paritas QR](./docs/tokenisasi-nama-dan-paritas-qr.md)
  - [Event Sourcing, Hierarki Posko, & Universal Data Mule](./docs/event-sourcing-dan-hierarki.md)
  - [Tata Kelola Organisasi & Kriptografi Ed25519](./docs/tata-kelola-organisasi-dan-kriptografi.md)
- **Desain & Antarmuka (`docs/design/`)**:
  - [Indeks Desain Teknis](./docs/design/README.md)
  - [Arsitektur Antarmuka & Dashboard 5-Tab](./docs/arsitektur-ui-dan-dashboard.md)
  - [Blueprint Arsitektur Frontend](./docs/design/ui-ux/01-arsitektur-frontend-sandya.md)
  - [Pedoman Standar Solar Icons](./docs/design/ui-ux/02-pedoman-solar-icons.md)
  - [Sistem Desain & Token Warna Semantik](./docs/design/ui-ux/03-sistem-desain-dan-token-warna.md)
  - [Katalog Skema Basis Data & ERD](./docs/design/database/README.md)
- **Alur Pengguna (`docs/userflow/`)**:
  - [Peta Induk & Arsitektur User Flow](./docs/userflow/00-arsitektur-dan-peta-userflow.md)
  - [Spesifikasi Alur 7 Peran Pengguna](./docs/userflow/roles/)
- **Arsip Dokumen Historis (`docs/archive/`)**:
  - [Indeks Arsip & Catatan Riset Terdahulu](./docs/archive/README.md)

---

## 👥 Kontributor & Penghargaan (Credits & Contributors)

Terima kasih yang sebesar-besarnya kepada kontributor yang telah berperan dalam merancang dan mengembangkan fondasi Sandya:

- **[@Oktazz](https://github.com/Oktazz)** — *Kontributor Proyek & Pengembangan Awal*
- **[@kasumadana](https://github.com/kasumadana)** — *Kontributor Proyek & Pengembangan Awal*

Daftar lengkap dan panduan kontribusi dapat dilihat pada berkas [`CONTRIBUTORS.md`](./CONTRIBUTORS.md).

---

## Lisensi

Proyek ini dilisensikan di bawah lisensi Apache-2.0 / MIT. Dikembangkan untuk mendukung operasi tanggap darurat bencana kemanusiaan dan penanganan krisis yang tangguh.

