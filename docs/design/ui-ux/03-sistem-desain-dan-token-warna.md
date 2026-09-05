# Sistem Desain & Token Warna Semantik: Sandya

> **Status**: Approved (Standar Desain & Token Warna Resmi)  
> **Klasifikasi**: Desain Sistem, Variabel CSS, & Konfigurasi Tailwind  
> **Dokumen Terkait**: [Blueprint Frontend](./01-arsitektur-frontend-sandya.md) | [Pedoman Solar Icons](./02-pedoman-solar-icons.md)

Dokumen ini mendefinisikan standar token warna terpusat yang diintegrasikan ke dalam **CSS Variables** dan **Tailwind CSS v4 `@theme`** pada aplikasi Sandya.

---

## 1. Katalog Token Warna Semantik

```css
:root {
  /* ==========================================
   * 1. CANVAS & SURFACES (Crisp Light & High Contrast)
   * ========================================== */
  --color-canvas: #FFFFFF;              /* Latar belakang utama aplikasi */
  --color-surface: #FFFFFF;             /* Latar belakang kartu / panel utama */
  --color-surface-subtle: #F8FAFC;      /* Background selang-seling / hover / strip table */
  --color-surface-muted: #F1F5F9;       /* Background input / chip netral */
  
  /* ==========================================
   * 2. BORDER 1.5PX PRESISI
   * ========================================== */
  --color-border: #E2E8F0;              /* Border netral kartu dan tabel */
  --color-border-hover: #CBD5E1;        /* Border saat elemen di-hover */
  --color-border-strong: #94A3B8;       /* Border aktif / focus-visible */

  /* ==========================================
   * 3. TIPOGRAFI & TEKS (Kontras Tinggi)
   * ========================================== */
  --color-text-main: #0F172A;           /* Teks utama (Slate 900) - Rasio 15.8:1 */
  --color-text-muted: #475569;          /* Teks sekunder & deskripsi (Slate 600) */
  --color-text-subtle: #94A3B8;         /* Placeholder & helper disabled (Slate 400) */
  --color-text-inverse: #FFFFFF;        /* Teks di atas tombol gelap / solid color */

  /* ==========================================
   * 4. AKSI UTAMA & BRAND IDENTITY
   * ========================================== */
  --color-primary: #0F172A;             /* Tombol utama (Slate 900 solid) */
  --color-primary-hover: #1E293B;       /* State hover tombol utama */
  --color-primary-foreground: #FFFFFF;  /* Teks tombol utama */
  --color-accent: #0284C7;              /* Sorotan tautan & fokus interaktif (Sky 600) */

  /* ==========================================
   * 5. STATUS FUNGSIONAL & INDIKATOR KONDISI
   * ========================================== */
  /* Hijau / Aman / Terverifikasi */
  --color-status-safe: #059669;         /* Emerald 600 */
  --color-status-safe-bg: #ECFDF5;      /* Emerald 50 */
  --color-status-safe-border: #A7F3D0;  /* Emerald 200 */

  /* Kuning-Amber / Peringatan / Logistik */
  --color-status-warning: #D97706;      /* Amber 600 */
  --color-status-warning-bg: #FFFBEB;   /* Amber 50 */
  --color-status-warning-border: #FDE68A;/* Amber 200 */

  /* Merah / Kritis / Bahaya SOS */
  --color-status-danger: #DC2626;       /* Red 600 */
  --color-status-danger-bg: #FEF2F2;    /* Red 50 */
  --color-status-danger-border: #FECACA;/* Red 200 */

  /* ==========================================
   * 6. STANDAR TRIASE MEDIS START (4-WARNA RESMI)
   * ========================================== */
  --color-triage-red: #DC2626;          /* Merah: Prioritas 1 - Immediate (Ancam Jiwa) */
  --color-triage-yellow: #D97706;       /* Kuning: Prioritas 2 - Delayed (Mendesak) */
  --color-triage-green: #059669;        /* Hijau: Prioritas 3 - Minor (Luka Ringan) */
  --color-triage-black: #1E293B;        /* Hitam: Prioritas 0 - Deceased / Expectant */
}
```

---

## 2. Aturan Penggunaan Token

1. **Seluruh komponen UI wajib menggunakan kelas Tailwind semantik** yang terhubung ke token di atas:
   - Gunakan `bg-surface border-border text-text-main` alih-alih `bg-white border-slate-200 text-slate-900`.
   - Gunakan `bg-status-safe-bg text-status-safe border-status-safe-border` untuk badge status hijau aman.
   - Gunakan `bg-status-danger-bg text-status-danger border-status-danger-border` untuk badge krisis merah.
2. **Dilarang keras menuliskan warna arbitrer hex manual** di dalam kode komponen (seperti `bg-[#123456]` atau `text-[#654321]`).
3. **Setiap perubahan skema warna** hanya dilakukan melalui pembaruan variabel token di `globals.css`.
