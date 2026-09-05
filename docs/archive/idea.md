# Konsep Dasar & Latar Belakang Masalah: Sandya

> **Status**: Dokumen Arsip Fondasi Konseptual  
> **Klasifikasi**: Problem Statement & Early Ideation Concept (Archived)  
> **Target Pengguna**: Pimpinan Lembaga, Koordinator Relawan, Petugas Medis, Petugas Logistik, Warga Pengungsi  
> **Dokumen Terkait**: [Analisis Arsitektur Sistem](../analisis-arsitektur.md) | [Tata Kelola Organisasi](../tata-kelola-organisasi-dan-kriptografi.md)

---

## 1. Latar Belakang Masalah di Lapangan Bencana

Saat bencana alam skala besar terjadi (gempa bumi, banjir bandang, erupsi gunung berapi), infrastruktur publik umumnya mengalami kelumpuhan total (*blackout* listrik dan jaringan telekomunikasi seluler terputus). Dalam situasi darurat tersebut, tim penolong menghadapi sejumlah tantangan operasional kritis:

1. **Silo Data Antar-Organisasi**: Berbagai lembaga kemanusiaan (BPBD, PMI, Basarnas, NGO, komunitas relawan mandiri) bergerak ke lokasi terdampak secara terpisah tanpa jalur komunikasi bersama.
2. **Redudansi & *Fatigue* Pendataan Pengungsi**: Warga pengungsi didata berulang kali oleh tim yang berbeda karena ketiadaan mekanisme pertukaran data lokal, sementara data yang terkumpul tidak dapat digabungkan tanpa akses server pusat.
3. **Ketiadaan Visibilitas Kebutuhan Nyata**: Bantuan logistik menumpuk pada posko tertentu yang mudah diakses, sedangkan posko terpencil mengalami krisis obat dan kebutuhan bayi karena permintaan bantuan tidak tersalurkan.
4. **Keluarga Terpisah Tanpa Informasi**: Anggota keluarga yang terpisah di posko-posko pengungsian berbeda tidak dapat saling melacak keberadaan akibat ketiadaan koneksi internet.

---

## 2. Visi & Prinsip Solusi Sandya

Sandya dirancang sebagai platform penanganan bencana terdesentralisasi (*offline-first disaster management system*) dengan prinsip kerja: **"Mendata secara terdistribusi di titik-titik terpencil, menyinkronkan secara mandiri tanpa internet, dan mengonsolidasi ke pusat komando saat konektivitas tersedia."**

```text
┌─────────────────────────────────────────────────────────────┐
│                    PRINSIP KERJA SANDYA                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Beroperasi 100% Mandiri Tanpa Internet di Level Posko    │
│ 2. Struktur Hierarki Bertingkat (Organisasi -> Misi -> Pos) │
│ 3. Pendataan Komprehensif (Warga, Medis, & Logistik)        │
│ 4. Pertukaran Data Visual & Nirkabel Lapangan (P2P Mesh/QR) │
│ 5. Eliminasi Redudansi Pendataan Antar-Organisasi           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Pilar Arsitektur Konseptual

### A. Struktur Tata Kelola Bertingkat (*Hierarchical Governance*)
Sistem mengorganisasikan alur operasional ke dalam unit-unit hierarkis:
* **Tingkat Organisasi (Lembaga)**: Wadah induk permanen (misalnya PMI, BPBD, atau Yayasan Kemanusiaan) yang mengelola lisensi otoritas dan kunci induk.
* **Tingkat Misi Bencana**: Periode tanggap darurat spesifik (misalnya *"Tanggap Darurat Gempa Cianjur 2026"*).
* **Tingkat Posko Lapangan**: Titik-titik fisik operasional di lapangan (posko tenda pengungsi, dapur umum, pos medis, atau gudang logistik).

### B. Pendataan Mandiri Tanpa Koneksi Internet
Setiap posko lapangan dapat langsung beroperasi seketika di perangkat smartphone atau komputer jinjing relawan untuk mencatat:
1. **Data Demografi Pengungsi**: Identitas warga, kelompok rentan (balita, ibu hamil, lansia, disabilitas), dan domisili asal.
2. **Kondisi Kesehatan & Triase Darurat**: Skrining kondisi vital, status triase awal, keluhan mendesak, dan kebutuhan obat rutin.
3. **Kebutuhan Mendesak Pengungsi**: Jenis dan kuantitas bantuan yang dibutuhkan warga tetapi belum terpenuhi.
4. **Ketersediaan & Mutasi Logistik**: Stok fisik barang di gudang posko yang siap didistribusikan.

### C. Mekanisme Sinkronisasi *Air-Gapped* & P2P Sneakernet
Untuk menyatukan data antar-posko yang sama-sama terisolasi dari internet:
* **Ekspor Visual (Animated QR & Poster Paritas)**: Data posko dipadatkan ke format biner terkompresi dan ditampilkan sebagai kode matriks visual di layar HP atau dicetak ke kertas poster serah terima.
* **Jalur Otomatis Bluetooth LE Mesh**: Perangkat relawan yang berdekatan saling bertukar data event delta secara otomatis di latar belakang (*Zero-Touch Gossip Sync*).
* **Kurir Data Bergerak (*Data Mule*)**: Relawan atau ambulans yang berpindah antar-posko membawa akumulasi data terbaru dan memperbarui posko tujuan secara instan saat tiba di lokasi.

### D. Interoperabilitas Antar-Organisasi
Ketika posko dari Organisasi B memindai data ekspor dari Posko Organisasi A:
* Data pengungsi langsung masuk ke basis data lokal Organisasi B tanpa perlu melakukan pendataan ulang dari awal.
* Tanda tangan digital kriptografis menjamin data tersebut otentik dan belum dimanipulasi oleh pihak luar.
* Sistem secara otomatis mencocokkan nama keluarga yang dicari (*Family Reunion*) lintas posko dan lintas organisasi.

---

## 4. Peta Spesifikasi Teknis Lanjutan

Konsep dasar ini telah dijabarkan ke dalam spesifikasi rekayasa teknis formal:

| Komponen Sistem | Dokumen Spesifikasi Resmi |
| :--- | :--- |
| **Mitigasi Race Condition & Kelayakan** | [Analisis Arsitektur Sistem](../analisis-arsitektur.md) |
| **Pemisahan Wewenang & Event Sourcing** | [Arsitektur Event Sourcing & Hierarki](../event-sourcing-dan-hierarki.md) |
| **Jaringan Radio & PTT Intercom** | [Spesifikasi Bluetooth LE Mesh & Intercom](../spesifikasi-mesh-dan-intercom.md) |
| **Protokol Transfer Layar & Poster** | [Spesifikasi Animated QR & Poster Paritas](../spesifikasi-transfer-animated-dan-poster.md) |
| **Kompresi Data Biner & Kamus** | [Kamus Bencana & Bit-Packing Ultra-Dense](../metode-transfer-dan-kamus-bencana.md) |
| **Tata Kelola & Kriptografi** | [Tata Kelola Organisasi & Kriptografi](../tata-kelola-organisasi-dan-kriptografi.md) |
| **Desain Antarmuka & Dashboard** | [Arsitektur UI & Navigasi Dashboard](../arsitektur-ui-dan-dashboard.md) |
