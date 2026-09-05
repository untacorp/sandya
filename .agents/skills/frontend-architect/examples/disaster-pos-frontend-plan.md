# Reference Example: Disaster Pos Management & QR Scanner Frontend Plan (Sandya Architecture)

> **Status**: Production Reference Architecture  
> **Stack**: Next.js 16 (App Router, React 19 RSC), Tauri v2 Native Bridge, Tailwind CSS v4, TanStack Query v5, Zustand, React Hook Form + Zod  
> **Key Paradigms**: Offline-First Local Storage, Optimistic UI with Rollback, Native Barcode Camera Scanner, Universal 6-State UI Matrix  

---

## 1. Route Inventory & Layout Architecture

| Route Path | Rendering Model | Layout Hierarchy | Route Guard | Purpose |
|---|---|---|---|---|
| `/` | Server Component | `RootLayout` | Auto-redirect to `/pos/select` | Landing / Entry |
| `/pos/select` | Client Component | `RootLayout` | None | Pick active Pos from local storage |
| `/pos/[posId]` | Server Component | `PosShellLayout` | `ActivePosGuard` | Pos dashboard & statistics overview |
| `/pos/[posId]/intake` | Client Component | `PosShellLayout` | `ActivePosGuard` | Rapid offline evacuee registration |
| `/pos/[posId]/sync` | Client Component | `PosShellLayout` | `ActivePosGuard` | QR Code export & import manager |
| `@modal/(.)scanner` | Client Modal | Intercepted Modal | Camera Permission | Native camera QR scanner view |

### Route Navigation Graph
```mermaid
flowchart LR
  Root["Root Layout"] --> Splash["/ (Landing)"]
  Splash --> SelectPos["/pos/select"]
  SelectPos --> PosShell["Pos Shell Layout (/pos/[posId])"]
  
  PosShell --> Dashboard["/pos/[posId] (Overview)"]
  PosShell --> Intake["/pos/[posId]/intake (Form)"]
  PosShell --> SyncHub["/pos/[posId]/sync (QR Hub)"]
  
  SyncHub -.->|Intercepting Route| ScannerModal["@modal/(.)scanner"]
```

---

## 2. Server vs Client Component Hierarchy Tree

```mermaid
graph TD
  classDef server fill:#2563eb,stroke:#1d4ed8,color:#ffffff;
  classDef client fill:#10b981,stroke:#059669,color:#ffffff;
  classDef shared fill:#475569,stroke:#334155,color:#ffffff;

  subgraph Server_Tree ["React Server Components (RSC)"]
  DashboardPage["PosDashboardPage (/pos/[posId])"]:::server
  PosMetadataBanner["PosMetadataBanner (Camp Info)"]:::server
  StatsSummaryGrid["StatsSummaryGrid (Demographics)"]:::server
  end

  subgraph Client_Islands ["Client Components ('use client')"]
  SearchFilterBar["EvacueeSearchFilter (URL State)"]:::client
  EvacueeTable["OptimisticEvacueeTable"]:::client
  EvacueeRow["EvacueeTableRow (Quick Actions)"]:::client
  IntakeFAB["FloatingIntakeButton"]:::client
  QRCanvasModal["QRExportCanvasModal"]:::client
  ConflictModal["ConflictResolverModal"]:::client
  end

  subgraph Shared_Primitives ["Shared UI Primitives"]
  Badge["Badge (CVA: pending/synced)"]:::shared
  Button["Button (CVA)"]:::shared
  Dialog["Dialog (Radix Primitive)"]:::shared
  end

  DashboardPage --> PosMetadataBanner
  DashboardPage --> StatsSummaryGrid
  DashboardPage --> SearchFilterBar
  DashboardPage --> EvacueeTable
  DashboardPage --> IntakeFAB

  EvacueeTable --> EvacueeRow
  EvacueeRow --> Badge
  IntakeFAB --> Button
  DashboardPage --> QRCanvasModal
  DashboardPage --> ConflictModal
  QRCanvasModal --> Dialog
  ConflictModal --> Dialog
```

---

## 3. State Management & Data Fetching Architecture

