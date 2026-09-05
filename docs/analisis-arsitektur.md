# Analisis Kritis & Blueprint Arsitektur Sistem: Sandya (Offline-First Disaster Management)

> **Status**: Approved (Spesifikasi Fondasi Arsitektur)  
> **Klasifikasi**: Evaluasi Kelayakan & Blueprint Arsitektur  
> **Dokumen Terkait**: [Arsip Konsep Dasar](./archive/idea.md) | [Spesifikasi Mesh & Intercom](./spesifikasi-mesh-dan-intercom.md) | [Event Sourcing & Hierarki](./event-sourcing-dan-hierarki.md)

Dokumen ini merupakan evaluasi kritis terhadap arsitektur sistem **Sandya**, berfokus pada kelayakan (*feasibility*), mitigasi *race condition* logistik, penanganan limitasi transmisi visual, serta blueprint arsitektur data terdistribusi tanpa ketergantungan koneksi internet.

> [!NOTE]
> **Pembaruan & Spesifikasi Protokol Lanjutan:**
> Hasil konsensus lanjutan mengenai **Pemisahan Wewenang (Data Manusia vs Stok Logistik)**, **Zero-Touch BLE Mesh (Protokol BitChat Public Domain)**, **4 Saluran Intercom Lapangan & Push-to-Talk (PTT)**, serta **Poster Paritas XOR** didokumentasikan secara rinci di:
> [Spesifikasi Mesh & Intercom](./spesifikasi-mesh-dan-intercom.md) dan [Event Sourcing & Hierarki](./event-sourcing-dan-hierarki.md).

---

## 1. Ringkasan Kelayakan (Feasibility Summary)

* **Status Kelayakan**: **Sangat Layak (*Feasible*)**, dengan memadukan **Bluetooth Low Energy (BLE) Mesh Multi-Hop (BitChat Protocol)** sebagai jalur utama (*Primary Highway*) dan **Visual Air-Gapped Sneakernet (Animated QR & Poster Paritas)** sebagai jalur cadangan tangguh (*Ultimate Fallback*).
* **Tantangan Utama**: Mengelola konsistensi data (*eventual consistency*) tanpa koneksi internet saat sumber daya fisik bersifat terbatas (*zero-sum resources*) serta menghindari *scan fatigue* di lapangan.

```mermaid
graph TD
  subgraph Pos_A ["Posko Lapangan A (Offline)"]
  DB_A[(SQLite Lokal A)] --> Mesh_A["BitChat BLE Mesh Engine"]
  DB_A --> Fallback_A["Animated QR / Poster Paritas"]
  end

  subgraph Pos_B ["Posko Lapangan B (Offline)"]
  Mesh_B["BitChat BLE Mesh Engine"] --> DB_B[(SQLite Lokal B)]
  Fallback_B["Scan QR / Import Poster"] --> DB_B
  end

  Mesh_A <==>|Tier 1: Zero-Touch Multi-Hop BLE Mesh (TTL 7)| Mesh_B
  Fallback_A -.->|Tier 2: Air-Gapped Visual Sneakernet (Fallback)| Fallback_B
  DB_A -.->|Tier 3: Saat Ada Internet / Starlink Uplink| Cloud[(Sandya Central Cloud / BYOC)]
  DB_B -.->|Tier 3: Saat Ada Internet / Starlink Uplink| Cloud
```

---

## 2. Analisis Masalah Kritis & Solusi Rekayasa

### A. Masalah Race Condition pada Logistik & Alokasi Kebutuhan

#### Masalah: The Phantom Inventory Problem
Ketika beberapa posko yang sama-sama offline menyinkronkan data ketersediaan barang, timbul risiko **alokasi ganda (*double allocation*)**:
1. **Pos A** memiliki stok fisik beras **100 kg**.
2. **Pos B** memindai QR Pos A -> Mengetahui Pos A memiliki 100 kg beras.
3. **Pos C** memindai QR Pos A -> Mengetahui Pos A memiliki 100 kg beras.
4. **Kondisi Terisolasi (Offline)**:
   * Pos B menjanjikan/mengalokasikan **60 kg** dari Pos A ke pengungsinya.
   * Pos C menjanjikan/mengalokasikan **60 kg** dari Pos A ke pengungsinya.
   * Pos A sendiri membagikan **50 kg** beras langsung di poskonya.
