# Arsitektur Antarmuka (UI/UX) & Navigasi Dashboard: Sanidya

Dokumen ini mendefinisikan rancangan antarmuka resmi sistem **Sanidya (Offline-First Disaster Management)**, yang mencakup adaptasi tata letak responsif untuk dua moda operasional:
1. **Moda Mobile-First (Smartphone)**: Didesain untuk relawan lapangan dengan interaksi jempol (*thumb-friendly 4-Tab layout*) di kondisi darurat.
2. **Moda Desktop & Tablet (Command Center)**: Didesain untuk Koordinator Posko Induk / Hub Gudang Utama dengan tampilan multi-panel (*Master-Detail*) dan pemantauan agregat multi-posko.

---

## 1. Prinsip Desain UI di Lapangan Bencana (*Extreme Environment UX*)

1. **Kontras Tinggi & Tahan Silau Matahari (*High-Contrast Outdoor Mode*)**:
   * Menggunakan tipografi tegas, elemen border yang jelas, dan palet warna triase standar yang mudah dibedakan di bawah terik matahari maupun remang-remang tenda darurat.
2. **Target Sentuh Besar (*Large Touch Targets $\ge 48\text{px}$*)**:
   * Seluruh tombol, switch, dan chip dirancang agar mudah ditekan oleh relawan yang mengenakan sarung tangan medis atau tangan berlumpur.
3. **Indikator Offline Persisten**:
   * Banner status konektivitas lokal (*Offline Mode*) dan antrean sinkronisasi (*Pending Events*) selalu tampak di bagian atas layar.

---

## 2. Moda Mobile-First (Layar Smartphone Relawan)

```
┌─────────────────────────────────────────────────────────────┐
│  [Posko GOR Pacet]  🟢 8 Node (Mesh)       [⚙️ Pengaturan]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      KONTEN UTAMA LAYAR                     │
│               (Sesuai Tab yang Sedang Aktif)                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📊 Home | 👥 Warga | 📦 Logistik | 💬 Taktis | 🔄 Sync Hub │
│              [ ➕ Pendaftaran Cepat (FAB) ]                 │
└─────────────────────────────────────────────────────────────┘
```

### A. Rincian 5 Tab Mobile Konsolidasi:

#### 1. 📊 Tab: Beranda (*Dashboard Telemetry*)
* **Hero KPI Cards**:
  * Total Pengungsi (e.g. `512 Jiwa` | `128 KK`).
  * Kelompok Rentan: `42 Balita` | `18 Hamil` | `31 Lansia` | `6 Disabilitas`.
  * Pasien Triase Kritis: `🔴 3 Merah` | `🟡 12 Kuning`.
* **Barometer Sinyal Kebutuhan (*Urgent Needs Heatmap*)**:
  * Status persentase pemenuhan: Beras ($90\%$), Susu Formula ($12\%$ - **KRITIS!**), Pembalut ($45\%$), Selimut ($80\%$).
* **Widget Status BLE Mesh**:
  * *"🟢 8 Node HP Aktif Terhubung dalam Jangkauan Relay Mesh"*
* **Peringatan Stok Kritis (*Burn Rate Alert*)**:
  * *"⚠️ Stok Susu Bayi diprediksi habis dalam 8 jam!"*

---

#### 2. 👥 Tab: Warga & Kesehatan (*People, Medical & Reunion*)
*Menggabungkan seluruh aspek kependudukan dalam 3 Sub-Segmented Tabs atas:*
* **`[📋 Daftar Pengungsi]`**:
  * List kartu pengungsi, pencarian instan (nama/NIK/dusun), filter kelompok rentan, dan status penempatan tenda/ruangan.
* **`[🩺 Triase & Medis]`**:
  * Papan Kanban Triase START (🔴 Merah, 🟡 Kuning, 🟢 Hijau, ⚫ Hitam), antrean pasien, skrining tanda vital (tensi/suhu), dan tiket resep obat.
* **`[🔍 Temu Keluarga]`**:
  * Daftar pencarian kerabat, status temu, dan banner alert otomatis saat hasil sync mesh/scan QR posko lain menemukan kecocokan (*High-Confidence Match*).

---

#### 3. 📦 Tab: Logistik & Distribusi (*Inventory & Supply*)
* **`[📦 Stok Gudang]`**:
  * Sisa kuantitas fisik barang dan riwayat buku kas mutasi (*Append-Only Ledger*).
* **`[🤝 Distribusi]`**:
  * Penyerahan bantuan ke warga (Pindai warga $\rightarrow$ serahkan barang $\rightarrow$ tiket `COMPLETED`).
* **`[🚚 Bantuan Antar-Posko]`**:
  * Buat pengajuan permintaan stok ke posko lain dan pembuatan QR Surat Jalan (*Waybill*).

---

