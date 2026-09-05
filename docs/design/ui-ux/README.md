# Sistem Desain Antarmuka & UX (`docs/design/ui-ux`)

> **Status**: Approved (Katalog Desain Antarmuka & Token Visual)  
> **Klasifikasi**: Standar UI/UX, Komponen, & Token Warna  
> **Dokumen Terkait**: [Indeks Desain](../README.md) | [Arsitektur UI & Dashboard](../../arsitektur-ui-dan-dashboard.md)

Folder ini memuat spesifikasi desain antarmuka, tata letak kanonikal Next.js 16 App Router, panduan ikonografi Solar Icons, dan sistem token warna semantik pada aplikasi **Sandya**.

---

## 1. Filosofi Desain Lapangan Bencana

Sistem antarmuka Sandya mengusung prinsip desain yang berfokus pada ketahanan dan kejelasan operasional:
1. **Kejelasan Maksimal (Crisp Light & High Contrast)**: Rasio kontras teks slate di atas kanvas putih mencapai 15.8:1, menjamin keterbacaan optimal di bawah terik sinar matahari maupun remang-remang tenda darurat.
2. **Bebas Elemen Klise (*Anti-Slop*)**: Tidak menggunakan dekorasi gradien buram (*glassmorphism blur*), kartu melayang berlebihan, maupun emoji pada teks antarmuka formal.
3. **Efisiensi Interaksi Jempol (*Thumb-Friendly 5-Tab*)**: Seluruh fungsi krusial dapat diakses dengan cepat melalui satu tangan pada layar smartphone.
4. **Matriks 6-Status Universal**: Setiap komponen antarmuka memiliki penanganan baku untuk status *Initial Loading, Empty, Populated/Success, Error, Offline/Syncing*, dan *Conflict Resolution*.

---

## 2. Katalog Dokumen UI/UX

Folder ini memuat 3 dokumen spesifikasi utama:

1. **[`01-arsitektur-frontend-sandya.md`](./01-arsitektur-frontend-sandya.md)**:
   - Blueprint struktur rute Next.js 16 App Router (`src/app/`).
   - Pemisahan batasan *React Server Components (RSC)* vs *Client Components (`'use client'`)*.
   - Definisi Matriks 6-Status UI (*Universal 6-State Matrix*).
2. **[`02-pedoman-solar-icons.md`](./02-pedoman-solar-icons.md)**:
   - Aturan pembatasan varian ikon (hanya varian `linear` untuk *inactive/outline* dan `bold` untuk *active/accent*).
   - Katalog pemetaan semantik ikon resmi di seluruh modul Sandya.
3. **[`03-sistem-desain-dan-token-warna.md`](./03-sistem-desain-dan-token-warna.md)**:
   - Definisi CSS Variables semantik (`--color-canvas`, `--color-surface`, dll).
   - Palet standar triase medis START (Merah, Kuning, Hijau, Hitam).
   - Aturan integrasi ke dalam Tailwind CSS v4 `@theme`.

---

## 3. Dokumen Terkait
Tata letak detail smartphone dan desktop command center dijabarkan di:
[Arsitektur Antarmuka (UI/UX) & Navigasi Dashboard](../../arsitektur-ui-dan-dashboard.md).
