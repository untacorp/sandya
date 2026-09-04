# Component Architecture & Server/Client Boundary Design

This guide details best practices for structuring React 19 / Next.js 16 applications with clean Server Component boundaries, Feature-Sliced Design (FSD), and reusable UI contracts.

---

## 1. Next.js 16 Server Component (RSC) vs Client Component Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│              SERVER COMPONENT TREE (Default)                │
│ • Zero client bundle footprint (0 KB JS shipped to browser) │
│ • Direct access to server databases / filesystem            │
│ • Secure: Secrets, DB queries, private API keys             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                       Pass Props / Children
                               │
┌──────────────────────────────▼──────────────────────────────┐
│            CLIENT COMPONENT LEAF NODES ('use client')       │
│ • Interactive forms, stateful buttons, modal triggers       │
│ • Browser APIs: Camera scanner, QR Canvas, LocalStorage     │
│ • Tauri v2 IPC: invoke() commands, native notifications    │
└─────────────────────────────────────────────────────────────┘
```

### The Golden Rule: "Push `'use client'` to the Leaves"

```tsx
// ❌ ANTI-PATTERN: Marking the entire page as client component pulls huge bundles to client
'use client';
export default function PosPage({ params }: { params: { posId: string } }) {
  // DB queries done via client fetch ...
}

// ✅ INDUSTRIAL PATTERN: Server Page fetches data; Client Island handles interactivity
// src/app/(pos)/[posId]/page.tsx (Server Component)
import { Suspense } from 'react';
import { PosHeader } from '@/features/pos/components/pos-header';
import { EvacueeListServer } from '@/features/evacuees/components/evacuee-list-server';
import { EvacueeListSkeleton } from '@/features/evacuees/components/evacuee-list-skeleton';
import { QuickIntakeModalTrigger } from '@/features/evacuees/components/quick-intake-modal-trigger'; // Client

export default async function PosPage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;

  return (
    <div className="space-y-6 p-6">
      <PosHeader posId={posId} />
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Daftar Pengungsi</h2>
        <QuickIntakeModalTrigger posId={posId} />
      </div>
      <Suspense fallback={<EvacueeListSkeleton />}>
        <EvacueeListServer posId={posId} />
      </Suspense>
    </div>
  );
}
```

---

## 2. Feature-Sliced Folder Structure

Organize code by business domain rather than generic technical categories:

```
src/
├── app/                              # Next.js App Router (Routing & Layouts only)
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/layout.tsx
│   └── (pos)/[posId]/
│       ├── page.tsx
│       └── intake/page.tsx
├── features/                         # Domain Feature Modules
│   ├── evacuees/
│   │   ├── api/                      # Server Actions / Fetch hooks
│   │   ├── components/               # Domain-specific UI components
│   │   ├── hooks/                    # Custom feature hooks (e.g. useEvacueeFilter)
│   │   ├── schemas/                  # Zod validation schemas
│   │   └── types/                    # Feature TypeScript interfaces
│   ├── pos-management/
│   ├── qr-sync/
│   └── scanner/
└── shared/                           # Reusable / Non-domain-specific code
    ├── ui/                           # Primitives (Button, Modal, Input, Badge, Table)
    ├── lib/                          # Utilities (cn, formatters, crypto)
    └── hooks/                        # Generic hooks (useDebounce, useOnlineStatus)
```

---

## 3. Standardized Component Contract Pattern

Every reusable component defines its contract with TypeScript interfaces and `class-variance-authority` (CVA):

```tsx
// src/shared/ui/badge.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        success: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        warning: 'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        outline: 'text-foreground border border-border',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.25',
        md: 'text-xs px-2.5 py-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1 -ml-0.5">{icon}</span>}
      {children}
    </div>
  );
}
```