#### 4. 💬 Tab: Komunikasi Taktis & Mesh Radio (*Tactical Intercom*)
* **Multi-Saluran Radio Lapangan**:
  * Saluran: `[ #posko-all ]` `[ #medis ]` `[ #logistik ]` `[ 🚨 SOS ]`.
* **Feed Obrolan Terenkripsi**:
  * Log pertukaran pesan teks radio, tiket darurat, dan audio note waveform.
* **Tombol Push-to-Talk (PTT)**:
  * Tombol mikrofon melayang: Tekan dan tahan untuk merekam suara mikro 5 detik terkompresi Opus 3.2 kbps ($\approx 2\text{ KB}$), lepas untuk memancarkan via BLE Mesh.
* **Radar Topologi Mesh (`/tactical/radar`)**:
  * Peta live kekuatan sinyal RSSI seluruh HP relawan dalam jangkauan 1–7 hop.

---

#### 5. 🔄 Tab: Sinkronisasi (*Sync Center*)
* **Status Zero-Touch BLE Mesh**:
  * Log otomatisasi gossip sync di latar belakang (*silent event sync log*).
* **Moda Cadangan 1: Layar (Animated Multipart QR)**:
  * Transmit animasi 6 FPS dan scanner kamera asinkron out-of-order.
* **Moda Cadangan 2: Kertas (Poster Paritas XOR)**:
  * Generator Grid 4 QR / Grid 8 QR tahan sobekan fisik untuk serah terima posko.

---

### B. Tombol Aksi Melayang (*Floating Action Button / FAB*):
* Terletak di tengah bawah: **`[ ➕ Pendaftaran Cepat ]`**.
* Membuka form modal **Fast Mobile Intake 30 Detik** dari layar mana pun tanpa perlu berpindah tab.

---

## 3. Moda Desktop & Tablet (Command Center & Hub Posko Induk)

