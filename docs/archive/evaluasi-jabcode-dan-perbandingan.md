# [ARSIP RISET] Evaluasi Eksperimen JabCode (Color 2D Barcode)

> **Status Dokumen**: DIARSIPKAN / DIBATALKAN (ARCHIVED & CANCELLED)  
> **Klasifikasi**: Riset & Pengujian Laboratorium (Archived)  
> **Dokumen Terkait**: [Spesifikasi Transfer Animated QR & Poster Paritas](../spesifikasi-transfer-animated-dan-poster.md) | [Tokenisasi Nama & Paritas QR](../tokenisasi-nama-dan-paritas-qr.md)

> [!NOTE]
> **Keputusan Arsitektur:**
> Berdasarkan hasil evaluasi praktis dan pertimbangan kondisi lapangan bencana ekstrem, implementasi **JabCode (Color 2D Barcode - ISO/IEC 23634)** resmi **dibatalkan/diarsipkan**. 
> Sistem Sandya sepenuhnya berfokus pada **Standar Monokrom Hitam-Putih Universal**:
> 1. **Moda Layar (Device-to-Device)**: **Animated Dynamic Multipart QR (B&W)**.
> 2. **Moda Cetak Fisik (Paper Poster)**: **Poster Multi-QR Paritas XOR (B&W)**.
>
> Dokumen ini disimpan murni sebagai catatan arsip riset dan pengujian laboratorium.

---

## 1. Ringkasan Pengujian JabCode 8-Warna

Laboratorium Sandya telah mengompilasi dan menguji *native binary* C JabCode (ISO/IEC 23634:2022) dengan hasil kapasitas sebagai berikut:

| Jumlah Pengungsi | Raw JSON | Bit-Packed | Compressed | 1 Kotak QR B&W | 1 Kotak JabCode (8 Warna) |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **50 Jiwa** | $6.594\text{ B}$ | $1.265\text{ B}$ | **$911\text{ B}$** | [PASS] Muat (V24) | [PASS] **100% Match** |
| **100 Jiwa** | $13.174\text{ B}$ | $2.435\text{ B}$ | **$1.684\text{ B}$** | [PASS] Muat (V34) | [PASS] **100% Match** |
| **200 Jiwa** | $26.163\text{ B}$ | $4.748\text{ B}$ | **$3.169\text{ B}$** | [FAIL] Overflow | [PASS] **100% Match** |
| **300 Jiwa** | $39.108\text{ B}$ | $7.096\text{ B}$ | **$4.664\text{ B}$** | [FAIL] Overflow | [PASS] **100% Match** |
| **500 Jiwa** | $61.188\text{ B}$ | $7.707\text{ B}$ | **$6.120\text{ B}$** | [FAIL] Overflow | [FAIL] **Overflow (>4.8 KB)** |

---

## 2. Mengapa JabCode Dibatalkan untuk Sandya?

Meskipun 1 kotak JabCode mampu menampung 300 data pengungsi di layar, sejumlah kendala fundamental menjadikannya tidak layak untuk situasi bencana nyata:

1. **Inkompatibilitas dengan Printer Termal Saku**:
   * Seluruh relawan di daerah bencana menggunakan printer kasir termal saku monokrom (hanya bisa mencetak hitam-putih). JabCode tidak bisa dicetak di printer termal.
2. **Ketergantungan pada Kalibrasi Warna Kamera HP**:
   * Sensor kamera smartphone murah di tenda darurat yang remang-remang sering mengalami pergeseran *white balance/hue*, menyebabkan warna kuning, hijau, dan cyan salah terdeteksi.
3. **Batas Fisik Simbol Tunggal (4.8 KB)**:
   * Pada data $>400\text{ orang}$, 1 kotak JabCode tetap mengalami *overflow* dan memerlukan multi-simbol yang rumit.
4. **Keunggulan Telak Animated Dynamic Multipart QR (B&W)**:
   * Animated QR monokrom bekerja **100% pada semua smartphone**, tidak butuh kalibrasi warna, dan mampu mentransfer data **hingga 5.000+ orang dalam hitungan detik** secara dinamis.

---

## 3. Keputusan Resmi Arsitektur

Sandya secara resmi mengadopsi standar monokrom hitam-putih universal yang dirinci pada:
[Spesifikasi Protokol Transfer Data: Animated QR Dinamis & Poster Paritas](../spesifikasi-transfer-animated-dan-poster.md).
