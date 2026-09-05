# Mermaid Diagrams Guide for Frontend Architecture

This guide defines standard Mermaid patterns for visualizing route structures, Server/Client component trees, and UI data-flow sequences.

---

## 1. Route Navigation & Layout Graph

Use `flowchart LR` to map URL routes, middleware guards, and nested layouts.

```mermaid
flowchart LR
  RootLayout["Root Layout (src/app/layout.tsx)"] --> AuthGuard{"Auth / Role Guard"}
  
  AuthGuard -->|Unauthenticated| LoginPage["/login (Auth Layout)"]
  AuthGuard -->|Authenticated| AppLayout["App Layout (src/app/(app)/layout.tsx)"]
  
  AppLayout --> PosSelect["/pos/select"]
  PosSelect --> PosLayout["Pos Layout (/pos/[id]/layout.tsx)"]
  
  PosLayout --> Dashboard["/pos/[id] (Dashboard)"]
  PosLayout --> Intake["/pos/[id]/intake (Form)"]
  PosLayout --> Sync["/pos/[id]/sync (QR Export/Import)"]
  
  Sync -.->|Intercepting Route| ScannerModal["@modal/(.)scanner"]
```

---

## 2. Server vs Client Component Hierarchy Tree

Use `graph TD` with clear visual demarcation between **Server Components (RSC)** and **Client Components ('use client')**.

```mermaid
graph TD
  classDef server fill:#2563eb,stroke:#1d4ed8,color:#ffffff;
  classDef client fill:#10b981,stroke:#059669,color:#ffffff;
  classDef shared fill:#64748b,stroke:#475569,color:#ffffff;

  subgraph Server_Tree ["React Server Components (RSC)"]
  Page["PosDashboardPage (/pos/[id])"]:::server
  Header["PosHeader (Metadata & Stats)"]:::server
  StatsGrid["EvacueeStatsCards"]:::server
  end

  subgraph Client_Tree ["Client Interactive Islands ('use client')"]
  SearchFilter["EvacueeSearchBar (URL Synced)"]:::client
  Table["FilterableEvacueeTable"]:::client
  Row["EvacueeRow (Optimistic Actions)"]:::client
  IntakeTrigger["OpenIntakeModalButton"]:::client
  QRModal["QRExportModal (Dynamic Canvas)"]:::client
  end

  subgraph Shared_Primitives ["Shared UI Primitives"]
  Button["Button (CVA)"]:::shared
  Badge["Badge (Sync Status)"]:::shared
  Dialog["Dialog (Radix Primitive)"]:::shared
  end

  Page --> Header
  Page --> StatsGrid
  Page --> SearchFilter
  Page --> Table
  Table --> Row
  Page --> IntakeTrigger
  Page --> QRModal

  Row --> Badge
  IntakeTrigger --> Button
  QRModal --> Dialog
```

---

## 3. UI Data-Flow & Optimistic Mutation Sequence Diagram

Use `sequenceDiagram` to show UI actions, optimistic cache updates, IPC calls, and rollback logic.

```mermaid
sequenceDiagram
  autonumber
  actor User as Field Volunteer
  participant UI as IntakeForm ('use client')
  participant Cache as TanStack Query Cache
  participant Bridge as Tauri IPC / Server Action
  participant SQLite as Local SQLite DB

  User->>UI: Fills form & taps "Simpan Data"
  UI->>UI: Validates with Zod schema
  
  UI->>Cache: 1. onMutate: Snapshot cache & inject optimistic item (Status: PENDING)
  Cache-->>UI: Instantly updates table UI (Zero latency)
  
  UI->>Bridge: 2. invoke('save_evacuee', payload)
  Bridge->>SQLite: Insert record into local_evacuees & events_outbox
  
  alt SQLite Write Success
  SQLite-->>Bridge: 200 OK (Committed)
  Bridge-->>UI: Returns saved record with permanent UUID
  UI->>Cache: Invalidate & replace temp ID with permanent ID
  else Write Error (Disk Full / Constraint)
  SQLite-->>Bridge: Error (Transaction Rolled Back)
  Bridge-->>UI: 500 Error
  UI->>Cache: onError: Roll back cache to previous snapshot
  UI-->>User: Show toast error: "Gagal menyimpan. Coba lagi."
  end
```
