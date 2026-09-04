# ✅ Checklist Validasi Var-UI Base & Scoring Mandiri

Sebelum menyampaikan kode UI kepada pengguna, jalankan audit mandiri terhadap **15 Checklist Var-UI Base** dan hitung **Skor Self-Critique 6-Aksis**.

---

## 📋 15-Point Var-UI Base Audit Checklist

- [ ] 1. **Bebas Warna Kusam**: Apakah canvas 100% BEBAS krem kusam (`#FAF9F6`, `#FAF8F5`), dan menggunakan warna bersih berkontras tinggi (`#FFFFFF` / `#F8FAFC`)?
- [ ] 2. **Bebas Emoji Unicode**: Apakah kode UI dan teks 100% BEBAS dari emoji Unicode (misal 🔥, 🚀, ⚡, 🎨, 📍, 🕒, ✨)?
- [ ] 3. **Tanpa Badge Di Atas Headline**: Apakah headline utama H1/H2 berdiri langsung tanpa badge/pill melayang tepat di atasnya?
- [ ] 4. **Bebas Gradasi Teks/Tombol**: Apakah teks dan tombol menggunakan warna solid terkurasi?
- [ ] 5. **Tipografi Berkarakter**: Apakah menggunakan font berkarakter (*Outfit*, *Plus Jakarta Sans*, *Geist*, *Space Grotesk*, *Newsreader*) alih-alih `Inter` generik?
- [ ] 6. **Monospace Terisolasi**: Apakah font Monospace HANYA untuk blok kode (`<code>`, `<pre>`)?
- [ ] 7. **Kapitalisasi Natural**: Apakah tombol dan judul bebas dari ALL CAPS paksaan?
- [ ] 8. **Kelengkungan Presisi**: Apakah `border-radius` di kisaran 4px–8px alih-alih `rounded-3xl` berlebihan?
- [ ] 9. **Konten Terpercaya**: Apakah bebas dari grid statistik palsu ("10k+ Users")?
- [ ] 10. **Bebas Status Blip**: Apakah titik pendar berdenyut tanpa fungsi aktual telah dibersihkan?
- [ ] 11. **Light Mode Crisp Default**: Apakah mengevaluasi Crisp White Canvas alih-alih otomatis Dark Mode pekat `#000000`?
- [ ] 12. **Tanpa Radial Blur/Glowing Orbs**: Apakah pendaran buram diganti dengan border 1.5px solid presisi?
- [ ] 13. **Bebas Glassmorphism Liar**: Apakah efek `backdrop-blur` acak diganti dengan permukaan solid netral?
- [ ] 14. **Fotografi Realistis**: Apakah memakai foto Unsplash CDN berkualitas tinggi?
- [ ] 15. **Uji Responsivitas 320px–1440px**: Apakah bebas dari horizontal scroll bar pada layar 320px?

---

## 🛡️ Stempel Evaluasi Kode (Komentar Wajib Atas Kode)

```css
/* Var-UI Base · pre-emit score: [P:5 H:5 E:5 S:5 R:5 V:5]
 * scope: page | component: Landing Page
 * theme: Crisp Cobalt & Clean White | typography: Outfit + Plus Jakarta Sans
 * status: PASSED (15/15 slop checks verified)
 */
```
