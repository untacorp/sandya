# Spesifikasi Protokol Transfer Data: Animated QR Dinamis & Poster Paritas

Dokumen ini mendefinisikan arsitektur resmi protokol transfer data visual offline pada sistem **Sandya**, yang mencakup dua moda adaptif:
1. **Moda Layar Digital (Screen-to-Screen)**: Menggunakan **Animated Dynamic Multipart QR** untuk transfer super cepat antar-perangkat HP relawan.
2. **Moda Cetak Fisik (Print/Paper Poster)**: Menggunakan **Poster Multi-QR dengan Paritas XOR** untuk serah terima posko yang ditinggalkan.

---

## 1. Moda Layar: Animated Dynamic Multipart QR

Moda ini digunakan saat relawan dari dua posko saling bertemu secara langsung di lapangan dan ingin memindahkan ribuan data pengungsi dari layar HP pengirim ke kamera HP penerima tanpa internet, bluetooth, atau kabel data.

```
┌─────────────────────────────────────────────────────────────┐
│          ALUR TRANSFER ANIMATED MULTIPART QR                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [ HP Pengirim ]                                           │
│   Data 1.000 Pengungsi (~11.7 KB)                           │
│   Dipotong dinamis menjadi 10 Frame (@1.17 KB)              │
│   Animasi berputar di layar (6 Frame per Detik / FPS):      │
│   Frame 1 -> Frame 2 -> Frame 3 -> ... -> Frame 10 (Loop)   │
│                                                             │
│   [ HP Penerima ]                                           │
│   Kamera diarahkan ke layar pengirim:                       │
│   • Detik 0.2: Tertangkap Frame 3/10 (Slot #3 terisi)       │
│   • Detik 0.4: Tertangkap Frame 5/10 (Slot #5 terisi)       │
│   • Detik 0.6: Tertangkap Frame 1/10 (Slot #1 terisi)       │
│   • ...                                                     │
│   • Detik 1.8: Tertangkap Frame 2/10 (SLOT LENGKAP 10/10)   │
│                                                             │
│    SELESAI INSTAN! HP bergetar (BZZT) & scan STOP detik itu│
│   tanpa perlu menunggu animasi di layar pengirim selesai!   │
└─────────────────────────────────────────────────────────────┘
```

### A. Rumus Pembagian Frame Dinamis (*Dynamic Chunking*)
Jumlah frame ($N$) **tidak pernah di-hardcode**, melainkan dihitung secara adaptif berdasarkan ukuran data:

$$\text{Jumlah Frame } (N) = \left\lceil \frac{\text{Total Byte Terkompresi}}{1.200\text{ Bytes}} \right\rceil$$

* Ukuran target per frame sengaja dipatok pada **$\approx 1.200\text{ Bytes}$** agar QR Code selalu berada di **Versi Rendah (Modul Tebal / Versi 24–28)**. Modul tebal menjamin kamera HP kelas bawah dapat mengunci fokus dengan cepat tanpa terganggu *motion blur* saat animasi berganti frame.

### B. Format Header Tiap Frame Animasi
Setiap frame QR menyertakan metadata 6-byte di awal payload:

```
┌────────────────────────────────────────────────────────────┐
│ [PayloadUUID: 2B] [PartIndex: 1B] [TotalParts: 1B] [CRC16] │
├────────────────────────────────────────────────────────────┤
│                       DATA BINER PART                      │
└────────────────────────────────────────────────────────────┘
```

1. **`PayloadUUID` (2 Bytes)**: ID unik sesi transfer untuk mencegah frame dari posko lain tercampur.
2. **`PartIndex` (1 Byte)**: Nomor urut frame ($0 \dots N-1$).
3. **`TotalParts` (1 Byte)**: Total frame dalam sesi tersebut ($N$).
4. **`CRC16` (2 Bytes)**: Checksum integritas potongan biner.

