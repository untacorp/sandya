# User Flow: Onboarding, Aktivasi Tim, & Tata Kelola Organisasi

> **Status**: Approved  
> **Target Persona**: Superadmin Lembaga, Koordinator Posko, Dokter/Relawan Tim  
> **Core Objective (JTBD)**: Membuka lembaga/posko baru atau mengaktifkan tugas lapangan instan via scan QR kartu tugas tanpa antre dan tanpa login rumit.  
> **Konteks & Lingkungan**: Offline-first Mobile & Desktop Command Center.

---

## 1. Lingkup Alur & Pra-Kondisi

### Cakupan (In Scope)
- Gerbang masuk 3-kartu di halaman utama (`/`).
- Jalur 1: Aktivasi kartu tugas tim via pemindaian QR / input kode manual (`/activate`).
- Jalur 2: Wizard pendirian organisasi, misi operasi bencana, dan posko pertama (`/org-setup`).
- Konsol manajemen misi & pembagian peran regu (Poster QR Regu & PIN Otorisasi 4-digit) (`/operations/[opId]`, `/members`).
- Konfigurasi penyedia cloud (Sandya Managed vs BYOC) (`/settings`).

### Di Luar Cakupan (Out of Scope)
- Registrasi akun berbasis email/password publik (Sandya murni menggunakan otoritas kriptografi lokal Ed25519).

### Prekondisi
- Aplikasi Sandya terpasang di HP/Laptop (Tauri v2 / Web PWA).

### Postkondisi
- Pasangan kunci Ed25519 tersimpan aman di SQLite lokal.
- Sesi aktif tersimpan dengan role RBAC yang sesuai, langsung diarahkan ke dasbor posko atau konsol organisasi.

---

## 2. Peta Perjalanan Makro (High-Level Journey)

```mermaid
flowchart LR
  A(["1. Buka Aplikasi: /"]) --> B{"Pilih Jalur Aksi"}
  B -->|Jalur 1: Anggota Tim| C["2. Scan QR Kartu Tugas"]
  B -->|Jalur 2: Inisiator / Pimpinan| D["3. Wizard Pendirian Lembaga"]
  C --> E["4. Sesi Aktif di SQLite"]
  D --> E
  E --> F(["5. Masuk Ruang Kerja Operasional"])
```

---

## 3. Diagram Alur Mikro Terinci (Detailed Flowchart)

```mermaid
flowchart TD
  Start(["Mulai: Buka Aplikasi /"]) --> GatewayScreen["Tampilan Gerbang Utama<br/>(3 Kartu Tindakan)"]

  GatewayScreen --> ActionChoice{"Pengguna Memilih Kartu"}

  %% JALUR 1: ANGGOTA TIM (DOKTER, LOGISTIK, RELAWAN)
  ActionChoice -->|"Kartu 1: Scan Kartu Tugas"| ScanPassScreen["Rute: /activate<br/>Buka Kamera Scanner"]
  ScanPassScreen --> CamCheck{"Izin Kamera Diberikan?"}
  CamCheck -->|Ya| OpticalScan["/Sorot Kamera ke QR Kartu Tugas/"]
  CamCheck -->|Tidak / Rusak| ManualInputForm["Form Input 8-Karakter Kode Tugas Manual"]
  
  OpticalScan --> ParsePayload["Dekode Payload Ed25519 & Role Pass"]
  ManualInputForm --> ParsePayload
  
  ParsePayload --> ValidPass{"Tanda Tangan Valid & Exp Valid?"}
  ValidPass -->|Tidak Valid| ErrorToast["Alert: Kartu Tugas Tidak Dikenali / Kedaluwarsa"]
  ErrorToast --> ScanPassScreen
  
  ValidPass -->|Valid| ConfirmIdentityModal["Modal Konfirmasi:<br/>• Nama Personel<br/>• Posko Penugasan<br/>• Hak Akses Peran"]
  ConfirmIdentityModal --> TapStart["User Ketuk: 'Mulai Bertugas'"]
  TapStart --> SaveLocalSession[("Simpan Kredensial di SQLite Lokal")]
  SaveLocalSession --> RouteToPosko["Navigasi ke /posko/[poskoId]<br/>(Sesuai Matriks RBAC)"]

  %% JALUR 2: INISIATOR / PIMPINAN LEMBAGA
  ActionChoice -->|"Kartu 2: Buka Posko Baru"| OrgSetupWizard["Rute: /org-setup<br/>Wizard 3-Langkah"]
  OrgSetupWizard --> Step1["Langkah 1: Nama Lembaga & Kategori<br/>(Kitabisa / PMI / BPBD / Mandiri)"]
  Step1 --> Step2["Langkah 2: Nama Misi Tanggap Darurat<br/>(e.g., Gempa Cianjur 2026)"]
  Step2 --> Step3["Langkah 3: Nama Posko Pertama & Tipe<br/>(Tenda RW 03 / Gudang Utama)"]
  Step3 --> SubmitOrg["User Ketuk: 'Dirikan Lembaga & Posko'"]
  
  SubmitOrg --> GenKeys["Generate Ed25519 Master Authority Key<br/>(did:sandya:org_...)"]
  GenKeys --> InitOrgDB[("Inisialisasi Tabel DB SQLite Lokal")]
  InitOrgDB --> DelegationModal["Tampilkan Modal Bagikan Kartu Tugas:<br/>• QR Tim Dokter<br/>• QR Tim Logistik<br/>• QR Relawan Pendata"]
  DelegationModal --> RouteToMission["Navigasi ke /operations/[operationId]"]

  RouteToPosko --> EndState(["Selesai: Siap Bertugas"])
  RouteToMission --> EndState
```

