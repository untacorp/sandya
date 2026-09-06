# Implementasi Custom Dropdown Komoditas Kamus Bencana

**Status:** Selesai
**Lokasi:** 
- `src/shared/ui/disaster-catalog-combobox.tsx`
- `src/app/posko/[poskoId]/logistics/page.tsx`
**Target Utama:** Meningkatkan kemudahan pengguna dalam mencari dan memilih komoditas Kamus Bencana saat mencatat stok masuk (restock).

## Perubahan yang Dilakukan:

1. **Membuat Komponen `DisasterCatalogCombobox`:**
   - Dibuat sebagai komponen UI di level *shared* karena Kamus Bencana adalah domain global yang mungkin akan digunakan di layar Distribusi, Pengiriman (Waybills), atau Request Logistik nantinya.
   - Komponen ini menggantikan elemen native `<select>` yang sebelumnya hanya menampilkan `[0xXX] Nama Barang` tanpa kemampuan pencarian.

2. **Fitur Pencarian (Search):**
   - Menambahkan input teks (*autoFocus* saat dropdown dibuka) di bagian atas *popover*.
   - Filter dilakukan di *client-side* secara real-time terhadap properti `nameId` dan `nameEn` dari masing-masing `DisasterNeedItem`.

3. **Fitur Filter Berdasarkan Kategori (Cluster):**
   - Di bawah kotak pencarian, ditambahkan deretan "chips/badges" horizontal yang merepresentasikan kategori Kamus Bencana (`Pangan & Air`, `Medis`, `Bayi & Balita`, dll).
   - Pengguna bisa menekan salah satu chip untuk langsung menyaring daftar hanya untuk kategori tersebut (Misal: klik "Medis" -> langsung muncul Paracetamol, Obat Hipertensi, Kasa, dll).

4. **Desain Popover Responsif:**
   - Dropdown menggunakan position `absolute z-50` agar melayang di atas konten lain (modal body).
   - Tinggi popover dibatasi (`max-h-[350px]`) dengan kemampuan *scroll* (overflow-y-auto), sehingga tidak melebihi ukuran layar *smartphone*.
   - Menggunakan *custom scrollbar hiding classes* pada daftar *chips* horizontal agar tampak bersih.

5. **Integrasi ke Halaman Logistik (`page.tsx`):**
   - Mengganti elemen native `<select>` di dalam `handleSaveRestock` modal (LogisticsPage) menjadi `<DisasterCatalogCombobox />`.
   - Prop `onChange` dari combobox sudah mengembalikan `id` dan `cluster` sehingga langsung disambungkan ke state internal `selectedCatalogId` dan `category`.

## Hasil
Pengguna tidak perlu lagi melakukan *scroll* panjang melewati hampir 100 item standar BNPB/SPHERE. Mereka cukup membuka dropdown, lalu mengetikkan "Beras" atau klik tab "Medis" untuk langsung menemukan komoditas yang diinginkan.