5. **Dampak**: Total klaim = $60 + 60 + 50 = \mathbf{170\text{ kg}}$ dari ketersediaan fisik yang hanya **100 kg**.

#### Solusi Arsitektur:
1. **Prinsip Single-Writer per Stok Fisik**:
   * Pos luar **dilarang memotong atau mengklaim stok** milik pos lain secara sepihak dalam kondisi offline.
   * Pos luar hanya diizinkan membuat entri berstatus **`REQUEST` (Permintaan Kebutuhan)**, bukan langsung mengurangi stok.
   * Pemotongan stok resmi hanya sah dilakukan oleh **Pos Pemilik Fisik Barang** melalui bukti serah terima (*Handshake 2 Arah*).
2. **Event-Sourced Transaction Ledger (Buku Kas Transaksi)**:
   * Jangan menyimpan angka mutlak yang bisa ditimpa (*overwrite*).
   * Gunakan log transaksi *append-only* dengan timestamp logis (*Lamport Timestamp / Vector Clock*):
   ```text
   [TX_001] POS_A | RESTOCK    | Beras | +100 kg | Ver: 1
   [TX_002] POS_A | DISTRIBUSI | Beras | -20 kg  | Ver: 2 | Ref: Pengungsi_Group_1
   [TX_003] POS_B | PERMINTAAN | Beras |  30 kg  | Ver: 1 | Status: PENDING
   ```

---

### B. Limitasi Kapasitas QR Code (Data Density Bottleneck)

#### Masalah: Ukuran Data Melebihi Batas QR Code
* Standar QR Code Versi 40 (ukuran maksimal) dengan level koreksi *Low* hanya mampu menampung maksimum **~2.9 KB (biner)** atau **~4.200 karakter teks**.
* Data 100 pengungsi lengkap dengan riwayat kesehatan dan kebutuhan demografi dalam format JSON mentah berukuran **50 KB - 200 KB**, sehingga **mustahil dimuat dalam 1 QR code statis**.

#### Solusi Rekayasa:
1. **Sinkronisasi Inkremental (*Delta Sync / Diff Only*)**:
   * QR Code tidak mengekspor seluruh database pos, melainkan hanya log perubahan (*changelog*) sejak timestamp sinkronisasi terakhir.
2. **Serialisasi Biner & Kompresi**:
   * Ubah data JSON ke format biner terpadat **Bit-Packing Ultra-Dense v4**, lalu kompres dengan **Zstandard (Zstd) / Deflate** sebelum dikodekan ke QR. Reduksi ukuran mencapai **$\approx 90\%$**.
3. **Animated Dynamic Multipart QR (Moda Layar)**:
   * Data besar dipecah menjadi fragmen dinamis (*chunks* $\approx 1.2\text{ KB}$).
   * Layar pengekspor menampilkan QR code berganti-ganti secara otomatis (6 FPS loop), lalu kamera pemindai menangkap stream video dan langsung selesai begitu seluruh fragmen terkumpul.
4. **Poster Multi-QR Paritas XOR (Moda Cetak Fisik)**:
   * Data dicetak dalam bentuk Grid 4-8 QR monokrom dengan redundansi Paritas XOR sehingga kebal terhadap sobekan kertas poster.
5. **Fallback Jalur Transfer Offline Non-Visual**:
   * Sediakan ekspor file terenkripsi `.sandya` melalui **Wi-Fi Direct / Local Hotspot / Bluetooth Low Energy (BLE) / USB OTG**.

---

### C. Duplikasi Identitas Pengungsi (Identity Collision)

#### Masalah: Pengungsi Berpindah Pos & Terdata Berulang
* Pengungsi bernama "Budi" berpindah dari Pos A ke Pos B.
* Di Pos A tercatat belum menerima bantuan selimut; di Pos B didata ulang sebagai entitas baru dan meminta selimut lagi.
* Saat Pos A dan Pos B digabungkan, sistem dapat mengalami anomali apakah "Budi" adalah satu orang atau dua orang berbeda.

