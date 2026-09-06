# Integrasi 01: Perbaikan Split-Brain ID pada Sistem Logistik

## Goal Description
Saat ini terjadi *split-brain* (ketidakselarasan data) antara frontend (Zustand) dan backend (SQLite via Service Container) pada modul Logistik. Ketika pengguna menambahkan stok barang (Restock), UI memanggil fungsi backend yang membuat ID `POSKO_ID-ITEM-123`, lalu UI juga memanggil `addRestock` di Zustand yang membuat ID tersendiri `INV-456`.
Akibatnya, saat fitur Distribusi dipanggil, UI mengirimkan ID `INV-456` ke backend. Backend menolaknya dengan error **"Item logistik tidak ditemukan di posko ini"** karena ia hanya mengenal `POSKO_ID-ITEM-123`.

Tujuan dari dokumen ini adalah menyelaraskan pembuatan ID logistik agar Zustand dan SQLite menggunakan ID yang persis sama.

## Proposed Changes

### 1. `src/features/posko/store/use-posko-store.ts`
Ubah tanda tangan `addRestock` agar menerima parameter opsional `id`, sehingga UI dapat memasukkan ID dari backend alih-alih Zustand membuat ID secara acak.

```typescript
// SEBELUMNYA:
addRestock: (itemName: string, category: InventoryItem["category"], qty: number, unit: string) => void;

// MENJADI:
addRestock: (itemName: string, category: InventoryItem["category"], qty: number, unit: string, id?: string) => void;
```
Di dalam implementasinya:
```typescript
// Gunakan id dari parameter jika ada, jika tidak buat baru
let itemId = id || `INV-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_RANGE)}`;
```

### 2. `src/app/posko/[poskoId]/logistics/page.tsx`
Saat barang baru berhasil disimpan ke backend, ambil ID dari agregat backend dan teruskan ke Zustand.

```tsx
  // SEBELUMNYA:
  const newAgg = newAggRes.value;
  await container.inventoryRepo.save(newAgg);
  // ...
  addRestock(finalItemName, category as any, quantityNumber, unit.toUpperCase());

  // MENJADI:
  const newAgg = newAggRes.value;
  await container.inventoryRepo.save(newAgg);
  // ...
  // Teruskan newAgg.toSnapshot().id (misalnya: asItemId) ke Zustand
  addRestock(finalItemName, category as any, quantityNumber, unit.toUpperCase(), newAgg.toSnapshot().id);
```

## Verification Plan
1. Lakukan penambahan komoditas baru di **Halaman Logistik**.
2. Buat permintaan tiket (misal Beras).
3. Lakukan persetujuan alokasi di tab **Penyaluran Antrean**.
4. Sistem tidak akan lagi menampilkan pesan error "Item logistik tidak ditemukan" dan stok fisik berhasil terpotong.
