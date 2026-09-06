# ADR 0001: Arsitektur Local-First, Zero-Touch BLE Mesh, & Single-Writer Ledger

- **Status**: Approved
- **Tanggal**: 2026-09-06
- **Pengambil Keputusan**: Tim Rekayasa Sandya (Unta Open Source)

## Konteks & Masalah
Di zona bencana alam (gempa bumi, banjir bandang, erupsi, karhutla), infrastruktur telekomunikasi seluler, listrik, dan internet umumnya putus total (*blackout*). Sementara itu, ratusan relawan dari puluhan lembaga berbeda tiba di lapangan dan harus mendata ribuan pengungsi, memeriksa kondisi medis, serta menyalurkan bantuan logistik secara cepat tanpa saling tumpang tindih.

Ketergantungan pada server cloud terpusat atau akun daring konvensional (email/password/OAuth) terbukti gagal di medan bencana karena tidak tersedianya sinyal internet. Di sisi lain, pertukaran data yang hanya mengandalkan pemindaian QR manual berulang kali menimbulkan kelelahan operasional (*scan fatigue*) bagi relawan.

## Keputusan Arsitektur
1. **Local-First Persistence**: Setiap perangkat smartphone relawan bertindak sebagai simpul mandiri (*autonomous node*) dengan basis data lokal (SQLite via Tauri native / IndexedDB di web) menggunakan model *Append-Only Event Sourcing*.
2. **Zero-Touch BLE Mesh Protocol (BitChat Foundation)**: Mengadopsi arsitektur radio Bluetooth Low Energy (BLE) Multi-Hop untuk pertukaran paket *Sandya Mesh Protocol (SMP v1)* di latar belakang tanpa menuntut intervensi manual pengguna.
3. **Kriptografi Asimetris Ed25519 untuk Kartu Tugas (Role Pass)**: Otorisasi dan pembagian peran lapangan dilakukan secara desentralisasi tanpa internet menggunakan QR bertanda tangan digital.
4. **Single-Writer Ledger untuk Logistik Fisik**: Menghindari *race condition* dan perebutan alokasi barang langka dengan menetapkan bahwa satu posko hanya memiliki satu otoritas mutasi saldo fisik (`PETUGAS_LOGISTIK`).
5. **Pertahanan Berlapis (Defense in Depth)**: Tetap menyiagakan *Animated Multipart QR* (6 FPS) dan *Poster Paritas XOR* cetak fisik sebagai saluran cadangan data mule jika radio Bluetooth bermasalah.

## Konsekuensi
- **Positif**:
  - Sistem dapat beroperasi 100% mandiri di pedalaman atau zona bencana terisolasi selama berminggu-minggu tanpa internet.
  - Sinkronisasi data antar-posko terjadi secara otomatis saat relawan saling berpapasan (Universal Data Mule).
  - Keamanan dan integritas data terjamin melalui verifikasi tanda tangan kriptografi Ed25519.
- **Tantangan**:
  - Membutuhkan manajemen konflik event sourcing dan rekonsiliasi Vector Clock yang ketat.
  - Pembatasan ukuran paket biner (MTU BLE ~469 byte) mengharuskan kompresi Ultra-Dense Bitpacking v4.
