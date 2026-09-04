# Tata Kelola Organisasi, Hierarki 3-Tingkat, & Kriptografi: Sanidya

> **Status**: Approved (Model 4 Peran Inti & Hierarki Terintegrasi)  
> **Ruang Lingkup**: Lembaga, Misi Bencana, Posko Lapangan, Matriks 4 Peran RBAC, dan Kriptografi Ed25519.

---

## 1. Hierarki 3-Tingkat Tata Kelola Kemanusiaan

Sistem Sanidya menstrukturkan operasional bencana ke dalam 3 tingkatan yang saling terhubung:

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 TINGKAT 1: ORGANISASI / LEMBAGA PERMANEN                 │
│ • Sifat             : Lembaga hukum permanen / yayasan.     │
│ • Contoh            : "PMI Cianjur", "BPBD Jawa Barat",     │
│                       "Yayasan Kitabisa", "Relawan Mandiri".│
│ • Kunci Otoritas    : Master Authority Key (Ed25519).       │
│ • Fokus             : Portofolio seluruh Misi Bencana,      │
│                       manajemen server Cloud BYOC, backup.  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Membuka Operasi Tanggap Darurat)
┌──────────────────────────────▼──────────────────────────────┐
│ 🌋 TINGKAT 2: MISI / OPERASI BENCANA (Disaster Mission Ops) │
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
│ ⛺ TINGKAT 3: POSKO TAKTIS LAPANGAN (Tactical Shelter / Hub) │
│ • Sifat             : Titik fisik tenda pengungsi / gudang. │
│ • Contoh            : "Posko Tenda RW 03 Kp. Cijedil",      │
│                       "Gudang Logistik GOR Pacet".          │
│ • Fokus             : Fast Mobile Intake 30s, Triase Medis, │
│                       Buku Kas Logistik Posko, Sync P2P.    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Model 4 Peran Inti (*Streamlined 4-Role RBAC*)

Untuk mencegah kebingungan dan kompleksitas berlebih di lapangan darurat, Sanidya menyederhanakan seluruh operasional ke dalam **4 Peran Fungsional**:

| Peran (*Role*) | Fast Intake Warga (30s) | Wewenang Medis | Wewenang Stok Fisik | Chat Taktis Lapangan (BLE) | Cetak Poster Serah Terima |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. 👑 KOORDINATOR**<br/>*(Coordinator / Lead)* | ✅ **Bebas (FAB +)** | ✅ Audit | 👁️ Audit Agregat | ✅ **Penuh (#all, #sos, DM)** | ✅ **Otorisasi Utama (Ed25519)** |
| **2. 🩺 MEDIS**<br/>*(Medical / Doctor)* | ✅ **Bebas (FAB +)** | ✅ **Triase START & Resep** | ❌ (Hanya tiket obat) | ✅ **Saluran #medis & #sos** | ❌ Dilarang |
| **3. 📦 LOGISTIK**<br/>*(Logistics / Warehouse)* | ✅ **Bebas (FAB +)** | ❌ | ✅ **SATU-SATUNYA yang potong stok** | ✅ **Saluran #logistik & #sos** | ❌ Dilarang |
| **4. 📝 RELAWAN**<br/>*(Field Volunteer)* | ✅ **Bebas (FAB +)** | ❌ | ❌ (Hanya serahkan fisik) | ✅ **Saluran #posko-all & #sos** | ❌ Dilarang |
| **[ 🔍 WARGA / TAMU ]**<br/>*(Guest Public)* | 👁️ Cari Kerabat Sendiri | ❌ | ❌ | ❌ **DILARANG (Zero Chat Access)** | 👁️ Pindai Poster (Read-Only) |

> [!IMPORTANT]
> **Prinsip Isolasi Guest / Warga (*Guest Walled Garden*)**:
> Pengguna mode warga/tamu (`PUBLIC_GUEST`) **TERKUNCI TOTAL di portal `/guest`**. 
> Warga **DILARANG KERAS mengakses Chat/Intercom Taktis** demi menjaga kerahasiaan rekam medis pasien, mencegah kepanikan massal, dan menghindari *packet storm* yang menghabiskan bandwidth radio BLE Mesh staf.

---

## 3. Dua Jenis QR Resmi Sanidya (*The 2 Official QR Codes*)

Sanidya menstandarkan hanya ada **2 jenis QR resmi**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        2 JENIS QR RESMI SANIDYA                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 🎫 QR KARTU TUGAS (Role Pass QR)                                    │
│    • Dibuat oleh : Koordinator di menu Posko / Misi                    │
│    • Diberikan ke: Dokter, Petugas Logistik, & Relawan Lapangan         │
│    • Payload     : { OrgId, MisiId, PoskoId, Role, Ed25519 Signature }│
│    • Fungsi      : Mengaktifkan HP relawan agar langsung masuk ke      │
│                    posko yang ditugaskan dengan hak akses yang pas.    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. 📦 QR DATA POSKO (Animated QR di Layar / Poster Paritas di Kertas)   │
│    • Dibuat oleh : Posko yang sedang beroperasi                        │
│    • Diberikan ke: HP relawan posko lain / Tim relawan penerus         │
│    • Payload     : Header Konteks Misi (~30B) + Delta Biner Ultra-Dense│
│    • Fungsi      : Berbagi / sinkronisasi data antar-posko (Data Mule).│
│                    Otomatis mendaftarkan Misi & Posko di HP penerima.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Gerbang Masuk Pengguna (*Landing Gateway*)

Halaman pembuka (`/`) menyajikan 3 pilihan aksi yang jelas:

```
┌─────────────────────────────────────────────────────────────┐
│                      ⛺ SANIDYA                             │
│       Sistem Terdesentralisasi Tanggap Bencana              │
│                  [ 🇮🇩 Bahasa Indonesia ▾ ]                  │
├─────────────────────────────────────────────────────────────┤
│  PILIH CARA MASUK:                                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📷 [1] SCAN KARTU TUGAS DARI TIM                      │  │
│  │ UNTUK: Dokter, Petugas Logistik, & Relawan Lapangan.  │  │
│  │ (Sorot kamera ke QR yang diberikan Koordinator Anda)  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🏢 [2] DAFTARKAN LEMBAGA / ORGANISASI BARU            │  │
│  │ UNTUK: Pimpinan PMI, BPBD, Yayasan, atau Inisiator    │  │
│  │ yang ingin mendirikan Misi & Posko baru.              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🔍 [3] PUSAT PENCARIAN KELUARGA (MODE WARGA)          │  │
│  │ UNTUK: Warga yang mencari keberadaan kerabat atau     │  │
│  │ memindai poster posko tanpa perlu akun.               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  💡 Cadangan: [ 📂 Impor File .sanidya ] | [ ⌨️ Kode Manual ]│
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Arsitektur Sinkronisasi Cloud (Managed vs BYOC)

Setiap organisasi dapat memilih penyedia cloud di menu **`/(organization)/settings`**:
1. **Sanidya Cloud Hub (Default Managed Cloud)**: Gratis & terkelola langsung oleh Sanidya untuk relawan mandiri & NGO lokal.
2. **Self-Hosted BYOC (Bring Your Own Cloud)**: Menggunakan server instansi sendiri (`https://sanidya.bpbd.jabar.go.id`) untuk kepatuhan kedaulatan data BNPB/BPBD/Kemensos.
