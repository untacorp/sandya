# Audit Kritis & Rencana Remediasi Arsitektur Bluetooth Low Energy (BLE) Mesh Sandya

## 1. Ringkasan Eksekutif & Temuan Masalah (*Executive Summary*)

Berdasarkan audit mendalam (*deep-dive code & architectural review*) pada seluruh repositori Sandya, ditemukan **14 titik kegagalan kritis (*missed implementations / flaws*)** pada protokol BLE Mesh, mulai dari lapisan Core Logic, Execution Transport, Frontend UX, Kompatibilitas Hardware/OS, hingga integrasi dengan basis data SQLite perangkat.

```
                           PETA TITIK KELEMAHAN BLE MESH SANDYA
 ┌──────────────────────────────────┐        ┌──────────────────────────────────┐
 │ 1. CORE DOMAIN & PROTOCOL        │        │ 2. TRANSPORT & NATIVE BRIDGE     │
 │ • MTU 31B vs Header 92B Mismatch │        │ • "Phantom BLE" (Hanya Simulasi) │
 │ • Vector Clock Reset saat Reload │ ────>  │ • PTT Codec Terputus dari UI     │
 │ • Multi-Device Seq Collision     │        │ • Cargo.toml Tanpa Crate BLE     │
 │ • node:crypto Crash di Browser   │        │ • Web Bluetooth Central-Only     │
 └─────────────────┬────────────────┘        └─────────────────┬────────────────┘
                   │                                           │
                   ▼                                           ▼
 ┌──────────────────────────────────┐        ┌──────────────────────────────────┐
 │ 3. OS & HARDWARE PERMISSION      │        │ 4. INTEGRASI DATABASE SQLITE     │
 │ • Izin Android 12+ Belum Ada     │        │ • events_outbox Tak Dikirim      │
 │ • Android Doze Mode Membunuh BLE │ ────>  │ • Paket Ingest Tak Tulis SQLite  │
 │ • iOS Background Mode Kosong     │        │ • mesh_sync_clocks Menganggur    │
 │ • Web Bluetooth Butuh User Modal │        │ • Zero-Touch Gossip Belum Hidup  │
 └──────────────────────────────────┘        └──────────────────────────────────┘
```

---

## 2. Analisis Kritis 14 Titik Kegagalan (*Root Cause & Vulnerabilities*)

### Kategori A: Alur Logika Core & Protokol (Core Protocol Flaws)

#### 1. Mismatch Ukuran Paket (Overhead Header 92 Byte vs MTU BLE Advertising 31 Byte)
- **Kondisi Saat Ini**: `SmpPacket` memiliki ukuran Header 28 Byte + Signature Ed25519 64 Byte = **92 Byte minimum overhead**.
- **Kelemahan Kritis**: Standar transmisi *broadcast advertisement* (BLE 4.0/4.2) hanya menyediakan total payload **31 Byte** (efektif ~24 Byte setelah dipotong AD Flags). Paket SMP v1 **pasti gagal dipancarkan** jika menggunakan *Legacy Advertising packets*.
- **Solusi**: 
  1. Untuk broadcast presence (*beaconing*), gunakan paket miniatur `SMP_TINY_BEACON` (16 Byte, tanpa full Ed25519 signature per detak, cukup short auth token).
  2. Untuk transmisi data penuh (`SYNC_DELTA_BATCH`, `VOICE_NOTE_FRAME`), gunakan **GATT Connection Oriented Channel (CoC)** atau **GATT Characteristic Streams** dengan *ATT MTU Exchange* (hingga 512 Byte).

#### 2. Vector Clock Menguap (*Ephemeral In-Memory Loss*)
- **Kondisi Saat Ini**: [`src/core/mesh/vector-clock.ts`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/core/mesh/vector-clock.ts) hanya menyimpan clock di dalam memori RAM (`new Map<string, PoskoClockState>()`).
- **Kelemahan Kritis**: Setiap kali aplikasi di-*refresh*, berpindah halaman, atau HP mati, seluruh vector clock kembali ke `0`. Akibatnya, sistem akan meminta ulang seluruh data historis dari awal (*full re-sync*) setiap kali bertemu node tetangga.
- **Solusi**: Persistensikan state vector clock ke tabel SQLite `mesh_sync_clocks` lokal dan localStorage.

