# Pedoman Standar Solar Icons: Sandya

Dokumen ini mendefinisikan aturan resmi penggunaan **Solar Icons** pada seluruh antarmuka aplikasi Sandya.

---

##  Aturan Pembatasan Varian (Strict Rules)

1. **HANYA 2 VARIAN YANG DIIZINKAN**:
  - `linear`: Garis kontur stroke 1.5px (Default).
  - `bold`: Isian solid penuh (Penekanan & Status Aktif).
2. **DILARANG DIGUNAKAN (HARAM)**:
  - [FAIL] `bold-duotone`
  - [FAIL] `linear-duotone`
  - [FAIL] `broken`
  - [FAIL] `outline` (berbeda ketebalan)

---

##  Matriks Semantik Varian

```text
┌──────────────────────────────┬────────────────────────────────────────────────────────┐
│ VARIAN                       │ KAPAN DIGUNAKAN                                        │
├──────────────────────────────┼────────────────────────────────────────────────────────┤
│ LINEAR                       │ 1. Navigasi / Tab saat TIDAK AKTIF (Inactive state)    │
│ (Outline Stroke 1.5px)       │ 2. Ikon di dalam Form Input (Pencarian, Filter, Lokasi)│
│                              │ 3. Ikon Sekunder / Tabel / List Data Row               │
│                              │ 4. Tombol utilitas (Refresh, Copy, Back, Close)        │
├──────────────────────────────┼────────────────────────────────────────────────────────┤
│ BOLD                         │ 1. Navigasi / Tab saat SEDANG AKTIF (Active state)     │
│ (Solid Fill)                 │ 2. Tombol Utama Hero / Floating Action Button (FAB)    │
│                              │ 3. Peringatan Bahaya / Kritis ( Triase,  SOS)       │
│                              │ 4. Badge Status Terverifikasi / Konfirmasi Sukses      │
└──────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

##  Katalog Pemetaan Ikon Resmi (Official Mapping)

| Nama Semantik (`name`) | Solar Icon ID (`linear`) | Solar Icon ID (`bold`) | Peruntukan di Sandya |
| :--- | :--- | :--- | :--- |
| `home` | `solar:home-2-linear` | `solar:home-2-bold` | Tab Beranda Telemetri Posko |
| `users` | `solar:users-group-two-rounded-linear` | `solar:users-group-two-rounded-bold` | Tab Warga & Daftar Pengungsi |
| `user-plus` | `solar:user-plus-linear` | `solar:user-plus-bold` | FAB Pendaftaran Cepat (Fast Intake) |
| `health` | `solar:health-linear` | `solar:health-bold` | Triase Medis START & Rekam Kesehatan |
| `pill` | `solar:pill-linear` | `solar:pill-bold` | Resep Obat & Farmasi Lapangan |
| `box` | `solar:box-linear` | `solar:box-bold` | Tab Logistik & Stok Gudang |
| `delivery` | `solar:hand-stars-linear` | `solar:hand-stars-bold` | Distribusi Bantuan ke Tenda (Runner) |
| `waybill` | `solar:document-text-linear` | `solar:document-text-bold` | Surat Jalan Antar-Posko |
| `chat` | `solar:chat-round-line-linear` | `solar:chat-round-line-bold` | Tab Komunikasi Taktis 4 Saluran |
| `microphone` | `solar:microphone-2-linear` | `solar:microphone-2-bold` | Tombol Push-to-Talk (PTT) Suara |
| `radar` | `solar:radar-2-linear` | `solar:radar-2-bold` | Topologi Jaringan & RSSI Tetangga Mesh |
| `sync` | `solar:refresh-circle-linear` | `solar:refresh-circle-bold` | Tab Sinkronisasi Data & BLE Status |
| `qr-code` | `solar:qr-code-linear` | `solar:qr-code-bold` | Animated Dynamic Multipart QR |
| `printer` | `solar:printer-minimalistic-linear` | `solar:printer-minimalistic-bold` | Cetak Poster Paritas XOR |
| `sos` | `solar:danger-triangle-linear` | `solar:danger-triangle-bold` | Siaran Darurat Bahaya Lapangan |
| `shield` | `solar:shield-check-linear` | `solar:shield-check-bold` | Otorisasi Kriptografi Ed25519 |
| `search` | `solar:magnifer-linear` | `solar:magnifer-bold` | Input Pencarian & Temu Keluarga |
| `settings` | `solar:settings-linear` | `solar:settings-bold` | Pengaturan Posko & Organisasi |
| `pin` | `solar:map-point-linear` | `solar:map-point-bold` | Titik Lokasi Tenda & Koordinat GPS |
| `clock` | `solar:clock-circle-linear` | `solar:clock-circle-bold` | Timestamp & Event Sourcing Timeline |
| `check` | `solar:check-circle-linear` | `solar:check-circle-bold` | Status Konfirmasi & Selesai |
| `alert` | `solar:info-circle-linear` | `solar:info-circle-bold` | Banner Informasi & Warning |
