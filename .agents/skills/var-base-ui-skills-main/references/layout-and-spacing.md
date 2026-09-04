# 📐 Panduan Layout, Spacing & Responsivitas Var-UI Base

Gunakan grid asimetris, ruang kosong yang lapang, dan garis batas (*hairline border*) 1.5px solid presisi.

---

## 📱 Uji Responsivitas Mobile (320px - 1440px)
- `overflow-x: clip;` pada `html, body`.
- `overflow-wrap: anywhere; min-width: 0;` pada H1 & H2.
- Grid tracks menggunakan `minmax(0, 1fr)`.
