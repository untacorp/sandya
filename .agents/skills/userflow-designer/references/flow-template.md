# Standard User Flow Specification Template

Use this template when producing user flow documents in `docs/userflows/<flow-name>.md` or in planning artifacts.

---

```markdown
# User Flow: [Feature / Flow Name]

> **Status**: [Draft / In Review / Approved]  
> **Target Persona(s)**: [e.g., Pos Volunteer, Camp Coordinator, Org Admin]  
> **Core Objective (JTBD)**: [What goal does this flow achieve?]  
> **Context & Environment**: [e.g., Offline-first mobile app, Web Admin Dashboard]  

---

## 1. Flow Overview & Scope

### In Scope
- [Capability or screen covered]
- [Capability or screen covered]

### Out of Scope
- [Items deferred to separate flows]

### Preconditions
- [What must be established before entering this flow? e.g., User is logged in, Pos is selected]

### Postconditions
- [What is the final state of data and UI upon completion?]

---

## 2. Macro Journey Map (High-Level)

```mermaid
flowchart LR
    A([1. Entry Point]) --> B([2. Core Action])
    B --> C([3. Processing / Verification])
    C --> D([4. Final Outcome])
```

---

## 3. Detailed Micro Flow & Logic Branching

```mermaid
flowchart TD
    %% Insert detailed flowchart with decision branches, UI screens, and DB writes
```

---

## 4. Step-by-Step Interaction Table

| Step # | Screen / Route | Actor Action | System / Local DB Response | Notes & Validations |
|---|---|---|---|---|
| **1.0** | `/pos/dashboard` | Taps "Add New Entry" | Opens intake form modal with default timestamps | Pre-fills current Pos ID |
| **1.1** | `/pos/intake` | Fills name, NIK, health status and clicks "Save" | Saves record to local DB; adds event to unsynced outbox queue | Validates NIK length (16 digits) |
| **1.2** | `/pos/intake` | Form submission completes | Shows success toast; returns to pos list with badge "Pending Sync" | Offline resilient |

---

## 5. Edge Cases & Exception Handling Matrix

| Trigger / Condition | Failure Mode | UX Behavior / Recovery Path |
|---|---|---|
| **No Camera Permission** | Cannot scan QR code | Show inline permission explainer modal with fallback to manual 6-digit pos code entry |
| **Conflicting Record Version** | Record modified on multiple offline devices | Open side-by-side Conflict Resolution Dialog allowing field-level merge |
| **Corrupted QR Payload** | QR frame dropped or unreadable | Display alert "Invalid QR Data" with instruction to re-export or scan from brighter screen |
| **Storage Full** | Local IndexedDB / SQLite quota hit | Show warning banner, prompt export to external file/backup |

---

## 6. Screen & Route Inventory

| Screen Name | Route / Modal ID | Primary Components | Key Actions |
|---|---|---|---|
| **Pos Intake Screen** | `/pos/[id]/intake` | Header with Pos info, Dynamic Intake Form, Offline Badge | Save, Cancel, Scan Barcode |
| **QR Export Modal** | `#modal-qr-export` | Dynamic QR Canvas, Compression Selector, Page Selector | Next Chunk, Download PNG, Close |
| **Conflict Resolver** | `#modal-conflict-resolve` | Diff Viewer, Field Pickers, Merge Button | Overwrite, Keep Local, Keep Remote |

---

## 7. Technical & Architectural Dependencies

- **Local Storage Engine**: [e.g., IndexedDB / SQLite / LocalStorage]
- **Sync Protocol**: [e.g., Event-sourcing log, CRDT, QR compressed JSON payload]
- **Hardware Integrations**: [e.g., `@tauri-apps/plugin-barcode-scanner`, Camera API]
- **Security / Permissions**: [e.g., Ed25519 payload signature, Role RBAC]
```
