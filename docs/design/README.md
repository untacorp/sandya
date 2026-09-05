# Rancangan Desain & Dokumen Teknis (`docs/design`)

> **Status**: Approved (Katalog Desain & Dokumen Teknis)  
> **Klasifikasi**: Indeks Direktori Desain Sistem  
> **Dokumen Terkait**: [Indeks Utama Dokumentasi](../README.md) | [Arsitektur UI](../arsitektur-ui-dan-dashboard.md)

Folder ini digunakan untuk mengorganisasikan seluruh rancangan desain sistem, spesifikasi arsitektur terdistribusi, skema basis data SQLite, dan desain sistem antarmuka aplikasi **Sandya**.

---

## Struktur Folder

```text
docs/design/
├── README.md               # Indeks dan panduan struktur rancangan desain (file ini)
├── architecture/           # Spesifikasi arsitektur sistem, modularitas, dan integrasi Tauri v2 / offline-first
│   └── README.md           # Indeks dan ringkasan arsitektur sistem terdistribusi
├── database/               # Skema data, Mermaid ERD, model event-sourcing, dan indexing strategy
│   └── README.md           # Indeks dan spesifikasi model data SQLite / event store
└── ui-ux/                  # Rancangan antarmuka, wireframe, flow layar, 6-state UI matrices, dan komponen
    ├── README.md           # Indeks desain antarmuka dan komponen UI
    ├── 01-arsitektur-frontend-sandya.md    # Blueprint arsitektur frontend React 19 RSC
    ├── 02-pedoman-solar-icons.md           # Pedoman standar Solar Icons
    └── 03-sistem-desain-dan-token-warna.md # Token warna semantik & Tailwind CSS v4
```

---

## Kategori & Panduan Penggunaan

### 1. [`architecture/`](./architecture/README.md)
Menyimpan rancangan arsitektur tingkat tinggi maupun detail subsistem:
- Arsitektur *client-side offline-first* & *event-sourcing*.
- Integrasi Tauri v2 (IPC, bridge Rust/TypeScript, filesystem lokal, mobile native plugin).
- Protokol komunikasi P2P, BLE mesh (*BitChat*), dan transfer data visual (*Animated Dynamic QR* & *Poster Paritas*).

### 2. [`database/`](./database/README.md)
Menyimpan spesifikasi model data dan persistensi:
- Skema database relasional lokal SQLite (9 tabel operasional).
- Definisi model *Append-Only Event Sourcing* dan *Single-Writer Ledger*.
- Diagram Entity-Relationship (Mermaid ERD).
- Strategi indeks dan partisi data bencana.

### 3. [`ui-ux/`](./ui-ux/README.md)
Menyimpan rancangan visual, interaksi antarmuka, dan struktur komponen:
- Hirarki komponen Next.js 16 App Router (React 19 Server/Client boundaries).
- UI State Matrix (Initial, Loading, Success, Empty, Error, Offline).
- Pedoman Solar Icons (`linear` & `bold`) dan Token Warna Semantik Tailwind CSS v4.

---

## Konvensi Penamaan File & Standar
- Gunakan format **kebab-case** dengan prefix angka untuk dokumen terurut (contoh: `01-arsitektur-frontend-sandya.md`, `02-pedoman-solar-icons.md`).
- Sertakan diagram Mermaid (`mermaid`) untuk visualisasi alur atau relasi data.
- Pastikan seluruh dokumen bebas emoji dan menggunakan format Markdown terstandarisasi.