#### 3. Tabrakan Nomor Urut Multi-Petugas (*Sequence Collision per Posko*)
- **Kondisi Saat Ini**: `VectorClockTracker` hanya mengindeks `poskoId` sebagai kunci clock (`{ 'POS-01': 45 }`).
- **Kelemahan Kritis**: Di Posko 01, terdapat 5 relawan berbeda yang mendata warga secara bersamaan saat offline. Jika Relawan X dan Relawan Y sama-sama memulai dari seq 40, keduanya akan menghasilkan `logical_seq = 41` untuk pengungsi yang berbeda. Model ini merusak konsistensi saat di-*merge*.
- **Solusi**: Kunci vector clock harus berupa komposit: `poskoId:authorId` (atau `deviceId`), dipadukan dengan *Lamport Logical Clock* atau *UUIDv7 Causal Chaining*.

#### 4. Ketergantungan `node:crypto` yang Merusak Runtime Browser
- **Kondisi Saat Ini**: [`src/core/mesh/seen-cache.ts`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/core/mesh/seen-cache.ts) mengimpor `createHash` dari modul Node.js `node:crypto`.
- **Kelemahan Kritis**: Saat dieksekusi di lingkungan browser atau WebView Android/iOS, pemanggilan `node:crypto` menyebabkan runtime crash (*Uncaught ReferenceError: process/crypto is not defined*).
- **Solusi**: Gunakan implementasi hash murni isomorfik (misal hashing berbasis string/FNV-1a/MurmurHash3 atau Web Crypto API `crypto.subtle`).

#### 5. Overflow Sequence Number (uint16 Rollover)
- **Kondisi Saat Ini**: Kolom `sequence` pada header SMP v1 bertipe `uint16` (maks 65.535).
- **Kelemahan Kritis**: Dalam operasi tanggap darurat besar dengan puluhan ribu log mutasi dan ribuan pesan PTT, angka 65.535 akan tercapai dalam beberapa hari, menyebabkan rollover ke 0 dan memicu salah deteksi *replay attack*.
- **Solusi**: Gunakan windowed sequence number (`uint32` untuk global sequence atau monotonic counter per epoch).

---

### Kategori B: Eksekusi & Transport Layer (Execution & Native Bridge Gaps)

#### 6. "Phantom BLE" (Implementasi Semu di Lapangan)
- **Kondisi Saat Ini**: [`src/features/posko/hooks/use-mesh-sync.ts`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/features/posko/hooks/use-mesh-sync.ts) hanya menjalankan `setInterval` 15 detik yang memanggil `simulateSync()`. Fungsi `simulateSync()` hanya mereset counter state in-memory `pendingOutboxCount = 0`.
- **Kelemahan Kritis**: **Tidak ada satu pun byte data yang benar-benar dikirimkan melalui gelombang radio Bluetooth**.
- **Solusi**: Bangun *Transport Abstraction Layer* yang menghubungkan hook React dengan modul radio nyata:
  - **Tier 1 (Tauri Native Mobile)**: Bridge JNI Android `BluetoothLeScanner`/`Advertiser` & CoreBluetooth iOS.
  - **Tier 2 (Web Browser)**: Web Bluetooth GATT fallback / Local WebRTC BroadcastChannel.
  - **Tier 3 (Optical/Physical)**: Animated QR & Poster Paritas (yang sudah berjalan 100%).

#### 7. Putusnya Integrasi PTT Audio dengan Lapisan BLE Frame
- **Kondisi Saat Ini**: Modul [`src/core/audio/ptt-codec.ts`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/core/audio/ptt-codec.ts) (`PttVoiceCodec.splitPttToBleFrames`) diuji di unit test, tetapi di halaman [`tactical/page.tsx`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/app/posko/%5BposkoId%5D/tactical/page.tsx), rekaman suara dari `MediaRecorder` langsung dikonversi menjadi base64 string utuh (`data:audio/webm;base64,...`) dan dikirim lewat Cloud REST API.
- **Kelemahan Kritis**: PTT offline tidak dapat berjalan tanpa internet karena frame splitting BLE tidak pernah dipanggil di halaman UI.
- **Solusi**: Integrasikan `PttVoiceCodec` ke dalam `useAudioRecorder` dan saluran transmisi mesh lokal.

---

### Kategori C: Kompatibilitas Sistem Operasi & Izin Akses Hardware (OS & Hardware Constraints)

