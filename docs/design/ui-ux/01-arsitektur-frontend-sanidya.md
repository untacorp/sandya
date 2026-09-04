# Blueprint Arsitektur Frontend: Sanidya v2

> **Standar Rekayasa**: Next.js 16 (App Router, React 19 RSC) + Tauri v2 Desktop & Mobile  
> **Prinsip Desain**: [Var-UI Base (Clean, Crisp Light, High Contrast, Anti-Slop)](file:///home/auttomus/Documents/Code/PROJECT/sanidya_v2/.agents/skills/var-base-ui-skills-main/SKILL.md)  
> **Cakupan**: 3-Tingkat Hierarki, 4-Peran RBAC, Fast Intake 30s, Triase Medis START, Logistik Single-Writer, Intercom Taktis (PTT), dan Sync Multi-Transport.

---

## 1. Arsitektur Rute (App Router Structure)

```text
src/app/
├── layout.tsx                                  # Root Layout (Fonts, Providers, Toast)
├── page.tsx                                    # 🚪 Gerbang Utama (3 Pilihan Aksi)
│
├── (auth)/                                     # Aktivasi & Mode Warga
│   ├── activate/page.tsx                       # [1] Scan Kartu Tugas / Kode Manual
│   ├── org-setup/page.tsx                      # [2] Wizard Pendirian Lembaga Baru
│   └── guest/page.tsx                          # [3] Pusat Temu Keluarga Mode Warga
│
├── (organization)/                             # 🏢 Konsol Lembaga & Misi Bencana
│   ├── layout.tsx                              # Organization Shell
│   ├── page.tsx                                # Portofolio Misi & Kunci Master
│   ├── members/page.tsx                        # Roster & Generator Kartu Tugas Komandan
│   ├── settings/page.tsx                       # Kunci Master & Host Cloud BYOC
│   └── missions/
│       ├── create/page.tsx                     # Form Pembuatan Misi Bencana Baru
│       └── [missionId]/
│           ├── page.tsx                        # 🌋 Overview Misi (Peta Situasi & Agregat)
│           ├── posko/create/page.tsx           # Pendirian Titik Posko Lapangan Baru
│           ├── logistics-hub/page.tsx          # Gudang Sentral & Surat Jalan Misi
│           └── posko-grid/page.tsx             # Grid Seluruh Posko di Bawah Misi Ini
│
└── (posko)/[poskoId]/                          # ⛺ Dasbor Operasional Posko (5-Tab)
    ├── layout.tsx                              # Posko Shell (Radar Banner, Mobile Tab Bar / Desktop Sidebar)
    ├── page.tsx                                # 📊 Tab 1: Beranda Telemetri (KPI & Alert)
    ├── refugees/                               # 👥 Tab 2: Warga, Medis & Temu Keluarga
    │   ├── page.tsx                            # Sub-Tab [📋 Daftar Pengungsi]
    │   ├── intake/page.tsx                     # Form Fast Mobile Intake 30 Detik (FAB)
    │   ├── triage/page.tsx                     # Sub-Tab [🩺 Papan Kanban Triase START]
    │   ├── reunion/page.tsx                    # Sub-Tab [🔍 Pusat Temu Keluarga]
    │   └── [refugeeId]/page.tsx                # Detail Warga & Event Sourcing Timeline
    ├── logistics/                              # 📦 Tab 3: Logistik & Distribusi
    │   ├── page.tsx                            # Sub-Tab [📦 Stok Gudang & Ledger]
    │   ├── distribute/page.tsx                 # Sub-Tab [🤝 Penyerahan Bantuan ke Warga]
    │   └── waybills/page.tsx                   # Sub-Tab [🚚 Permintaan Antar-Posko & Surat Jalan]
    ├── tactical/                               # 💬 Tab 4: Komunikasi Taktis & Mesh Intercom
    │   ├── page.tsx                            # Radio Chat 4 Saluran (#all, #medis, #logistik, #sos) + PTT
    │   └── radar/page.tsx                      # Topologi Jaringan & RSSI Tetangga Mesh
    ├── sync/                                   # 🔄 Tab 5: Pusat Sinkronisasi
    │   ├── page.tsx                            # Hub Sinkronisasi (Zero-Touch BLE Status)
    │   ├── animated-qr/page.tsx                # Fallback Layar (Animated Dynamic QR 6 FPS)
    │   └── poster/page.tsx                     # Fallback Cetak (Poster Paritas XOR)
    └── settings/page.tsx                       # ⚙️ Pengaturan Kriptografi & Profil Posko Ini
```

---

## 2. Batasan Server vs Client Component (React 19 RSC)

1. **Server Components (RSC)**:
   - Root Layouts & Shell Wrappers
   - Server-side data fetching awal dari database lokal / cache
   - Header statis, telemetri KPI awal, dan kerangka grid
2. **Client Components (`'use client'`)**:
   - `FastIntakeModal`: Form intake 30 detik dengan Zod validation & React Hook Form
   - `TriageKanbanBoard`: Papan kartu triase interaktif dengan drag-and-drop & filter keparahan
   - `StockMutateButton`: Tombol mutasi stok yang dijaga wewenang *Single-Writer*
   - `PTTVoiceRecorder`: Tombol mikrofon WebAudio dengan encoder Opus 3.2 kbps
   - `TacticalMessageFeed`: Stream chat real-time yang mendengarkan event mesh lokal
   - `MultipartQRScanner` & `DynamicQRAnimPlayer`: Pemutar dan scanner QR asinkron
   - `SOSEmergencySlide`: Tombol sirene darurat geser (*Slide to Confirm*)

---

## 3. Matriks 6-Status UI (*Universal 6-State Matrix*)

Setiap modul antarmuka wajib mengimplementasikan:
1. `Initial Loading`: Skeleton pulse tanpa pergeseran layout (*Zero Cumulative Layout Shift*).
2. `Empty State`: Ilustrasi minimalis + teks panduan + Tombol Call-to-Action.
3. `Populated / Success`: Render data berkontras tinggi dengan atribut aksesibilitas penuh.
4. `Error State`: Pesan kesalahan manusiawi + Tombol Coba Lagi (*Inline Retry*) + Error Boundary.
5. `Offline / Syncing State`: Badge oranye persisten yang menampilkan antrean event yang belum tersinkron.
6. `Conflict Resolution`: Modal komparasi visual jika terjadi anomali identitas atau data ganda.

---

## 4. Standar Desain Visual Var-UI Base

- **Warna Latar**: `#FFFFFF` (*Crisp White*) dan `#F8FAFC` (*Crisp Slate 50*).
- **Struktur Garis**: Border presisi 1.5px `#E2E8F0` (*Slate 200*).
- **Ikon**: Stroke SVG minimalis (Lucide Icons), **tanpa emoji Unicode pada label tombol atau teks UI**.
- **Tipografi**: *Plus Jakarta Sans* / *Geist* / *Outfit* (Font Monospace **hanya** untuk kode/hash).
- **Status Interaktif**: 8 Status lengkap (*Default, Hover, Focus-Visible, Active, Disabled, Loading, Error, Success*).
