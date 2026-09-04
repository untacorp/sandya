# The 6-State UI Matrix & Form Architecture Guide

An industrial-grade frontend plan guarantees that user interfaces never render unhandled blank screens, uncaught exception crashes, or jarring layout shifts.

---

## 1. The Universal 6-State UI Matrix

Every route, modal, and primary data component must explicitly document the following 6 states:

```
┌─────────────────────────────────────────────────────────────┐
│                 THE 6 ESSENTIAL UI STATES                   │
├─────────────┬──────────────────────────┬────────────────────┤
│ State       │ Purpose                  │ Design Requirement │
├─────────────┼──────────────────────────┼────────────────────┤
│ 1. Loading  │ Data being fetched       │ Dimension-accurate │
│    Skeleton │                          │ layout skeleton    │
├─────────────┼──────────────────────────┼────────────────────┤
│ 2. Empty    │ Zero records returned    │ Visual illustration│
│    State    │                          │ + Primary CTA      │
├─────────────┼──────────────────────────┼────────────────────┤
│ 3. Success  │ Standard populated view  │ Fully interactive  │
│    Path     │                          │ accessible layout  │
├─────────────┼──────────────────────────┼────────────────────┤
│ 4. Error    │ Network/Validation error │ User-friendly text │
│    State    │                          │ + 'Coba Lagi' CTA  │
├─────────────┼──────────────────────────┼────────────────────┤
│ 5. Offline  │ Device disconnected      │ Top warning banner │
│    State    │                          │ + Optimistic badges│
├─────────────┼──────────────────────────┼────────────────────┤
│ 6. Conflict │ Divergent peer data      │ Side-by-side diff  │
│    Resolver │                          │ resolution modal   │
└─────────────┴──────────────────────────┴────────────────────┘
```

---

## 2. Specification Standards per State

### State 1: Skeleton Loading (Zero Cumulative Layout Shift / CLS)
- Skeleton components MUST match the exact height, grid columns, and aspect ratio of the populated component:
```tsx
export function EvacueeTableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-muted/60 rounded-md" /> {/* Table header */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted/30 rounded-md" />
      ))}
    </div>
  );
}
```

### State 2: Empty State with Actionable CTA
- Never show a bare empty table. Always provide an icon, explanatory heading, supportive text, and a prominent action button:
```tsx
export function EvacueeEmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl">
      <UsersIcon className="w-12 h-12 text-muted-foreground mb-3" />
      <h3 className="text-lg font-semibold">Belum Ada Pengungsi Terdaftar</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        Mulai pendataan pengungsi di posko ini untuk memantau kebutuhan logistik dan kesehatan.
      </p>
      <Button onClick={onAddClick}>+ Tambah Pengungsi Pertama</Button>
    </div>
  );
}
```

### State 4: Error State with Inline Recovery
- Provide an inline fallback with a retry trigger rather than crashing the whole screen:
```tsx
export function EvacueeErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
      <AlertTriangleIcon className="w-8 h-8 text-destructive mx-auto mb-2" />
      <h4 className="font-semibold text-destructive">Gagal Memuat Data</h4>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Coba Muat Ulang
      </Button>
    </div>
  );
}
```

---

## 3. Form Validation Architecture: React Hook Form + Zod

Define strict domain schemas with Zod and pass them into React Hook Form via `@hookform/resolvers/zod`:

```typescript
// src/features/evacuees/schemas/evacuee-form-schema.ts
import { z } from 'zod';

export const evacueeFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama terlalu panjang'),
  nik: z
    .string()
    .trim()
    .regex(/^[0-9]{16}$/, 'NIK harus 16 digit angka')
    .optional()
    .or(z.literal('')),
  age: z
    .coerce
    .number({ invalid_type_error: 'Usia harus berupa angka' })
    .int()
    .min(0, 'Usia minimal 0')
    .max(130, 'Usia tidak valid'),
  gender: z.enum(['M', 'F'], { required_error: 'Pilih jenis kelamin' }),
  vulnerabilities: z.array(z.string()).default([]),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

export type EvacueeFormValues = z.infer<typeof evacueeFormSchema>;
```
