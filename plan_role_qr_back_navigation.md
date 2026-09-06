# Implementation Plan: In-Place Role Activation Modal & Graceful Back Navigation

Menyelesaikan kendala navigasi pada pembukaan QR Role / Aktivasi Peran dengan pendekatan **Modal In-Place** (tidak perlu berpindah halaman penuh saat sedang bekerja di posko/misi/organisasi) serta memastikan tombol *Kembali* dan gesture *back* perangkat berfungsi dengan elegan dan presisi.

---

## 1. Goal Description

Saat ini, pembukaan QR role / pemindaian kartu tugas memiliki dua kelemahan UX:
1. **Pemborosan Navigasi Halaman Penuh**: Saat petugas sedang berada di dalam posko (misal `/posko/POS-01/logistics`), mengklik "Ganti Akun / Pindai" melempar pengguna ke halaman penuh terpisah (`/activate`), merusak alur kerja (*context interruption*).
2. **Tombol Back Membawa ke Halaman Awal**: Jika pengguna di `/activate` menekan tombol kembali, tombol tersebut di-hardcode ke `<Link href="/">` sehingga pengguna terlempar keluar dari posko ke halaman paling awal aplikasi.
3. **Gesture / Tombol Back Browser pada Modal QR**: Saat modal QR peran (`RolePassModal`) dibuka di perangkat mobile/desktop, menekan tombol *back* fisik/browser memicu navigasi riwayat browser daripada menutup modal.

Rencana ini menyediakan:
- **`RoleActivationModal` (In-Place)**: Memungkinkan pemindaian / aktivasi peran langsung dalam bentuk modal dialog tanpa meninggalkan halaman kerja yang sedang aktif.
- **Tombol UI Ringkas `Kembali`**: Di halaman `/activate` (untuk akses dari luar/landing page), tombol kembali disederhanakan dengan label bersih **`Kembali`** dan menavigasikan secara cerdas ke `returnUrl`, rute sesi aktif, atau `router.back()`.
- **Integrasi `popstate` pada `Dialog`**: Menutup modal secara otomatis saat pengguna menekan tombol back atau melakukan gesture swipe back di HP tanpa me-navigate halaman.

---

## 2. User Review Required

> [!NOTE]
> - **In-Place Activation**: Tombol profil "Ganti Akun / Pindai" di sidebar dan tombol "Pindai Kartu Tugas" di modal switcher akan langsung membuka modal dialog pemindai QR di tempat. Sesi pengguna akan langsung ter-update begitu kartu tugas terverifikasi tanpa reload.
> - **Label Tombol Bersih**: Tombol kembali di `/activate` menggunakan label ringkas **`Kembali`** (bukan teks panjang).
> - **Penanganan Back Gesture**: Menekan back browser/gesture HP saat dialog/modal QR apapun terbuka akan menutup modal tersebut secara mulus.

---

## 3. Open Questions

Tidak ada pertanyaan terbuka.

---

## 4. Proposed Changes

### Role Activation Components & Modals

#### [NEW] [`src/features/auth/components/role-activation-modal.tsx`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/features/auth/components/role-activation-modal.tsx)
- Komponen modal pemindai kartu tugas in-place.
- Berisi:
  - Tab pilihan: *Pindai Kamera* atau *Ketik Kode Manual*.
  - Verifikasi kriptografis Ed25519 melalui `RolePassCodec.verifyAndDecodePass()`.
  - Pratinjau hasil verifikasi sah (Peran, Nama, Posko).
  - Tombol "Aktifkan & Mulai Bertugas" yang langsung memperbarui `usePoskoStore` (`setFullSession`) dan menutup modal.
  - Tombol Batal / Tutup yang menutup modal tanpa merusak konteks halaman yang sedang dibuka.

---

### App Shell & Modals

#### [MODIFY] [`src/shared/ui/dialog.tsx`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/shared/ui/dialog.tsx)
- Tambahkan integrasi `popstate` browser:
  - Saat `open` bernilai `true`, push history state ringan `window.history.pushState({ isModalOpen: true }, "")`.
  - Tangkap event `popstate` untuk memanggil `onOpenChange(false)` (menutup modal) tanpa me-navigate halaman sebelumnya.
  - Bersihkan state riwayat saat modal ditutup programmatically.

#### [MODIFY] [`src/features/navigation/components/unified-app-sidebar.tsx`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/features/navigation/components/unified-app-sidebar.tsx)
- Ubah tombol footer profile ("Ganti Akun / Pindai") dari `<Link href="/activate">` menjadi pemicu pembuka `RoleActivationModal`.
- Pengguna dapat mengganti peran/akun langsung dari sidebar tanpa meninggalkan posko/halaman aktif.

#### [MODIFY] [`src/features/navigation/components/hierarchy-switcher-modal.tsx`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/features/navigation/components/hierarchy-switcher-modal.tsx)
- Hubungkan tombol "Pindai Kartu Tugas" ke `RoleActivationModal` in-place.

#### [MODIFY] [`src/app/org/layout.tsx`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/app/org/layout.tsx)
- Pasang `RoleActivationModal` untuk tombol "Pindai Kartu Tugas Pemimpin" pada tampilan akses terbatas.

---

### Gateway / Dedicated Activate Page

#### [MODIFY] [`src/app/activate/page.tsx`](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/src/app/activate/page.tsx)
- Sederhanakan tombol kembali di header menjadi tombol dengan label ringkas **`Kembali`**.
- Gunakan `useSearchParams()` untuk membaca `returnUrl` (jika ada).
- Tentukan tujuan kembali secara cerdas:
  1. `returnUrl` (jika valid berawalan `/`).
  2. Sesi aktif pengguna (`/posko/${session.poskoId}` atau `/missions/${session.missionId}` atau `/org`).
  3. `router.back()` jika ada riwayat peramban.
  4. Fallback ke `/` (Beranda).
- Bungkus dengan `<React.Suspense>` untuk memastikan kompatibilitas Next.js SSG build.

---

## 5. Verification Plan

### Automated Tests
- Jalankan seluruh suite pengujian otomatis:
  ```bash
  pnpm test
  ```
- Jalankan kompilasi produksi Next.js:
  ```bash
  pnpm build
  ```

### Manual Verification
1. Buka halaman posko (misal: `/posko/POS-01/settings`).
2. Klik tombol "Buka QR Kartu Tugas" ➔ Modal QR peran terbuka.
3. Tekan tombol back di peramban / swipe gesture back di mobile:
   - **Hasil**: Modal QR tertutup dan tetap berada di `/posko/POS-01/settings`.
4. Buka sidebar ➔ Klik tombol scan QR di samping profil petugas:
   - **Hasil**: `RoleActivationModal` terbuka in-place di atas layar aktif tanpa pindah halaman.
5. Pindai kartu tugas atau ketik kode manual ➔ Konfirmasi:
   - **Hasil**: Peran aktif langsung ter-update di posko tanpa reload.
6. Akses halaman `/activate` langsung dari beranda (`/`):
   - **Hasil**: Tombol kembali berlabel **`Kembali`** dan mengembalikan pengguna ke halaman asal secara presisi.