#### 8. Batasan Keras Web Bluetooth API (Browser Mode)
- **Kelemahan Kritis**:
  - Web Bluetooth API di browser (Chrome/Edge) **TIDAK MENDUKUNG Peripheral Mode (Advertising)**. Browser hanya bisa menjadi Central (Scanner/Client).
  - Web Bluetooth mewajibkan interaksi pengguna (*user gesture modal picker*) setiap kali ingin tersambung ke perangkat baru. Sifat *Zero-Touch Background Discovery* **mustahil berjalan di browser murni**.
- **Solusi**: Berikan indikator arsitektur yang jelas:
  - Pada browser web desktop/laptop: Gunakan mode **Mesh Simulator / WebRTC Local Network / Animated QR**.
  - Pada aplikasi mobile (Android/iOS via Tauri v2): Gunakan **Native Background BLE Mesh Daemon**.

#### 9. Ketiadaan Deklarasi Izin Android 12+ & Android Doze Mode
- **Kondisi Saat Ini**: Di `src-tauri`, belum ada deklarasi izin runtime Android pada `AndroidManifest.xml`.
- **Kelemahan Kritis**:
  - Di Android 12+ (API 31+), pemindaian Bluetooth tanpa izin `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, dan `BLUETOOTH_CONNECT` akan langsung melempar `SecurityException` dan aplikasi crash.
  - Saat layar HP mati atau masuk saku, **Android Doze Mode** akan mematikan radio BLE setelah 3 menit kecuali dijalankan di dalam `ForegroundService` dengan notifikasi `FOREGROUND_SERVICE_CONNECTED_DEVICE`.
- **Solusi**: Tambahkan izin Android lengkap dan rancang *Foreground Service Architecture*.

#### 10. Ketiadaan Deklarasi Izin iOS CoreBluetooth
- **Kelemahan Kritis**: iOS menolak akses Bluetooth jika `NSBluetoothAlwaysUsageDescription` dan `NSBluetoothPeripheralUsageDescription` tidak terdaftar di `Info.plist`. Selain itu, iOS mematikan background advertising jika `UIBackgroundModes: ["bluetooth-central", "bluetooth-peripheral"]` tidak dideklarasikan.
- **Solusi**: Konfigurasikan `Info.plist` dan kemampuan background execution iOS.

---

### Kategori D: Hubungan dengan Database Perangkat (SQLite & Event Sourcing)

#### 11. Ketiadaan Pipeline Ingest Paket Mesh ke SQLite
- **Kondisi Saat Ini**: Sandya memiliki repository SQLite yang sangat baik (`SqliteRefugeeRepository`, `SqliteInventoryRepository`, `SqliteOutboxRepository`). Namun, saat paket `SYNC_DELTA_BATCH` diterima melalui mesh, **tidak ada dispatcher/worker yang mengurai payload dan menyimpannya ke SQLite**.
- **Solusi**: Buat use case `IngestMeshPacketUseCase` yang memvalidasi Ed25519 signature, memfilter duplikat via `LruSeenCache`, mendekode bitpacking v4, dan mengeksekusi transaksi atomik ke SQLite lokal.

#### 12. Rekonsiliasi Status Outbox yang Terputus
- **Kondisi Saat Ini**: Jika event berhasil disinkronkan ke HP rekan lewat BLE, status event di `events_outbox` lokal tidak diperbarui karena outbox repo hanya dihubungkan ke `CloudSyncService`.
- **Solusi**: Tandai outbox sebagai `MESH_GOSSIPED` saat menerima `SYNC_ACK` dari tetangga mesh.

---

### Kategori E: Frontend UX & Human Factors

#### 13. Daftar Rekan (*Peers*) Berbasis Data Sejarah (Bukan Deteksi Nyata)
- **Kondisi Saat Ini**: Di [`use-posko-store.ts`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/features/posko/store/use-posko-store.ts) (`deriveActivePeers`), daftar petugas yang terhubung dihitung dari siapa saja yang pernah mengirim chat atau mutasi logistik beberapa jam lalu.
- **Kelemahan Kritis**: Jika seorang relawan mematikan HP-nya, kartu "Petugas Terhubung" tetap menampilkan HP relawan tersebut sebagai "Sangat Dekat (< 15m)" hingga waktu timeout panjang habis.
- **Solusi**: Pisahkan konsep **Historical Activity** dengan **Live Radio Presence (Heartbeat Beacons)**.

#### 14. Ketiadaan Indikator Hardware Bluetooth di UI
- **Kondisi Saat Ini**: UI selalu menampilkan status `Aktif` berwarna hijau di halaman Sync dan Tactical, meskipun Bluetooth di perangkat fisik pengguna sedang dimatikan (*Bluetooth Disabled*).
- **Kelemahan Kritis**: Petugas mengira data mereka sedang disinkronkan, padahal radio Bluetooth perangkat dalam keadaan mati.
- **Solusi**: Tambahkan deteksi status radio Bluetooth fisik (`BLUETOOTH_OFF`, `PERMISSION_REQUIRED`, `SCANNING`, `MESH_CONNECTED`).

---

## 3. Rencana Tindakan & Strategi Implementasi (*Remediation Strategy*)

### Tahap 1: Perbaikan Core Mesh Logic (Type-Safe & Isomorphic)
1. **Isomorphic Hashing**: Ubah `LruSeenCache` agar menggunakan algoritma hash murni yang 100% aman di semua runtime (Node.js, Browser, WebView).
2. **Persistent Vector Clocks**: Hubungkan `VectorClockTracker` dengan persistensi storage lokal (`mesh_sync_clocks`).
3. **Multi-Author Compound Clock Keys**: Format kunci clock menjadi `poskoId:authorId` untuk mencegah tabrakan sequence antar-relawan di posko yang sama.
4. **Header & Packet Spec Optimization**:
   - Definisikan `SmpBeaconPacket` padat (16B) untuk *Presence Broadcasting*.
   - Pisahkan payload besar ke *GATT Characteristic Stream* dengan segmentasi frame yang aman.

### Tahap 2: Pembangunan Ingestion Pipeline ke SQLite Lokal
1. Buat [`src/core/use-cases/sync/ingest-mesh-packet.usecase.ts`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/core/use-cases/sync/ingest-mesh-packet.usecase.ts):
   - Verifikasi Tanda Tangan Digital Ed25519.
   - Filter duplikasi paket via `LruSeenCache`.
   - Update Vector Clock lokal.
   - Parsing payload Ultra-Dense Bitpacking v4.
   - Transaksi atomik simpan ke SQLite lokal (`refugees`, `refugee_events`, `inventory_transactions`).
   - Emit event untuk update UI seketika (*reactive invalidation*).

### Tahap 3: Perbaikan Hook & Frontend UX
1. **Hook `useMeshSync`**:
   - Gantikan pemanggilan `simulateSync()` dummy dengan pipeline pertukaran *Vector Clock Probe* nyata.
   - Implementasikan *Loopback / WebRTC BroadcastChannel / Peer Bridge* agar antartab browser atau perangkat dalam jaringan lokal dapat saling bertukar data mesh tanpa internet.
2. **Indikator Status Bluetooth Nyata**:
   - Tambahkan deteksi status Bluetooth di UI (`Aktif`, `Memindai`, `Bluetooth Dimatikan`, `Izin Ditolak`).
   - Tampilkan peringatan jika Bluetooth perangkat belum dihidupkan.
3. **Integrasi Voice PTT Frame**:
   - Hubungkan rekaman suara PTT ke `PttVoiceCodec` untuk memecah suara menjadi potongan frame audio biner berdurasi maks 5 detik.

### Tahap 4: Konfigurasi Izin Native Mobile (Tauri v2 Android & iOS)
1. **Android Manifest & Capabilities**:
   - Tambahkan izin `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT`, dan `ACCESS_FINE_LOCATION` pada konfigurasi Tauri mobile.
2. **iOS Info.plist**:
   - Tambahkan `NSBluetoothAlwaysUsageDescription` dan deskripsi izin Bluetooth.

---

## 4. Rencana Verifikasi & Uji Otomasi

```bash
# 1. Jalankan Unit Test Protokol BLE Mesh & Ingestion Pipeline
pnpm test:unit

# 2. Jalankan Uji Integrasi Mesh Sync & Real-Time Presence
pnpm test:integration

# 3. Jalankan Pengujian Isomorphic Cache & Vector Clock
tsx tests/unit/ble-mesh-protocol.test.ts

# 4. Verifikasi Build Produksi
pnpm build
```

---

> [!NOTE]
> Rencana remediasi di atas dirancang untuk menutup seluruh celah teoritis maupun eksekusi teknis pada subsistem BLE Mesh Sandya, memastikan sistem memiliki fondasi nyata untuk pertukaran data tanpa internet (*true offline-first zero-touch synchronization*).
