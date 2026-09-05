---
name: var-ui-base
description: >-
  Skill standar desain antarmuka Vargen Studio (HTML, CSS, React, Vue, Tailwind, dll)
  untuk menghasilkan UI yang otentik, presisi, bersih, dan berkontras tinggi tanpa elemen visual klise khas AI (AI Slop).
version: 1.0.0
---
# Var-UI Base — Vargen Studio Design Guidelines

Skill ini menyediakan panduan arsitektur visual dan aturan eksekusi resmi khas **Vargen Studio** untuk memandu AI coding agent membangun antarmuka web (*User Interface*) modern yang otentik, segar, berkontras tinggi, dan bebas dari pola visual klise bawaan generator AI (*AI Slop UI*).

---

##  Penentuan Cakupan Kerja (Scope Router)

Sebelum memulai eksekusi kode, tentukan apakah permintaan pengguna berlingkup **Halaman Penuh (Page-Scope)** atau **Komponen Tunggal (Component-Scope)**.

| Jenis Cakupan                      | Indikator Permintaan                                                                         | Dokumen & Alur Kerja yang Diaktifkan                                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page-Scope** *(Default)* | Landing page, dashboard, halaman pricing, rincian fitur, atau pembuatan situs baru dari nol. | Jalankan**Alur Kerja Eksekusi Desain (Langkah 0–5)** penuh dan gunakan seluruh referensi.                                                                  |
| **Component-Scope**          | Meminta elemen tunggal (tombol, input, kartu, modal, dropdown, tabs, navbar, slider, dll).   | Lewati macrostructure halaman.**Wajib mengimplementasikan Standar 8 Interactive States** dan buat file demo wrapper (`.preview.html` / `.preview.tsx`). |

---

##  Alur Kerja Eksekusi Desain (Design Workflow)

### Langkah 0: Scanning & Pra-Kondisi (Pre-flight Scan)

- Periksa file proyek yang ada (`package.json`, `tailwind.config.js`, file CSS/HTML/React yang ada).
- Kunci variabel token yang sudah terdefinisi. Jangan menimpa warna atau font yang sudah ditetapkan pengguna kecuali diminta secara eksplisit.

### Langkah 1: Klasifikasi Tema & Karakter Produk (Warna Segar & Bersih)

- Tentukan genre produk: *Editorial / Corporate / Tech Minimalist / Youth Playful / Creative Agency*.
- Gunakan warna latar belakang yang **bersih & segar** (*Crisp White* `#FFFFFF` / *Crisp Slate* `#F8FAFC`).
- Pilih **1 warna dominan canvas, 1 warna permukaan (surface), dan 1 warna aksen solid**.
- Gunakan skema warna terkurasi dari [`references/color-system.md`](references/color-system.md).

### Langkah 2: Hirarki Tipografi & Tata Letak

- Pilih matriks font yang berkarakter (misal: *Outfit*, *Plus Jakarta Sans*, *Geist*, *Satoshi*, *Space Grotesk*, *Newsreader*).
- **Gunakan font Monospace HANYA untuk blok kode aktual.**
- Terapkan layout grid asimetris dan ruang kosong (*white space*) yang proporsional sesuai panduan di [`references/layout-and-spacing.md`](references/layout-and-spacing.md).

### Langkah 3: Interaksi & State Komponen

- Pastikan seluruh elemen interaktif (tombol, input, kartu) memiliki respons visual yang halus.
- Untuk komponen individual, wajib mencakup 8 state interaktif yang dijelaskan dalam [`references/component-states.md`](references/component-states.md).

### Langkah 4: Pemantapan Aset Visual Realistis

- Gunakan ikon SVG stroke presisi tinggi alih-alih emoji Unicode.
- Jika membutuhkan media visual dan tidak ada gambar lokal, **gunakan CDN Unsplash** beresolusi tinggi dengan kueri yang relevan.
- Patuhi petunjuk format URL dan rasio gambar pada [`references/asset-integration.md`](references/asset-integration.md).

### Langkah 5: Evaluasi Mandiri (Pre-Emit Self-Critique)

- Lakukan verifikasi kode terhadap **15-Point Slop Checklist** pada [`references/validation-checklist.md`](references/validation-checklist.md).
- Berikan stempel hasil evaluasi di bagian paling atas file kode yang dihasilkan.

---

##  Peta Dokumen Referensi (Progressive Disclosure)

| Topik Referensi                | File Dokumen                                                                | Ringkasan Isi Utama                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Anti-Patterns**      | [`references/anti-patterns.md`](references/anti-patterns.md)               | Bedah tuntas 14 elemen*Hall of Shame* (termasuk larangan Emoji, larangan Badge di atas Headline, dan larangan Warna Kusam). |
| **Tipografi**        | [`references/typography.md`](references/typography.md)                     | Matriks pasangan font, hirarki ukuran teks, aturan kapitalisasi natural, dan tokenisasi tipografi.                            |
| **Layout & Spacing**   | [`references/layout-and-spacing.md`](references/layout-and-spacing.md)     | Grid asimetris, ruang kosong, batas border 1.5px presisi, dan uji responsivitas mobile (320px–1440px).                       |
| **Sistem Warna**       | [`references/color-system.md`](references/color-system.md)                 | Aturan pewarnaan 60-30-10, 5 palet warna bersih & segar khas Var-UI Base, serta panduan Crisp Light Mode.                     |
| **State Komponen**     | [`references/component-states.md`](references/component-states.md)         | Implementasi 8 state interaktif (Default, Hover, Focus, Active, Disabled, Loading, Error, Success) dan format demo wrapper.   |
| **Mikro-Interaksi**    | [`references/microinteractions.md`](references/microinteractions.md)       | Easing curves CSS (`cubic-bezier`), durasi transisi (150ms-250ms), dan motion alami.                                        |
| **Integrasi Aset**   | [`references/asset-integration.md`](references/asset-integration.md)       | Parameter URL CDN Unsplash realistis, rasio foto, dan ikonografi SVG bersih tanpa emoji.                                      |
| [PASS]**Checklist Validasi** | [`references/validation-checklist.md`](references/validation-checklist.md) | Checklist 15 poin validasi UI dan scoring mandiri 6 aksis sebelum rilis kode.                                                 |

---

##  Stempel Evaluasi Kode (Pre-Emit Stamp Format)

```css
/* Pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: page | component: <nama-komponen>
 * theme: <nama-palet-segar> | typography: <pasangan-font>
 * status: PASSED (15/15 slop checks verified)
 */
```
