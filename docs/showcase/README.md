# Showcase Tangkapan Layar Aplikasi Sandya (`docs/showcase`)

Folder ini digunakan secara khusus untuk menyimpan aset tangkapan layar (*screenshots*) dari **aplikasi nyata** Sandya yang berjalan. Berkas-berkas di sini disematkan langsung pada [README.md](../../README.md) utama repositori.

---

## 📋 Daftar Berkas Showcase & Penjelasan Slot

| No | Nama Berkas | Resolusi Disarankan | Deskripsi Tampilan Antarmuka |
| :---: | :--- | :---: | :--- |
| **1** | `situational-dashboard.png` | 1920×1080 (16:9) | **Situational Awareness & Posko Dashboard**<br/>Ringkasan metrik real-time: hunian posko, kelompok rentan, status triase, radar kebutuhan logistik kritis, dan status konektivitas node mesh. |
| **2** | `refugees-intake.png` | 1920×1080 atau Mobile View | **Pendaftaran Cepat Pengungsi (Fast Mobile Intake)**<br/>Formulir pendaftaran warga 30 detik, pemilahan demografi kelompok rentan, dan pencatatan nomor tenda/kamar. |
| **3** | `medical-triage.png` | 1920×1080 (16:9) | **Triase Medis START (Simple Triage and Rapid Treatment)**<br/>Klasifikasi 4 warna status kegawatdaruratan (Merah, Kuning, Hijau, Hitam), input tanda vital (GCS/nadi/respirasi), dan resep obat darurat. |
| **4** | `logistics-resilience.png` | 1920×1080 (16:9) | **Gudang Logistik & Ketahanan SPHERE**<br/>Pencatatan mutasi stok fisik sistem *single-writer*, estimasi sisa hari konsumsi bahan pokok (*burn rate*), dan grafik alokasi posko. |
| **5** | `family-reunion.png` | 1920×1080 (16:9) | **Pencarian Keluarga Terpisah (Family Reunion)**<br/>Pencarian kerabat hilang secara offline dengan pencocokan nama berbasis toleransi kesalahan ejaan (*phonetic/fuzzy indexing*). |
| **6** | `tactical-intercom.png` | 1920×1080 (16:9) | **Komunikasi Push-to-Talk (PTT) & Chat Taktis**<br/>Antarmuka 4 kanal taktis darurat lapangan (*Command*, *Medical*, *Logistics*, *Search & Rescue*) dan tombol sirene SOS. |

---

## 🎨 Panduan Tangkapan Layar (Screenshot Guidelines)

1. **Format Berkas:** PNG (`.png`) atau WebP (`.webp`).
2. **Kualitas & Rasio:**
   - Gunakan rasio 16:9 (disarankan `1920x1080` atau scaling 2x retina display `2560x1440`).
   - Pastikan teks antarmuka tajam, jelas, dan kontras tinggi.
3. **Kerapian Tampilan:**
   - Bersihkan data sensitif pribadi (gunakan data simulasi posko/nama fiktif).
   - Pastikan browser/jendela aplikasi bersih tanpa tab bar yang mengganggu jika memungkinkan (atau gunakan window frame bawaan aplikasi desktop Tauri).
4. **Ukuran File:** Optimalkan ukuran berkas (disarankan di bawah 1.5MB per gambar menggunakan kompresi `pngquant` atau sejenisnya) agar halaman GitHub memuat dengan cepat.
