### 🌟 Sandya Humanitarian Platform Release __TAG__

Sistem Operasi Manajemen Tanggap Darurat Bencana Mandiri (Local-First & Offline-Mesh Ecosystem).

---

### 📦 Paket Instalasi Resmi Lintas-Platform
Unduh paket binary sesuai sistem operasi perangkat posko atau ponsel relawan:
- 🐧 **Linux**: Berkas `.AppImage` (siap pakai tanpa root) & `.deb` (Debian / Ubuntu)
- 🪟 **Windows**: Berkas `sandya_x64-setup.exe` (NSIS Installer 64-bit)
- 🍎 **macOS**: Berkas `.dmg` (Universal Binary: Apple Silicon M1/M2/M3/M4 & Intel)
- 🤖 **Android**: Berkas `.apk` mandiri (arsitektur ARM64, ARMv7, x86_64)
- 📱 **iOS**: Paket bundle aplikasi iOS mandiri (`sandya-ios-build.zip`)

---

### 📋 Ringkasan Perubahan & Fitur (Changelog)

#### 🏛️ Arsitektur Inti & Local-First
- **Local-First SQLite & Event Sourcing**: Arsitektur persistensi lokal dengan rantai audit kausal yang tidak dapat diubah (*immutable*).
- **Pembersihan Zero-Mock**: Pembersihan data tiruan/mock di seluruh store dan repositori untuk integritas produksi lapangan.
- **Sinkronisasi Multi-Level**: Pipa sinkronisasi Local SQLite ke Cloud Supabase dengan deduplikasi 4 lapis.

#### 📡 Tactical Mesh & Transpor Sinkronisasi Tanpa Internet
- **BLE Mesh SMP v1**: Transpor Bluetooth Low Energy offline dengan frame Ed25519 dan deduplikasi LRU cache $O(1)$.
- **Dynamic Parity Poster**: Rekonstruksi data utuh meskipun kertas cetak QR robek atau kotor berbasis kode Reed-Solomon/Paritas.
- **Animated QR Codec**: Streaming transfer data layar-ke-layar dengan verifikasi integritas CRC16.
- **Intercom Taktis & PTT**: Transmisi audio Push-to-Talk 5 detik, 4 kanal operasi darurat, dan tombol sirene darurat SOS.

#### 📦 Manajemen Logistik Posko & Resiliensi Bantuan
- **Single-Writer Inventory**: Pencegahan konflik stok gudang darurat dan pencatatan audit logistik per posko.
- **Distribusi Ad-Hoc & Anti-Penimbunan**: Proteksi pembagian bantuan dengan aturan verifikasi jeda 72 jam.
- **Kalkulator Ketahanan SPHERE / BNPB**: Peringatan otomatis estimasi habis stok logistik berbasis demografi pengungsi.

#### 🏥 Triase Medis & Reuni Keluarga Terpisah
- **Triase START 4-Warna**: Klasifikasi klinis darurat (Hijau, Kuning, Merah, Hitam) dan pencatatan riwayat penanganan.
- **Pencarian Kerabat Terpisah**: Indeks nama fonetik dan pencarian cepat warga antar-posko pengungsian.
- **Resolusi Jenazah**: Tata kelola khusus pengungsi berstatus wafat untuk administrasi kepolisian dan pemakaman.

#### 🛡️ Keamanan & Akses Terkontrol
- **RBAC Bertingkat (7 Peran)**: Pengawalan ketat berbasis izin peran (Pimpinan Lembaga, Koordinator Misi, Kepala Posko, Dokter, Logistik, Relawan Lapangan, Warga/Tamu).
- **Kredensial Kartu Tugas**: Penerbitan Kartu Peran QR terenkripsi dengan seed phrase BIP-39 12 kata sandi.

#### 🌐 Landing Page & Hub Unduhan Cerdas
- **Web Landing Page & App Gateway**: Pemisahan otomatis antara antarmuka web informasi publik dengan gerbang operasional posko di dalam Tauri runtime.
- **Smart Download Hub**: Deteksi otomatis sistem operasi pengunjung dan tautan unduhan langsung ke rilis GitHub.

---
*Dibangun otomatis oleh GitHub Actions Pipeline (Multi-Runner: Ubuntu, Windows, macOS).*