#### Solusi:
1. **Global Unique Identifier (UUIDv7)**:
   * Format UUID berbasis waktu dan identitas node/pos (`timestamp_ms + pos_id + random`).
2. **Primary Key Berbasis NIK / Biometrik**:
   * NIK/No KK sebagai kunci identitas utama jika tersedia.
   * Jika tidak membawa identitas resmi, gunakan *Fuzzy Matching Hash* lokal:
   $$\text{Hash} = \text{SHA256}(\text{Nama Lengkap Sanitasi} + \text{Tahun Lahir} + \text{Jenis Kelamin})$$
3. **Siklus Hidup Bantuan (*Fulfillment Lifecycle*)**:
   $$\text{DIBUTUHKAN} \longrightarrow \text{DIALOKASIKAN} \longrightarrow \text{DISERAHKAN} \longrightarrow \text{DITERIMA}$$
   Setiap perubahan status wajib mencantumkan `pos_id` dan `petugas_id`.

---

### D. Integritas & Keamanan Data (Tampering & Trust Verification)

#### Masalah: Risiko Injeksi Data Fiktif antar Organisasi
* Dalam kondisi darurat, pihak tidak berwenang dapat membuat QR palsu untuk merekayasa lonjakan kebutuhan bantuan logistik.

#### Solusi:
1. **Digital Signature (Kriptografi Asimetris Ed25519)**:
   * Setiap pos/petugas memiliki pasangan kunci (*keypair*) publik-privat yang dibuat saat inisialisasi pos.
   * Setiap payload ekspor ditandatangani secara kriptografis:
   $$\text{Signature} = \text{Sign}_{\text{PrivKey}}(\text{Payload})$$
   * Saat pos lain memindai QR, aplikasi memvalidasi tanda tangan tersebut menggunakan *PublicKey* terdaftar untuk menjamin data belum dimanipulasi.

---

## 3. Matriks Perbandingan Desain

| Dimensi | Desain Konvensional / Naif | Desain Tangguh (Sandya) |
| :--- | :--- | :--- |
| **Model Data** | Snapshot State (`stok: 50`) | **Event-Sourced Ledger (Append-Only TX Logs)** |
| **Izin Mutasi Stok** | Siapa saja boleh mengubah stok | **Single-Writer** (Hanya Pos Pemilik Barang) |
| **Jalur Utama Transfer** | Manual Scan QR Berulang (Scan Fatigue) | **Zero-Touch BLE Mesh (BitChat Protocol Multi-Hop TTL 7)** |
| **Jalur Cadangan Transfer** | Tidak ada cadangan | **Animated Multipart QR (Layar) + Poster Paritas XOR (Kertas)** |
| **Komunikasi Lapangan** | Bergantung sinyal seluler / pulsa | **Tactical Field Intercom (4 Saluran: #all, #medis, #logistik, #sos) + Push-to-Talk (PTT)** |
| **Resolusi Konflik** | Last-Write-Wins (LWW) Timpa data | **Vector Clock / Lamport Causal Ordering** |
| **Otentikasi Data** | Tanpa verifikasi integritas | **Ed25519 Signature + Noise Protocol XX E2EE** |

---

## 4. Rekomendasi Stack & Alur Implementasi

```text
[ Frontend: Next.js 16 + React 19 + Tailwind CSS v4 ]
  │
  IPC Invoke / Commands & Events
  ▼
[ Native Core: Tauri v2 (Rust Backend Bridge) ]
  ├── SQLite Local Database (rusqlite / tauri-plugin-sql)
  ├── Cryptographic Engine (Ed25519 + Noise Protocol XX)
  ├── Ultra-Dense Bitpacker v4 & Audio Codec (Opus 3.2 kbps)
  └── Native Mobile Mesh Plugin (Tauri v2 Mobile Bridge):
      ├── Android: BitChat Core (BluetoothMeshService.kt + MeshForegroundService.kt)
      ├── iOS: BitChat Core (BluetoothMeshService.swift)
      └── Hardware: Camera Scanner, WebAudio PTT, Local Notifications
```

Dokumen ini menjadi acuan spesifikasi teknis untuk pengembangan modul data, sinkronisasi *offline-first*, komunikasi taktis lapangan, dan modul logistik di Sandya.
