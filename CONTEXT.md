# Sandya — Ubiquitous Language & Domain Glossary

Dokumen ini adalah kamus istilah resmi (*Ubiquitous Language*) sistem **Sandya**, platform manajemen tanggap darurat bencana terdesentralisasi berbasis *Local-First*, *BLE Mesh*, dan *Ed25519 Cryptography*.

---

## 1. Hierarki Tata Kelola 3-Tingkat

1. **Organisasi / Lembaga (Level 1)**:
   - Entitas permanen berbadan hukum (misalnya PMI Cianjur, BPBD Jawa Barat, Kitabisa, Relawan Mandiri).
   - Memegang **Master Authority Key (Ed25519)** dan 12-Word Emergency Seed Phrase.
   - Mengontrol konfigurasi cloud (Managed Hub / Self-Hosted BYOC) dan membuka Misi Bencana baru.
   - **Akses**: Tertutup ketat khusus peran `PEMIMPIN_ORGANISASI`.

2. **Misi / Operasi Bencana (Level 2)**:
   - Operasi penanganan darurat dengan masa waktu tertentu (misalnya *Tanggap Darurat Gempa Cugenang 2026*, *Karhutla Kalimantan 2026*).
   - Menghubungkan seluruh posko, titik tenda, dan gudang sentral logistik wilayah.
   - **Akses**: *Situational Awareness Hub* terbuka (`/missions/[id]`). Semua relawan dan petugas posko dapat melihat peta situasi, kebutuhan medis, dan ringkasan ketersediaan stok posko lain dalam mode *Read-Only*.

3. **Posko Taktis Lapangan (Level 3)**:
   - Titik fisik operasional di lapangan (misal: *Posko Tenda RW 03 Cijedil*, *Gudang Logistik GOR Pacet*).
   - Tempat pencatatan Fast Intake warga 30s, Triase Medis START, mutasi stok fisik di gudang posko, dan komunikasi radio taktis.
   - **Akses**: Area kerja petugas yang ditugaskan melalui pemindaian Kartu Tugas (Role Pass QR).

---

## 2. Taksonomi 4 Peran Inti & Model RBAC

| Peran | Kode Teknis | Wewenang Klinis | Wewenang Mutasi Stok Fisik | Akses Intercom BLE |
| :--- | :--- | :---: | :---: | :---: |
| **Koordinator Posko** | `KOORDINATOR_POSKO` | Audit | Audit Agregat | Penuh (`#posko-all`, `#sos`, DM) |
| **Petugas Medis** | `PETUGAS_MEDIS` | **Penuh (START & Resep)** | Tiket Kebutuhan Farmasi | `#medis` & `#sos` |
| **Petugas Logistik** | `PETUGAS_LOGISTIK` | Ditolak | **Penuh (Single-Writer)** | `#logistik` & `#sos` |
| **Relawan Lapangan** | `RELAWAN_LAPANGAN` | Ditolak | Penyerahan Fisik Saja | `#posko-all` & `#sos` |
| **Pemimpin Organisasi** | `PEMIMPIN_ORGANISASI` | Audit Penuh | Audit Penuh | Penuh |
| **Komandan Misi** | `KOMANDAN_MISI` | Audit Wilayah | Alokasi Antar-Posko | Penuh |
| **Warga / Tamu Publik** | `PUBLIC_GUEST` | Ditolak | Ditolak | **Ditolak Total (Muted)** |

---

## 3. Mekanisme Komunikasi & Sinkronisasi

- **Role Pass QR**: Kartu tugas bertanda tangan digital Ed25519 (`SANDYA_PASS_V1:...`). Mengaktifkan hak akses petugas di HP relawan secara instan tanpa perlu akun, kata sandi, maupun jaringan internet.
- **Manual Backup Code**: Kode alfanumerik ringkas (`SAN-[ROLE]-[POSKO]-[USER]`) sebagai cadangan jika lensa kamera HP pecah atau rusak di reruntuhan bencana.
- **Single-Writer Ledger**: Aturan konsistensi data di mana hanya satu peran (`PETUGAS_LOGISTIK`) yang memiliki hak mutasi terhadap saldo stok fisik komoditas di satu posko, mencegah *race condition* dan konflik saldo negatif.
- **Sandya Mesh Protocol (SMP v1)**: Protokol framing paket biner nirkabel berbasis BitChat v2 melalui Bluetooth Low Energy (BLE) Multi-Hop dengan Time-To-Live (TTL), deduplikasi LRU Seen-Cache $O(1)$, dan rekonsiliasi Vector Clock.
- **Tactical Intercom**: Radio lapangan terdistribusi 4 saluran darurat (`#posko-all`, `#medis`, `#logistik`, `#sos`) dilengkapi Push-to-Talk (PTT) suara micro-audio 5 detik.
- **Fast Mobile Intake (30 Detik)**: Pendataan cepat pengungsi di tenda darurat dengan dukungan *Null-Bypass* (warga tetap dapat didata meski NIK/KTP hilang atau terbakar).
- **Temu Keluarga Offline**: Algoritma rekonsiliasi graf pencocokan nama keluarga terpisah secara asinkron multi-posko berbasis Levenshtein distance dan token deterministik.
- **Animated Multipart QR**: Mekanisme transfer streaming visual layar-ke-layar (6 FPS) sebagai cadangan jika modul radio Bluetooth perangkat mati.
- **Poster Paritas XOR**: Cetak fisik lembar kertas rekap data posko dengan redundansi kode koreksi error paritas XOR (tahan sobekan 1 kotak dari 4).
