# Integrasi 03: Sinkronisasi Awal State Zustand dengan SQLite (Hydration)

## Goal Description
Saat ini `usePoskoStore` menggunakan data statis atau memori kosong (`inventory: [], refugees: []`) pada saat pertama kali dimuat. Sistem sama sekali tidak membaca isi dari database SQLite (`ServiceContainer.db`) saat aplikasi berjalan. Akibatnya, jika halaman disegarkan (*refresh*), data mock yang di-*load* oleh backend tidak akan pernah muncul di UI frontend.

Kita perlu mengimplementasikan mekanisme *hydration* (pengisian data awal) saat layout posko dimuat.

## Proposed Changes

### 1. `src/features/posko/store/use-posko-store.ts`
Tambahkan aksi `hydrateStore` yang bisa menelan data dari luar (backend).
```typescript
interface PoskoStore {
  // ...
  hydrateStore: (data: { inventory: InventoryItem[], refugees: DisasterPerson[] }) => void;
}

// Di implementasi:
hydrateStore: (data) => set({
  inventory: data.inventory,
  refugees: data.refugees,
}),
```

### 2. Pembuatan API / Fetcher Awal di Root Layout Posko
Pada `src/app/posko/[poskoId]/layout.tsx` atau komponen initializer khusus:
1. Memanggil `container.inventoryRepo.findAll()` (atau fungsi sejenisnya) dan `container.refugeeRepo.findAll()`.
2. Jika ini berada di Server Component, teruskan data ini ke Client Component `<StoreHydrator data={...} />`.
3. Client Component ini akan memanggil `hydrateStore(data)` saat *onMount* (`useEffect`).

*(Catatan: Mengingat aplikasi ini adalah simulasi edge/native, kita mungkin harus mengekspos rute Next.js API `GET /api/v1/posko/[id]/sync` untuk menarik *snapshot* dan dipanggil oleh frontend saat inisiasi, karena SQLite berjalan secara in-memory di Node.js).*

## Verification Plan
1. Saat me-refresh browser di halaman `/posko/[poskoId]/logistics`, tabel logistik tidak boleh kosong jika di backend sudah ada data barang.
2. Data warga yang sebelumnya didaftarkan harus tetap muncul setelah tab browser ditutup dan dibuka kembali (selama server node/Tauri masih berjalan).
