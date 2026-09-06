# 05 — UI Integration with useMeshSync, Radar Screen & Radio Fallback

**What to build:**  
Penyambungan menyeluruh antara `BleMeshEngine` dengan hook antarmuka `useMeshSync`, layar Radar Taktis (`/tactical/radar`), dan ruang Intercom Taktis (`/tactical`). Menampilkan sinyal radio nyata, indikator hemat energi, transisi status radio (`SCANNING`, `CONNECTED`, `RADIO_OFF`), dan panduan pengalihan (*fallback*) yang mulus ke mode visual (*Animated QR* / *Poster Paritas*) jika modul Bluetooth dinonaktifkan.

**Blocked by:**  
03 — Tactical Intercom Chat & PTT Audio Relay  
04 — Vector Clock Outbox Gossip & Data Mule Synchronization

**Status:** closed

## Acceptance Criteria
- [x] Menghubungkan hook `useMeshSync` dengan instance `BleMeshEngine` aktif, mengalirkan daftar `peers` dinamis dan event masuk secara reaktif ke Zustand store (`usePoskoStore`).
- [x] Layar Radar Taktis (`/posko/[poskoId]/tactical/radar`) menampilkan radar scanner riil dengan kartu rekan tim aktif di sekitar posko (nama alias, peran, RSSI, jarak, jalur hop) tanpa data hardcoded/mock.
- [x] Ruang Intercom Taktis (`/posko/[poskoId]/tactical`) mampu memutar rekaman PTT audio micro-suara masuk dan merender bentuk gelombang (*waveform*) 10-bar yang diterima dari simpul relawan lain.
- [x] Deteksi status Bluetooth: Jika radio tidak tersedia atau dimatikan oleh pengguna, UI menampilkan banner peringatan ramah (*"Bluetooth Dinonaktifkan"*) dengan tombol pintas ke *Animated QR* dan *Poster Paritas*.
- [x] Memastikan 100% kepatuhan aturan *Zero Dummy*: tidak ada fallback teks statis ("Posko 01") atau data rekaan yang tertinggal.
