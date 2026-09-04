# API & Contract Design Guide

This guide details standards for designing strictly typed, robust, and resilient API contracts across **REST**, **tRPC**, **GraphQL**, **Next.js Server Actions**, and **WebSockets / SSE**.

---

## 🛡️ 1. Universal Error Taxonomy: RFC 7807 Problem Details

All API delivery protocols must translate domain & application errors into standard **RFC 7807** Problem Details:

```json
{
  "type": "https://api.sanidya.id/errors/insufficient-stock",
  "title": "Insufficient Logistics Stock",
  "status": 422,
  "detail": "Requested 50 blankets, but POS-ALPHA only has 12 available.",
  "instance": "/api/v1/logistics/dispatches/req-9872",
  "code": "INSUFFICIENT_STOCK",
  "timestamp": "2026-09-03T23:30:00.000Z",
  "invalid_params": [
    {
      "name": "quantity",
      "reason": "Must be less than or equal to available stock (12)"
    }
  ]
}
```

### TypeScript Standard RFC 7807 Problem Response
```typescript
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
  timestamp: string;
  invalid_params?: Array<{ name: string; reason: string }>;
}
```

---

## ⚡ 2. GraphQL Schema & Resolver Architecture

When building or exposing GraphQL APIs:

### A. Schema Definition (SDL)
- Use strong scalar types (`UUID`, `DateTime`, `JSON`).
- Follow Relay-style connection patterns for cursor-based pagination.
- Provide explicit error unions or payload objects for mutations.

```graphql
scalar DateTime
scalar UUID

type Query {
  evacuee(id: UUID!): Evacuee
  evacuees(posId: UUID!, first: Int = 20, after: String): EvacueeConnection!
}

type Mutation {
  registerEvacuee(input: RegisterEvacueeInput!): RegisterEvacueePayload!
  dispatchAidPackage(input: DispatchAidInput!): DispatchAidPayload!
}

type Subscription {
  evacueeStatusUpdated(posId: UUID!): Evacuee!
}

type EvacueeConnection {
  edges: [EvacueeEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type EvacueeEdge {
  cursor: String!
  node: Evacuee!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

### B. DataLoader for N+1 Query Prevention
Never perform nested database queries in field resolvers without batching. Use `DataLoader`:

```typescript
import DataLoader from 'dataloader';

export function createEvacueeDataLoader(db: DatabaseClient) {
  return new DataLoader<string, EvacueeRecord[]>(async (posIds) => {
    const rows = await db.query.evacuees.findMany({
      where: inArray(evacuees.posId, posIds as string[]),
    });
    
    // Group rows by posId
    const map = new Map<string, EvacueeRecord[]>();
    for (const id of posIds) map.set(id, []);
    for (const row of rows) map.get(row.posId)?.push(row);
    
    return posIds.map((id) => map.get(id) ?? []);
  });
}
```

### C. Query Complexity & Depth Limiting
Protect GraphQL endpoints against Denial-of-Service (DoS) and deeply nested malicious queries:
- **Max Depth Rule**: Limit recursive queries to a maximum depth (e.g. 5-7 levels).
- **Cost / Complexity Analysis**: Assign cost points to fields and reject queries exceeding 1000 complexity points.

---

## 🌐 3. REST API Contract & Zod Validation

Standard REST endpoints must be explicit in routing, HTTP verbs, status codes, and input/output contracts.

```typescript
// src/interfaces/http/schemas/evacuee.schema.ts
import { z } from 'zod';

export const RegisterEvacueeRequestSchema = z.object({
  posId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  nationalId: z.string().regex(/^\d{16}$/, 'National ID must be 16 digits').optional(),
  age: z.number().int().min(0).max(150),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  vulnerabilityFlags: z.array(z.enum(['ELDERLY', 'PREGNANT', 'INFANT', 'DISABILITY'])).default([]),
  specialNeeds: z.string().max(500).optional(),
});

export type RegisterEvacueeRequest = z.infer<typeof RegisterEvacueeRequestSchema>;
```

### REST Route Definition Matrix
| Method | Endpoint | Description | Status Code | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/pos/:posId/evacuees` | Register new evacuee | `201 Created` | PosOperator, Admin |
| `GET` | `/api/v1/pos/:posId/evacuees` | List evacuees (Cursor paginated) | `200 OK` | FieldWorker, Admin |
| `GET` | `/api/v1/evacuees/:id` | Get evacuee details | `200 OK` | FieldWorker, Admin |
| `PATCH` | `/api/v1/evacuees/:id/status` | Update status (State transition) | `200 OK` | PosOperator, Admin |
| `DELETE`| `/api/v1/evacuees/:id` | Soft delete evacuee | `204 No Content` | Admin |

---

## 🔒 4. Idempotency Key Mechanics

To prevent duplicate mutations during network timeouts or retry storms:
1. Client generates a unique `Idempotency-Key` (UUIDv7) in request headers.
2. Backend acquires a distributed lock in Redis: `SET lock:idempotency:<key> <nodeId> NX EX 30`.
3. If key already exists in cache `idempotency:response:<key>`, return the cached HTTP response immediately (`200/201` with `X-Cache: HIT`).
4. If new, process the transaction, store the result in Redis with 24h TTL, and return response.

```
Client                      Backend API                    Redis Cache & DB
  │                              │                                │
  ├── POST /dispatches ─────────►│                                │
  │   Idempotency-Key: uuid-123  ├── Check Cache / Lock ─────────►│
  │                              │◄── Key Not Found (Acquire Lock)│
  │                              │                                │
  │                              ├── Execute ACID Transaction ───►│ (DB Commit)
  │                              ├── Save Response to Cache ─────►│ (TTL 24h)
  │◄── 201 Created (Result) ─────┤                                │
  │                              │                                │
  │ (Network timeout / Retry)    │                                │
  ├── POST /dispatches ─────────►│                                │
  │   Idempotency-Key: uuid-123  ├── Check Cache ────────────────►│
  │                              │◄── HIT: Return Cached Result ──┤
  │◄── 201 Created (Cached) ─────┤                                │
```

---

## 🔄 5. Next.js Server Actions & tRPC Routers

### tRPC Type-Safe Procedure
```typescript
export const evacueeRouter = router({
  register: protectedProcedure
    .input(RegisterEvacueeRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const useCase = ctx.container.resolve(RegisterEvacueeUseCase);
      const result = await useCase.execute({
        ...input,
        actorId: ctx.session.userId,
      });
      return result;
    }),
});
```

### Next.js Server Action with Safe Action Client
```typescript
'use server';

import { actionClient } from '@/lib/safe-action';
import { RegisterEvacueeRequestSchema } from './evacuee.schema';

export const registerEvacueeAction = actionClient
  .schema(RegisterEvacueeRequestSchema)
  .action(async ({ parsedInput, ctx }) => {
    const useCase = ctx.container.resolve(RegisterEvacueeUseCase);
    return await useCase.execute({
      ...parsedInput,
      actorId: ctx.user.id,
    });
  });
```
