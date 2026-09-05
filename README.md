# Sandya

Platform Manajemen Tanggap Darurat Bencana Mandiri (Local-First & Offline-Mesh Ecosystem) untuk penanganan pengungsi, triase medis lapangan, logistik gudang posko, temu keluarga terpisah, dan komunikasi taktis PTT dalam kondisi tanpa internet (Zero-Infrastructure Disaster Recovery).

---

## Arsitektur Sistem

Sandya dibangun dengan prinsip Local-First Resilient Architecture:
1. **Penyimpanan Lokal Edge (Device-First)**: Seluruh pencatatan data warga, resep medis, mutasi beras/logistik, dan pesan taktis selalu disimpan ke basis data lokal perangkat terlebih dahulu.
2. **Multi-Transport Offline Sync**: Sinkronisasi antar-posko tetap berjalan tanpa koneksi internet menggunakan Bluetooth Low Energy (BLE) Mesh SMP v1, Animated QR Streaming (6 FPS), dan Poster Paritas N+1 Dynamic (Erasure Coding).
3. **Upstream Cloud Synchronization**: Ketika koneksi internet terhubung, antrean Transactional Outbox otomatis mengunggah data ke Cloud (Supabase atau PostgreSQL VPS) secara idempoten dan bebas duplikasi.

---

## Kebutuhan Sistem

- Node.js >= 20.x
- pnpm >= 9.x (atau npm >= 10.x)
- Docker & Docker Compose (opsional, untuk local PostgreSQL testing)
- PostgreSQL 16+ atau Akun Supabase (opsional, untuk upstream cloud sync)

---

## Opsi Aktivasi dan Konfigurasi Database

Sandya mendukung 4 opsi mode deployment sesuai kebutuhan operasional:

### Opsi 1: Mode Offline Murni / Local-First SQLite (Bawaan)
Mode ini adalah konfigurasi standar. Aplikasi berjalan 100% di perangkat lokal tanpa memerlukan setup cloud server, database eksternal, ataupun koneksi internet.

Langkah aktivasi:
1. Pasang dependensi:
  ```bash
  pnpm install
  ```
2. Jalankan aplikasi:
  ```bash
  pnpm dev
  ```
Semua mutasi otomatis tersimpan pada database lokal dan antrean Outbox siap disinkronisasikan antar perangkat via BLE / QR.

---

### Opsi 2: Mode Supabase Cloud (Managed)
Gunakan opsi ini jika ingin menghubungkan posko-posko ke platform Supabase Cloud terkelola.

Langkah aktivasi:
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor** pada dashboard Supabase Anda.
3. Salin dan jalankan seluruh isi file DDL schema:
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
  pnpm dev
  ```

---

### Opsi 3: Mode Local Docker PostgreSQL (Pengujian Lokal)
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
  pnpm dev
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
Gunakan opsi ini untuk deployment mandiri pada server VPS (Bring Your Own Cloud) milik BPBD, PMI, atau instansi terkait.

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
4. Jalankan aplikasi dalam mode produksi:
  ```bash
  pnpm build
  pnpm start
  ```

---

## Ringkasan Perintah Database dan Skrip

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan Next.js development server pada port 3000 |
| `npm run build` | Melakukan type-checking dan kompilasi produksi Next.js |
| `npm test` | Menjalankan seluruh test suite unit, protokol, dan integrasi (100% pass) |
| `npm run db:up` | Menjalankan Docker PostgreSQL 16 + PostgREST lokal |
| `npm run db:down` | Menghentikan container database lokal |
| `npm run db:reset` | Menghapus volume dan merestart database lokal dari awal |
| `npm run db:migrate` | Menjalankan skema DDL `supabase-postgres-schema.sql` ke database target |

---

## Struktur File Database dan Sinkronisasi

- `src/infrastructure/db/supabase-postgres-schema.sql`: DDL 12 tabel PostgreSQL 16 & Supabase, triggers timestamp, RLS policies, dan index.
- `src/infrastructure/sync/cloud-sync.service.ts`: Service sinkronisasi outbox push dan remote delta pull.
- `src/infrastructure/config/cloud.config.ts`: Konfigurasi terpusat driver Supabase, Postgres VPS, dan opsi batch outbox.
- `docker-compose.yml`: Konfigurasi multi-container PostgreSQL + PostgREST siap pakai.
- `scripts/apply-schema.js`: Runner migrasi skema database cross-platform.
- `.env.example`: Template variabel lingkungan untuk seluruh opsi mode deployment.

---

## Lisensi dan Penggunaan

Dikembangkan untuk mendukung operasi tanggap darurat bencana, kemanusiaan, dan mitigasi krisis.
