# 🚫 Anti-Patterns & UI Slop Resolution Guide (Var-UI Base)

Dokumen ini membedah 14 elemen visual klise khas generator AI (*AI Slop UI*) beserta analisis teknis dan panduan refactoring ke bentuk desain otentik berbasis standar desainer **Vargen Studio**.

---

## 1. Teks & Tombol Bergradasi Warna (`bg-gradient-to-r`, `text-transparent`)
Generator AI sering menggunakan gradasi neon. Gunakan warna *solid* terkurasi dengan kontras tinggi.

---

## 2. Decorative Pill / Badge di Atas Headline (DILARANG HARAM)
Menempatkan *pill badge*, kapsul mungil, atau tagline melayang tepat di atas judul H1/H2 dilarang. Headline H1/H2 harus berdiri langsung, tegas, dan bersih di posisi paling atas section.

---

## 3. Penggunaan Emoji Unicode dalam UI (DILARANG HARAM SAMA SEKALI)
Menjejalkan emoji Unicode (seperti 🔥, 🚀, ⚡, 🎨, 📍, 🕒, ✨, ✉️, dll) dilarang total. Gunakan SVG stroke icons minimalis atau teks murni.

---

## 4. Latar Belakang Krem / Off-White Kusam (DILARANG HARAM WARNA KUSAM)
Latar belakang krem kekuningan / off-white kusam (`#FAF9F6`, `#FAF8F5`, `#F3F0EA`) dilarang karena berkesan kusam dan lusuh. Gunakan **Crisp Clean White** (`#FFFFFF`) atau **Crisp Soft Slate** (`#F8FAFC`).

---

## 5. Penggunaan Font `Inter` Berlebihan & Monospace di Luar Blok Kode
AI cenderung memakai `Inter` secara generik di semua tempat. Gunakan font berkarakter seperti *Outfit*, *Plus Jakarta Sans*, *Geist*, *Space Grotesk*, atau *Newsreader*. Monospace **HANYA** untuk blok kode.

---

## 6. Kapitalisasi Ekstrem Pada Teks (`text-transform: uppercase`)
Dilarang membuat seluruh tombol dan heading menjadi huruf KAPITAL (*ALL CAPS*). Gunakan *Sentence case* atau *Title case* natural.

---

## 7. Sudut Kelengkungan Ekstrem (`rounded-3xl`, `rounded-full` Berlebihan)
Gunakan kelengkungan sudut presisi (*border-radius* 4px–8px) atau *0px sharp*, bukan rounded-3xl berlebihan.

---

## 8. Grid Statistik Angka Palsu ("10k+ Users", "99.9% Uptime")
Hapus statistik rekaan. Tampilkan konten riil, sampel antarmuka aktual, atau kisah produk nyata.

---

## 9. Status Dot / Blip Berdenyut Tanpa Fungsi (`● System Operational`)
Hapus titik pendar indikator status yang tidak interaktif.

---

## 10. Dark Mode Hitam Pekat Sebagai Default Otomatis (`#000000`)
Gunakan Crisp Light Mode berkontras tinggi, kecuali jika pengguna secara eksplisit meminta Dark Mode.

---

## 11. Glowing Orbs & Blur Berwarna-Warni (`filter: blur()`)
Gantikan pendaran buram dengan struktur garis batas (*hairline border*) 1.5px solid presisi.

---

## 12. Glassmorphism Liar Tanpa Perintah (`backdrop-blur`)
Gunakan permukaan warna solid (*solid surface*) netral dengan border tipis.

---

## 13. Placeholder Gambar Abu-abu Kosong / Siluet Generik
Wajib gunakan fotografi berkualitas tinggi dari CDN Unsplash.

---

## 14. Dekorasi Elemen Berlebihan Tanpa Konsep
Jaga kebersihan hirarki visual dan ruang kosong (*white space*).
