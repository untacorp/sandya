# Rancangan Desain & Dokumen Teknis (`docs/design`)

Folder ini digunakan untuk menyimpan seluruh rancangan desain, spesifikasi arsitektur, skema data, dan desain antarmuka aplikasi **Sanidya**.

---

## 📁 Struktur Folder

```text
docs/design/
├── README.md               # Indeks dan panduan struktur rancangan desain (file ini)
├── architecture/           # Spesifikasi arsitektur sistem, modularitas, dan integrasi Tauri v2 / offline-first
├── database/               # Skema data, Mermaid ERD, model event-sourcing, dan indexing strategy
└── ui-ux/                  # Rancangan antarmuka, wireframe, flow layar, 6-state UI matrices, dan komponen
```

---

## 🧭 Kategori & Panduan Penggunaan

### 1. [`architecture/`](./architecture/README.md)
Menyimpan rancangan arsitektur tingkat tinggi maupun detail subsistem:
- Arsitektur client-side offline-first & event-sourcing.
- Integrasi Tauri v2 (IPC, bridge Rust/TypeScript, filesystem lokal).
- Protokol komunikasi p2p, mesh intercom, dan transfer data (QR code / animated JabCode).

### 2. [`database/`](./database/README.md)
Menyimpan spesifikasi model data dan persistensi:
- Skema database relasional / embedded (SQLite / LibSQL / IndexedDB).
- Definisi Drizzle ORM / Prisma schema.
- Diagram Entity-Relationship (Mermaid ERD).
- Strategi indeks dan partisi data bencana.

### 3. [`ui-ux/`](./ui-ux/README.md)
Menyimpan rancangan visual, interaksi antarmuka, dan struktur komponen:
- Hirarki komponen Next.js App Router (React 19 Server/Client boundaries).
- UI State Matrix (Initial, Loading, Success, Empty, Error, Offline).
- Wireframe dan desain token (Tailwind CSS, shadcn/ui, optimasi mobile & desktop).

---

## 📝 Konvensi Penamaan File
- Gunakan format **kebab-case** dengan prefix angka untuk dokumen terurut (contoh: `01-arsitektur-sync-engine.md`, `02-desain-komponen-triase.md`).
- Sertakan diagram Mermaid (`mermaid`) untuk alur atau relasi data visual.
