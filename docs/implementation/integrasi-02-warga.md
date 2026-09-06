# Integrasi 02: Perbaikan Split-Brain ID pada Pendaftaran Warga (Intake)

## Goal Description
Seperti halnya Logistik, terjadi *split-brain* pada fitur pendaftaran warga (Intake).
Pada file `src/features/refugees/components/fast-intake-modal.tsx`, UI memanggil `container.fastIntakeUseCase.execute(...)` yang mencetak record di database SQLite dengan ID format khusus. Namun setelah sukses, UI memanggil `addRefugee` dari Zustand Store yang kembali mengenerate ID baru `REF-XXXX` secara acak!
Akibatnya, saat pemeriksaan triase dilakukan, UI melempar `REF-XXXX` ke backend, dan backend tidak dapat menemukan data warga tersebut di SQLite.

Tujuan dari dokumen ini adalah agar `addRefugee` dapat menerima `id` secara presisi dari backend.

## Proposed Changes

### 1. `src/features/posko/store/use-posko-store.ts`
Ubah tanda tangan `addRefugee` agar tidak meng-generate ID baru jika datanya sudah memuat ID dari backend.
```typescript
// SEBELUMNYA:
addRefugee: (refugee: Omit<DisasterPerson, "id" | "createdAt">) => void;

// MENJADI:
// Jadikan ID opsional di antarmuka input
addRefugee: (refugee: Omit<DisasterPerson, "createdAt"> & { id?: string }) => void;
```
Di dalam implementasinya:
```typescript
  const newPerson: DisasterPerson = {
  ...refugee,
  // Pakai ID dari luar, jika tak ada fallback ke generator REF
  id: refugee.id || `REF-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
  createdAt: Date.now(),
  };
```

### 2. `src/features/refugees/components/fast-intake-modal.tsx`
Ambil ID yang dihasilkan oleh backend (`intakeResult.value.refugeeId`) dan kirimkan ke fungsi `addRefugee`.
```tsx
  // SEBELUMNYA:
  if (intakeResult.ok) {
    addRefugee({
      postId: session.poskoId,
      // ...
  // MENJADI:
  if (intakeResult.ok) {
    addRefugee({
      id: intakeResult.value.refugeeId, // Teruskan ID backend!
      postId: session.poskoId,
      // ...
```

## Verification Plan
1. Lakukan pendaftaran warga baru menggunakan **+ Daftar Warga**.
2. Masuk ke halaman **Triase** (Pemeriksaan Medis).
3. Klik kartu warga tersebut dan ubah status menjadi **Kuning**.
4. Sistem tidak akan lagi mengalami kegagalan/error *"Warga tidak ditemukan"* dan label warnanya sukses diperbarui.
