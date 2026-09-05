# Tata Kelola Organisasi, Hierarki 3-Tingkat, & Kriptografi: Sandya

> **Status**: Approved (Model 4 Peran Inti & Hierarki Terintegrasi)  
> **Klasifikasi**: Tata Kelola Organisasi, RBAC, & Kriptografi Asimetris  
> **Ruang Lingkup**: Lembaga, Misi Bencana, Posko Lapangan, Matriks 4 Peran RBAC, dan Kriptografi Ed25519.  
> **Dokumen Terkait**: [Peta Induk User Flow](./userflow/00-arsitektur-dan-peta-userflow.md) | [User Flow Onboarding](./userflow/01-onboarding-dan-manajemen-organisasi.md)

---

## 1. Hierarki 3-Tingkat Tata Kelola Kemanusiaan

Sistem Sandya menstrukturkan operasional bencana ke dalam 3 tingkatan yang saling terhubung:

```text
┌─────────────────────────────────────────────────────────────┐
│  TINGKAT 1: ORGANISASI / LEMBAGA PERMANEN                   │
│ • Sifat             : Lembaga hukum permanen / yayasan.     │
│ • Contoh            : "PMI Cianjur", "BPBD Jawa Barat",     │
│                       "Yayasan Kitabisa", "Relawan Mandiri".│
│ • Kunci Otoritas    : Master Authority Key (Ed25519).       │
│ • Fokus             : Portofolio seluruh Misi Bencana,      │
│                       manajemen server Cloud BYOC, backup.  │
└──────────────────────────────┬──────────────────────────────┘
  │ (Membuka Operasi Tanggap Darurat)
┌──────────────────────────────▼──────────────────────────────┐
│  TINGKAT 2: MISI / OPERASI BENCANA (Disaster Mission Ops)   │
│ • Sifat             : Periode tanggap darurat (e.g. 14 hari)│
│ • Contoh            : "Tanggap Darurat Gempa Cugenang 2026",│
│                       "Operasi Banjir Bandang Demak 2026".  │
│ • Status BNPB       : PREPAREDNESS | ACTIVE_EMERGENCY |     │
│                       TRANSITION_RECOVERY | CLOSED_ARCHIVED │
│ • Fokus             : Peta sebaran posko, gudang sentral,   │
│                       dan jaringan logistik antar-posko.    │
└──────────────────────────────┬──────────────────────────────┘
  │ (Mendirikan Titik Tenda & Pos)
┌──────────────────────────────▼──────────────────────────────┐
│  TINGKAT 3: POSKO TAKTIS LAPANGAN (Tactical Shelter / Hub)   │
│ • Sifat             : Titik fisik tenda pengungsi / gudang. │
│ • Contoh            : "Posko Tenda RW 03 Kp. Cijedil",      │
│                       "Gudang Logistik GOR Pacet".          │
│ • Fokus             : Fast Mobile Intake 30s, Triase Medis, │
│                       Buku Kas Logistik Posko, Sync P2P.    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Model 4 Peran Inti (Streamlined 4-Role RBAC)

Untuk mencegah kebingungan dan kompleksitas berlebih di lapangan darurat, Sandya menyederhanakan seluruh operasional ke dalam **4 Peran Fungsional**:

| Peran (*Role*) | Fast Intake Warga (30s) | Wewenang Medis | Wewenang Stok Fisik | Chat Taktis Lapangan (BLE) | Cetak Poster Serah Terima |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. KOORDINATOR**<br/>*(Coordinator / Lead)* | [PASS] **Bebas (FAB +)** | [PASS] Audit | Audit Agregat | [PASS] **Penuh (#all, #sos, DM)** | [PASS] **Otorisasi Utama (Ed25519)** |
| **2. MEDIS**<br/>*(Medical / Doctor)* | [PASS] **Bebas (FAB +)** | [PASS] **Triase START & Resep** | [FAIL] (Hanya tiket obat) | [PASS] **Saluran #medis & #sos** | [FAIL] Dilarang |
| **3. LOGISTIK**<br/>*(Logistics / Warehouse)* | [PASS] **Bebas (FAB +)** | [FAIL] | [PASS] **SATU-SATUNYA yang potong stok** | [PASS] **Saluran #logistik & #sos** | [FAIL] Dilarang |
| **4. RELAWAN**<br/>*(Field Volunteer)* | [PASS] **Bebas (FAB +)** | [FAIL] | [FAIL] (Hanya serahkan fisik) | [PASS] **Saluran #posko-all & #sos** | [FAIL] Dilarang |
| **[ WARGA / TAMU ]**<br/>*(Guest Public)* | Cari Kerabat Sendiri | [FAIL] | [FAIL] | [FAIL] **DILARANG (Zero Chat Access)** | Pindai Poster (Read-Only) |

> [!IMPORTANT]
> **Prinsip Isolasi Guest / Warga (*Guest Walled Garden*)**:
> Pengguna mode warga/tamu (`PUBLIC_GUEST`) **TERKUNCI TOTAL di portal `/guest`**. 
> Warga **DILARANG KERAS mengakses Chat/Intercom Taktis** demi menjaga kerahasiaan rekam medis pasien, mencegah kepanikan massal, dan menghindari *packet storm* yang menghabiskan bandwidth radio BLE Mesh staf.

---

## 3. Dua Jenis QR Resmi Sandya (The 2 Official QR Codes)

Sandya menstandarkan hanya ada **2 jenis QR resmi**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        2 JENIS QR RESMI SANDYA                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. QR KARTU TUGAS (Role Pass QR)                                       │
│    • Dibuat oleh : Koordinator di menu Posko / Misi                    │
│    • Diberikan ke: Dokter, Petugas Logistik, & Relawan Lapangan        │
│    • Payload     : { OrgId, MisiId, PoskoId, Role, Ed25519 Signature }│
│    • Fungsi      : Mengaktifkan HP relawan agar langsung masuk ke      │
│                    posko yang ditugaskan dengan hak akses yang pas.    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. QR DATA POSKO (Animated QR di Layar / Poster Paritas di Kertas)     │
│    • Dibuat oleh : Posko yang sedang beroperasi                        │
│    • Diberikan ke: HP relawan posko lain / Tim relawan penerus         │
│    • Payload     : Header Konteks Misi (~30B) + Delta Biner Ultra-Dense│
│    • Fungsi      : Berbagi / sinkronisasi data antar-posko (Data Mule).│
│                    Otomatis mendaftarkan Misi & Posko di HP penerima.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Gerbang Masuk Pengguna (Landing Gateway)

Halaman pembuka (`/`) menyajikan 3 pilihan aksi yang jelas:

```text
┌─────────────────────────────────────────────────────────────┐
│                       SANDYA                                │
│       Sistem Terdesentralisasi Tanggap Bencana              │
│                  [ Bahasa Indonesia ▾ ]                     │
├─────────────────────────────────────────────────────────────┤
│  PILIH CARA MASUK:                                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [1] SCAN KARTU TUGAS DARI TIM                        │  │
│  │ UNTUK: Dokter, Petugas Logistik, & Relawan Lapangan.  │  │
│  │ (Sorot kamera ke QR yang diberikan Koordinator Anda)  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [2] DAFTARKAN LEMBAGA / ORGANISASI BARU              │  │
│  │ UNTUK: Pimpinan PMI, BPBD, Yayasan, atau Inisiator    │  │
│  │ yang ingin mendirikan Misi & Posko baru.              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [3] PUSAT PENCARIAN KELUARGA (MODE WARGA)            │  │
│  │ UNTUK: Warga yang mencari keberadaan kerabat atau     │  │
│  │ memindai poster posko tanpa perlu akun.               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│   Cadangan: [ Impor File .sandya ] | [ Kode Manual ]        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Arsitektur Sinkronisasi Cloud (Managed vs BYOC)

Setiap organisasi dapat memilih penyedia cloud di menu **`/(organization)/settings`**:
1. **Sandya Cloud Hub (Default Managed Cloud)**: Gratis & terkelola langsung oleh Sandya untuk relawan mandiri & NGO lokal.
2. **Self-Hosted BYOC (Bring Your Own Cloud)**: Menggunakan server instansi sendiri (`https://sandya.bpbd.jabar.go.id`) untuk kepatuhan kedaulatan data BNPB/BPBD/Kemensos.