---

## 4. Tabel Interaksi Langkah Demi Langkah

| Langkah # | Rute / Layar | Tindakan Aktor | Respons Sistem / SQLite Lokal | Validasi & Catatan |
|---|---|---|---|---|
| **1.0** | `/` | Membuka aplikasi Sandya | Menampilkan halaman landing dengan 3 kartu pilihan bahasa & aksi | Desain kontras tinggi lapangan |
| **1.1a** | `/activate` | Mengetuk kartu *[1] Scan Kartu Tugas* | Menyalakan kamera pemindai QR aktif | Fallback input kode teks jika kamera mati |
| **1.1b** | `/activate` | Memindai QR tugas dari koordinator | Memverifikasi tanda tangan Ed25519, mengekstrak `role`, `orgId`, `posId` | Instan 1 detik (*Haptic Beep*) |
| **1.1c** | `/activate` | Mengetuk *"Mulai Bertugas"* | Menyimpan sesi pengguna ke SQLite dan me-route ke dashboard posko | Hak akses RBAC terkunci otomatis |
| **1.2a** | `/org-setup` | Mengetuk kartu *[2] Buka Posko Baru* | Membuka wizard input nama organisasi & posko | Mendukung komunitas lokal mandiri |
| **1.2b** | `/org-setup` | Mengisi data posko & klik *Simpan* | Membuat Master Keypair lokal, insert data ke tabel `organizations` & `posts` | Tanpa butuh koneksi internet |
| **1.2c** | `/operations/[id]` | Koordinator membuat kartu tugas regu | Men-generate QR token regu yang dapat di-scan 50 relawan serentak | *Zero-bottleneck distribution* |

---

## 5. Matriks Kasus Khusus & Penanganan Galat (*Edge Cases*)

| Pemicu / Kondisi | Mode Kegagalan | Perilaku UX & Jalur Pemulihan |
|---|---|---|
| **Kamera HP Buram / Malam Hari** | Gagal fokus memindai QR kartu tugas | Sediakan tombol *"Gunakan Kode Manual"*; koordinator menyebutkan kode 8 karakter alfanumerik. |
| **Penaikan Hak Akses Mendadak di Tenda** | Relawan biasa mendadak ditugaskan jadi Petugas Medis | Koordinator membuka menu Posko $\rightarrow$ Ketik PIN 4-digit di HP relawan $\rightarrow$ Hak akses langsung naik seketika. |
| **Pindah Posko Penugasan** | Relawan dimutasi dari Posko A ke Posko B | Cukup scan QR kartu tugas Posko B $\rightarrow$ SQLite lokal mengalihkan *active posko workspace* tanpa menghapus history. |
| **Pergantian Host Cloud (BYOC)** | Lembaga BPBD ingin sinkron ke server internal | Buka `/settings` $\rightarrow$ pilih *"Server Mandiri"* $\rightarrow$ masukkan URL `https://sandya.bpbd.go.id`. |

---

## 6. Inventaris Layar & Rute Terkait

| Nama Layar | Rute / ID Komponen | Komponen Utama | Aksi Kunci |
|---|---|---|---|
| **Gerbang Utama** | `/page.tsx` | Kartu 3 Jalur, Pemilih Bahasa | Masuk Jalur 1/2/3 |
| **Aktivasi Kartu Tugas** | `/(auth)/activate/page.tsx` | Viewfinder Kamera, Tab Input Manual | Pindai QR, Submit Kode |
| **Wizard Setup Lembaga** | `/(auth)/org-setup/page.tsx` | Multi-step Form, Tipe Posko Selector | Buat Master Key, Buka Posko |
| **Konsol Operasi Misi** | `/(organization)/operations/[id]/page.tsx` | Grid Kartu Posko, Status BNPB Badge | Buka Posko, Tambah Tenda |
| **Manajemen Anggota** | `/(organization)/members/page.tsx` | Roster Anggota, QR Generator Kartu Tugas | Cetak QR Regu, Setel PIN |
| **Pengaturan Cloud & Key** | `/(organization)/settings/page.tsx` | Input URL BYOC, Ekspor Master Key | Backup Kunci, Switch Provider |
