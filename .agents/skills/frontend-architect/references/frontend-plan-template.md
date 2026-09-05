# Industrial-Grade Frontend Architecture Plan Template

Use this template when producing frontend architecture plans in `docs/frontend/<feature-name>-plan.md` or in planning artifacts.

---

```markdown
# Frontend Architecture Plan: [Feature / Module Name]

> **Target Framework**: Next.js 16 (App Router, React 19 RSC) + Tauri v2  
> **Styling**: Tailwind CSS v4 + Radix Primitives + CVA  
> **State & Data**: TanStack Query v5 + Zustand + Local-First SQLite  
> **Validation**: React Hook Form + Zod  

---

## 1. Route Inventory & Layout Architecture

| Route Path | Type | Layout Wrapper | Auth / Guard | Primary Purpose |
|---|---|---|---|---|
| `/pos/[posId]` | Server Page | `PosLayout` | `ActivePosGuard` | Dashboard overview & summary stats |
| `/pos/[posId]/intake` | Client Page | `PosLayout` | `ActivePosGuard` | Evacuee multi-step registration |
| `@modal/(.)scanner` | Intercepting Modal | Root | Camera Permission | Optical QR & barcode scanner modal |

### Route Navigation Graph
```mermaid
flowchart LR
  %% Insert Mermaid route navigation graph
```

---

## 2. Server vs Client Component Tree

```mermaid
graph TD
  %% Insert Server (RSC) vs Client ('use client') component hierarchy tree
```

---

## 3. Component Contracts & Props Specifications

### `[FeatureName]List`
- **Location**: `src/features/[feature]/components/[feature]-list.tsx`
- **Type**: Server Component (with Client leaf wrappers)
- **Props**:
  ```typescript
  interface FeatureListProps {
  posId: string;
  searchQuery?: string;
  }
  ```

### `[FeatureName]Form`
- **Location**: `src/features/[feature]/components/[feature]-form.tsx`
- **Type**: Client Component (`'use client'`)
- **State**: React Hook Form + Zod resolver
- **Events**: `onSubmitSuccess(id: string) => void`, `onCancel() => void`

---

## 4. State Management & Data Fetching Plan

### A. TanStack Query Keys & Fetch Pipelines
- Query keys factory definition.
- Query caching & stale time configuration.

### B. Optimistic UI Mutations
- Mutation pipeline with `onMutate` cache snapshot and `onError` rollback.

### C. Native Tauri IPC Bridges (If Applicable)
- IPC commands: `invoke('save_record', payload)`.
- Camera scanner listener.

---

## 5. Universal 6-State UI Matrix

| Screen / Component | 1. Skeleton Loading | 2. Empty State | 3. Success / Populated | 4. Error State | 5. Offline Badge | 6. Conflict Resolver |
|---|---|---|---|---|---|---|
| **Pos Dashboard** | Pulse card skeletons | "Belum ada data" CTA | Full metric stats | Toast + Retry | Top banner | N/A |
| **Evacuee Table** | Table row pulses | Illustration + CTA | Paginated rows | Inline retry | Sync status tag | Diff Modal |
| **QR Scanner** | Camera loader | N/A | Target reticle | Permission denied | Offline buffer | Auto-prompt |

---

## 6. Form Schemas & Validation Rules

```typescript
// Zod Schema Definition
export const formSchema = z.object({
  // fields ...
});
```

---

## 7. Phased Implementation Roadmap

- [ ] **Phase 1: Foundation & Shared UI** (Design tokens, CVA primitives, base layout).
- [ ] **Phase 2: Local Database & Server Actions** (SQLite IPC bridge, query key factories).
- [ ] **Phase 3: Interactive Client Leaves & Forms** (React Hook Form, Zod, optimistic mutations).
- [ ] **Phase 4: Scanner & Offline Sync Integration** (Tauri barcode plugin, QR canvas, sync status badges).
- [ ] **Phase 5: 6-State UI Hardening & a11y** (Skeletons, empty states, error boundaries, keyboard focus).
```