### A. State Classification
- **Server Cache (`@tanstack/react-query`)**: Evacuee lists, pos details, query key factory: `evacueeKeys.list(posId)`.
- **Global UI Store (`zustand`)**: `useActivePosStore` (persisted in `localStorage` for offline session).
- **Offline Storage (`Tauri SQLite IPC`)**: Native Tauri commands (`invoke('save_evacuee')`, `invoke('get_unsynced_events')`).

### B. Optimistic Mutation Sequence
```mermaid
sequenceDiagram
  autonumber
  actor Vol as Field Volunteer
  participant Form as IntakeForm ('use client')
  participant Cache as TanStack Query Cache
  participant Tauri as Tauri SQLite Bridge

  Vol->>Form: Submits evacuee data
  Form->>Form: Validate with Zod
  Form->>Cache: onMutate: Snapshot & inject record with [PENDING] badge
  Cache-->>Vol: Instant table update (<16ms)
  
  Form->>Tauri: invoke('record_evacuee_intake', payload)
  alt Write Success
  Tauri-->>Form: Saved with permanent UUID
  Form->>Cache: Commit & update sync counter
  else Storage Failure
  Tauri-->>Form: Error (Disk / Constraint)
  Form->>Cache: onError: Rollback to previous cache snapshot
  Form-->>Vol: Show Error Banner: "Penyimpanan lokal gagal."
  end
```

---

## 4. Universal 6-State UI Matrix

| Component / View | 1. Skeleton Loading | 2. Empty State | 3. Success / Populated | 4. Error State | 5. Offline Badge | 6. Conflict Resolver |
|---|---|---|---|---|---|---|
| **Pos Dashboard Header** | Shimmer block for camp name & badges | "Pilih / Buat Posko Baru" banner | Camp name, RW, and active quota | Error banner with reload | "Mode Lapangan (Offline)" tag | N/A |
| **Evacuee Table** | 5-row pulse bars matching column widths | Illustration + "+ Daftarkan Pengungsi Pertama" CTA | Full sortable table with age/needs tags | Toast error + inline "Muat Ulang" | Yellow "Pending Sync" pill per row | Amber "Konflik Data" badge |
| **QR Export Modal** | Loading spinner on canvas generation | "Tidak ada data baru untuk diekspor" | Chunky QR canvas (Versi 15) with pagination | "Gagal encode QR" alert | Export works 100% offline | N/A |
| **Camera Scanner Modal** | Video stream placeholder spinner | N/A | Target reticle + optical alignment frame | "Akses kamera ditolak" + input PIN fallback | Buffer queue pill counter | Auto-triggers Diff Modal |

---

## 5. Form Schemas & Zod Contracts

```typescript
// src/features/evacuees/schemas/evacuee-schema.ts
import { z } from 'zod';

export const evacueeIntakeSchema = z.object({
  fullName: z.string().trim().min(3, 'Nama wajib diisi minimal 3 karakter'),
  nik: z.string().trim().regex(/^[0-9]{16}$/, 'NIK harus 16 digit').optional().or(z.literal('')),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(['M', 'F']),
  vulnerabilities: z.array(z.string()).default([]),
  urgentNeeds: z.array(z.string()).min(1, 'Pilih minimal 1 kebutuhan mendesak'),
  notes: z.string().max(500).optional(),
});

export type EvacueeIntakeValues = z.infer<typeof evacueeIntakeSchema>;
```

---

## 6. Phased Implementation Roadmap

- [ ] **Phase 1: Foundation & Shared UI Tokens** (Tailwind v4 theme setup, CVA Button, Badge, Modal primitives).
- [ ] **Phase 2: Offline SQLite IPC Integration** (Tauri Rust invoke bindings, Local event outbox bridge).
- [ ] **Phase 3: Evacuee Intake Flow & Optimistic Cache** (Zod form validation, TanStack Query optimistic mutation with rollback).
- [ ] **Phase 4: QR Export & Optical Scanner Modal** (Dynamic QR canvas generation, Tauri barcode scanner plugin integration).
- [ ] **Phase 5: Conflict Resolver UI & Accessibility Polish** (Side-by-side diff viewer, keyboard a11y, zero-CLS skeleton loading).