Untuk laptop/tablet di posko induk, antarmuka bertransformasi menjadi tata letak multi-panel yang memaksimalkan efisiensi layar lebar:

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ ⛺ SANIDYA   │ [🏛️ Posko Induk Cianjur]  [📶 Offline]  [12 Pending]  [User] │
├──────────────┼──────────────────────────────┬───────────────────────────────┤
│ 📊 Ringkasan │ DAFTAR PENGUNGSI (512 JIWA)  │ DETAIL PENGUNGSI & TIMELINE   │
│              ├──────────────────────────────┼───────────────────────────────┤
│ 👥 Warga     │ [🔍 Cari Nama, NIK, Dusun]   │ 👤 Muhammad Budi Santoso      │
│              │ Filter: [Semua] [Balita]     │ NIK   : 3201011508920003      │
│ 🩺 Medis     │ ──────────────────────────── │ Usia  : 34 Tahun (Laki-laki)  │
│              │ • Budi Santoso (34 th)       │ Dusun : Dusun Cijedil (RW 03) │
│ 📦 Logistik  │   Dusun Cijedil | Tenda 02   │ Tenda : Tenda Darurat 02      │
│              │ • Siti Rahmawati (32 th)     │ ───────────────────────────── │
│ 🚚 Bantuan   │   Dusun Cijedil | Kelas 2B   │ REKAM PERISTIWA (EVENT LOG):  │
│              │ • Agus Wijaya (8 th)         │ • 08:30 [Intake] Terdaftar    │
│ 🔍 Temu Org  │   Dusun Cibodas | Tenda 04   │ • 10:15 [Medis] Demam 38.5°C  │
│              │ • Nurul Hidayah (62 th)      │ • 10:30 [Obat] Paracetamol 500│
│ 🔄 Sync Hub  │   Dusun Gasol | GOR Barat    │ • 14:00 [Logistik] 1 Selimut  │
│              │ • Dedi Kurniawan (41 th)     │ ───────────────────────────── │
│ ⚙️ Pengaturan│   Dusun Cijedil | Tenda 01   │ [🩺 Tambah Medis] [📦 Bantuan]│
└──────────────┴──────────────────────────────┴───────────────────────────────┘
```

### A. Komponen Tata Letak Desktop:
1. **Sidebar Navigasi Kiri (Collapsible Sidebar)**:
   * Menampilkan seluruh menu operasional secara vertikal.
   * Shortcut cepat untuk berpindah posko dalam satu klaster bencana (*Workspace Switcher*).
2. **Panel Tengah (Data Grid / List Panel)**:
   * Tabel data interaktif dengan multi-filter, *bulk selection*, dan tombol ekspor massal.
3. **Panel Kanan (Inspector / Detail Drawer)**:
   * Menampilkan rekam peristiwa kronologis (*Event Sourcing Timeline*) dari entitas yang dipilih secara *real-time*.
4. **Header Command Center**:
   * Monitor status sinkronisasi, indikator event yang belum terkirim (*Outbox Queue*), dan tombol darurat *Broadcast Notice*.

---

## 4. Matriks 6-Status UI (*Universal 6-State Matrix*)

Setiap modul antarmuka wajib mengimplementasikan 6 status tampilan:

| Status UI | Tampilan & Perilaku Pengguna |
| :--- | :--- |
| **1. Initial Loading** | Skeleton loader sesuai bentuk kartu/tabel tanpa pergeseran layout (*No CLS*). |
| **2. Empty State** | Ilustrasi visual + teks panduan + Tombol Call-to-Action (misal: *"Belum ada pengungsi terdaftar. [ ➕ Daftarkan Warga Pertama ]"*). |
| **3. Populated / Success** | Data ter-render lengkap dengan label aksesibilitas dan animasi transisi halus. |
| **4. Error State** | Pesan kesalahan manusiawi + tombol `[ Coba Lagi ]` + error boundary. |
| **5. Offline / Syncing** | Badge oranye persisten: `[📶 Mode Offline: 4 Event Menunggu Sync]`. |
| **6. Conflict Resolution** | Modal komparasi visual jika terjadi anomali data (menampilkan pilihan rekonsiliasi deterministik). |

---

## 5. Ringkasan Rute Aplikasi Resmi (Canonical Next.js 16 App Router)

```
src/app/
│
├── page.tsx                                    # 🚪 Gerbang Utama (Bahasa & 3 Pilihan Aksi Bersih)
│
├── (auth)/                                     # Rute Aktivasi Tugas & Onboarding
│   ├── activate/page.tsx                       # Jalur [1]: Scan Kartu Tugas / Masukkan Kode Manual
│   ├── org-setup/page.tsx                      # Jalur [2]: Wizard Pendaftaran Lembaga Baru
│   └── guest/page.tsx                          # Jalur [3]: Pusat Pencarian Keluarga Mode Warga
│
├── (organization)/                             # 🏢 Level 1: Konsol Manajemen Lembaga
│   ├── page.tsx                                # Profil Lembaga, Master Key, & Daftar Misi Bencana
│   ├── missions/create/page.tsx                # Form Pembuatan Misi Bencana Baru
│   ├── members/page.tsx                        # Roster Tim & Generator Kartu Tugas
│   ├── settings/page.tsx                       # Pengaturan Kunci Master & Cloud BYOC Host
│   │
│   └── missions/[missionId]/                   # 🌋 Level 2: Command Center Misi Bencana
│       ├── page.tsx                            # Overview Misi (Peta, Status BNPB, Agregat Warga)
│       ├── posko/create/page.tsx               # Form Pendirian Titik Posko Lapangan Baru
│       ├── logistics-hub/page.tsx              # Gudang Pusat Misi & Rantai Pasok Antar-Posko
│       └── posko-grid/page.tsx                 # Grid Seluruh Posko di Bawah Misi Ini
│
└── (posko)/[poskoId]/                          # ⛺ Level 3: Dashboard Operasional Internal Posko
    ├── layout.tsx                              # Shell Responsif (Mesh Radar Banner & 5-Tab)
    ├── page.tsx                                # 📊 1. Beranda Telemetri Posko (KPI & Alert)
    ├── refugees/                               # 👥 2. Warga, Medis & Temu Keluarga
    │   ├── page.tsx                            # Sub-Tab [📋 Daftar Pengungsi]
    │   ├── intake/page.tsx                     # Form Fast Mobile Intake 30 Detik
    │   ├── triage/page.tsx                     # Sub-Tab [🩺 Papan Kanban Triase START Medis]
    │   ├── reunion/page.tsx                    # Sub-Tab [🔍 Pusat Temu Keluarga Terpisah]
    │   └── [refugeeId]/page.tsx                # Detail Warga & Event Sourcing Timeline
    ├── logistics/                              # 📦 3. Logistik & Distribusi
    │   ├── page.tsx                            # Sub-Tab [📦 Stok Gudang & Buku Kas Mutasi]
    │   ├── distribute/page.tsx                 # Sub-Tab [🤝 Penyerahan Bantuan ke Pengungsi]
    │   └── waybills/page.tsx                   # Sub-Tab [🚚 Permintaan Stok Antar-Posko & Surat Jalan]
    ├── tactical/                               # 💬 4. NEW: Komunikasi Taktis & Mesh Intercom
    │   ├── page.tsx                            # Radio Chat 4 Saluran (#all, #medis, #logistik, #sos) + PTT
    │   └── radar/page.tsx                      # Topologi Jaringan & RSSI Tetangga Mesh
    ├── sync/                                   # 🔄 5. Pusat Sinkronisasi & Fallback
    │   ├── page.tsx                            # Hub Sinkronisasi (Status Zero-Touch BLE Mesh)
    │   ├── animated-qr/page.tsx                # Fallback Layar (Transmit / Receive Video Scanner)
    │   └── poster/page.tsx                     # Fallback Cetak (Generator Poster Paritas XOR)
    └── settings/page.tsx                       # ⚙️ Pengaturan Kriptografi & Profil Posko Ini
```