### C. Mekanisme Pemindaian Asinkron (*Out-of-Order Capture*)
* Begitu kamera menangkap **frame pertama mana pun** (misal Frame #4 dari 10), scanner langsung membaca `TotalParts: 10` dan mengalokasikan array penampung berisi 10 slot.
* Kamera menangkap frame-frame yang lewat secara acak. Frame yang sudah pernah tersimpan akan diabaikan (*deduplication*).
* **Kondisi Berhenti**: Saat seluruh $N$ slot terisi $\rightarrow$ Pemindaian **langsung berhenti (Haptic Vibration + Beep)** dan data digabungkan seketika.

### D. Skalabilitas Waktu Pemindaian di Layar:

| Jumlah Pengungsi | Ukuran Terkompresi | Jumlah Frame ($N$) | Waktu 1 Siklus Animasi | Estimasi Waktu Scan di Kamera |
| :--- | :--- | :---: | :---: | :---: |
| **200 Jiwa** | $\approx 2.5\text{ KB}$ | **2 Frame** | $0.33\text{ detik}$ | **$\approx 0.5 - 1\text{ detik}$** |
| **500 Jiwa** | $\approx 6.0\text{ KB}$ | **5 Frame** | $0.83\text{ detik}$ | **$\approx 1 - 2\text{ detik}$** |
| **1.000 Jiwa** | $\approx 11.7\text{ KB}$ | **10 Frame** | $1.66\text{ detik}$ | **$\approx 2 - 3\text{ detik}$** |
| **2.500 Jiwa** | $\approx 29.0\text{ KB}$ | **24 Frame** | $4.00\text{ detik}$ | **$\approx 4 - 6\text{ detik}$** |
| **5.000 Jiwa** | $\approx 58.0\text{ KB}$ | **48 Frame** | $8.00\text{ detik}$ | **$\approx 8 - 12\text{ detik}$** |

---

## 2. Moda Cetak Fisik: Poster Multi-QR Paritas

Moda ini digunakan saat relawan harus meninggalkan posko atau menyerahkan tanggung jawab ke organisasi lain melalui lembaran poster fisik yang ditempel di tiang tenda atau dinding posko.

```
┌──────────────────────────────────────────────────────────┐
│   SANDYA - POSTER SERAH TERIMA BERBASIS PARITAS      │
│  Posko: GOR Pacet | Kapasitas: 1.000 Pengungsi           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   [ QR Data 1 ]    [ QR Data 2 ]    [ QR Data 3 ]        │
│   (@143 Jiwa)      (@143 Jiwa)      (@143 Jiwa)          │
│                                                          │
│   [ QR Data 4 ]    [ QR Data 5 ]    [ QR Data 6 ]        │
│   (@143 Jiwa)      (@143 Jiwa)      (@143 Jiwa)          │
│                                                          │
│   [ QR Data 7 ]    [ QR PARITAS D ]                      │
│   (@143 Jiwa)      (XOR Paritas Redundansi)              │
│                                                          │
│   KEBAL SOBEKAN: Cukup scan SEMBARANG 7 dari 8 QR.     │
│  Jika 1 kotak QR sobek / terkena lumpur total,           │
│  data 1.000 pengungsi tetap pulih 100% sempurna!         │
└──────────────────────────────────────────────────────────┘
```

### A. Matriks Skalabilitas Poster Fisik:

| Ukuran Posko | Jumlah Jiwa | Format Grid Poster | Konfigurasi Kotak | Toleransi Kerusakan |
| :--- | :---: | :---: | :---: | :--- |
| **Posko Tenda RW** | $100 - 200\text{ Jiwa}$ | **Grid 2 QR** | 2 Data Kotak | Sangat tebal & instan dibidik |
| **Posko Lapangan Sedang** | $500\text{ Jiwa}$ | **Grid 4 QR** | 3 Data + 1 Paritas XOR | **Kebal kehilangan 1 QR utuh** |
| **Posko Induk / GOR** | $1.000\text{ Jiwa}$ | **Grid 8 QR** | 7 Data + 1 Paritas XOR | **Kebal kehilangan 1 QR utuh** |

### B. Formula Rekonstruksi Paritas XOR
Jika terdapat $M$ kotak data dan 1 kotak paritas:
$$\text{Paritas} = D_1 \oplus D_2 \oplus \dots \oplus D_M$$

Jika kotak ke-$k$ ($D_k$) rusak total atau sobek dari kertas:
$$D_k = \text{Paritas} \oplus \left( \bigoplus_{i \neq k} D_i \right)$$

---

## 3. Fitur Penyatuan Keluarga Terpisah (*Offline Family Reunion*)

Saat relawan memindai QR (baik via animasi layar maupun poster kertas), sistem secara otomatis menjalankan **Rekonsiliasi Graf Temu Keluarga**:

1. Sistem membandingkan field `missingKinName` (nama keluarga yang dicari) dari posko lokal dengan daftar `fullName` dari posko yang baru diimpor.
2. Jika ada kecocokan nama dan asal domisili (`domicileOrigin`):
  * Aplikasi langsung memunculkan notifikasi pop-up:
  > *" KELUARGA DITEMUKAN: Siti Rahmawati (Dusun Cijedil) yang dicari oleh Budi Santoso terdaftar di Posko B (Ruang Kelas 2B SDN 1 Pacet)!"*
3. Hubungan keluarga otomatis terhubung di basis data lokal SQLite tanpa membutuhkan koneksi internet.

---

## 4. Matriks Ringkasan Dual-Engine

| Parameter | Moda Layar (Animated QR) | Moda Cetak (Poster Paritas) |
| :--- | :--- | :--- |
| **Media Transfer** | Layar HP ke Kamera HP | Kertas A4 / Struk Printer Termal Bluetooth |
| **Batas Kapasitas** | **Hingga 5.000+ Jiwa** (Bebas frame) | **$500 - 1.000\text{ Jiwa}$** (Batas fisik kertas) |
| **Kecepatan Selesai** | **$1 - 4\text{ Detik}$** (Selesai begitu slot penuh) | Tergantung kecepatan jepret kamera |
| **Ketahanan Kerusakan** | Tahan kedipan/frame drop kamera | Tahan sobekan 1 kotak utuh via paritas XOR |
| **Kebutuhan Hardware** | Hanya 2 unit Smartphone | Printer saku termal / Kertas HVS |
