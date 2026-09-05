# State Management & Data Fetching Architecture

This guide establishes the rules for managing client state, server caching, optimistic mutations, and native Tauri IPC bridges.

---

## 1. The 4-Layer State Classification Model

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SERVER STATE (TanStack Query v5)                         │
│ • Remote API data, async cache, deduplication, revalidation │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 2. GLOBAL UI STATE (Zustand)                                │
│ • Active Pos selection, Scanner modal open/closed, Theme   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 3. EDGE / LOCAL-FIRST PERSISTENCE (SQLite / IndexedDB)      │
│ • Offline event outbox, encrypted tokens, cached forms     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 4. URL SEARCH STATE (nuqs / useSearchParams)                │
│ • Tab navigation, search queries, active filter parameters  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. TanStack Query: Query Key Factories & Optimistic Mutations

### A. Query Key Factory Pattern
```typescript
// src/features/evacuees/api/query-keys.ts
export const evacueeKeys = {
  all: ['evacuees'] as const,
  lists: () => [...evacueeKeys.all, 'list'] as const,
  list: (posId: string, filters?: Record<string, unknown>) =>
  [...evacueeKeys.lists(), posId, filters ?? {}] as const,
  details: () => [...evacueeKeys.all, 'detail'] as const,
  detail: (id: string) => [...evacueeKeys.details(), id] as const,
};
```

### B. Optimistic Mutation Pipeline with Automatic Rollback
```typescript
// src/features/evacuees/hooks/use-create-evacuee-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evacueeKeys } from '../api/query-keys';
import type { Evacuee, CreateEvacueeInput } from '../types';

export function useCreateEvacueeMutation(posId: string) {
  const queryClient = useQueryClient();

  return useMutation({
  mutationFn: async (newRecord: CreateEvacueeInput) => {
  // Calls local SQLite IPC via Tauri or Next.js Server Action
  const res = await fetch(`/api/pos/${posId}/evacuees`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newRecord),
  });
  if (!res.ok) throw new Error('Gagal menyimpan data pengungsi');
  return res.json() as Promise<Evacuee>;
  },
  // 1. When mutation starts: Cancel outgoing queries & snapshot previous data
  onMutate: async (newRecord) => {
  await queryClient.cancelQueries({ queryKey: evacueeKeys.list(posId) });
  const previousData = queryClient.getQueryData<Evacuee[]>(evacueeKeys.list(posId));

  // Optimistically update cache with temporary UUID
  const optimisticEvacuee: Evacuee = {
  id: `temp-${Date.now()}`,
  posId,
  nik: newRecord.nik,
  fullName: newRecord.fullName,
  age: newRecord.age,
  gender: newRecord.gender,
  syncStatus: 'PENDING',
  createdAt: new Date().toISOString(),
  };

  queryClient.setQueryData<Evacuee[]>(evacueeKeys.list(posId), (old = []) => [
  optimisticEvacuee,
  ...old,
  ]);

  return { previousData };
  },
  // 2. On error: Roll back to previous snapshot
  onError: (_err, _newRecord, context) => {
  if (context?.previousData) {
  queryClient.setQueryData(evacueeKeys.list(posId), context.previousData);
  }
  },
  // 3. Always refetch after error or success to synchronize with true database state
  onSettled: () => {
  queryClient.invalidateQueries({ queryKey: evacueeKeys.list(posId) });
  },
  });
}
```

---

## 3. Zustand Global Client State Pattern

```typescript
// src/features/pos-management/stores/use-active-pos-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ActivePosState {
  activePosId: string | null;
  activePosName: string | null;
  setActivePos: (id: string, name: string) => void;
  clearActivePos: () => void;
}

export const useActivePosStore = create<ActivePosState>()(
  persist(
  (set) => ({
  activePosId: null,
  activePosName: null,
  setActivePos: (id, name) => set({ activePosId: id, activePosName: name }),
  clearActivePos: () => set({ activePosId: null, activePosName: null }),
  }),
  {
  name: 'sandya_active_pos',
  storage: createJSONStorage(() => localStorage),
  }
  )
);
```

---

## 4. Tauri v2 Native Bridge Integration Pattern

When running inside Tauri (desktop / mobile app), wrap Tauri APIs with runtime platform guards:

```typescript
// src/shared/lib/tauri-bridge.ts
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function scanBarcodeNative(): Promise<string | null> {
  if (!isTauriEnvironment()) {
  console.warn('Native scanner not available in pure browser; falling back to web camera');
  return null;
  }

  const { scan } = await import('@tauri-apps/plugin-barcode-scanner');
  const result = await scan({ windowed: false, formats: ['QRCode'] });
  return result?.content ?? null;
}
```
