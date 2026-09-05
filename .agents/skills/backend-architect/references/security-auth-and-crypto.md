# Security, Authentication & Cryptography Guide

This guide establishes defense-in-depth security standards, authentication/authorization models, cryptographic standards, and rate limiting for backend systems.

---

##  1. Authentication Architecture

### A. Web / Dashboard Sessions (HTTP-Only Secure Cookies)
- Store session identifiers in encrypted, `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
- Maintain active sessions in Redis or the database to support instantaneous single-device or global session revocation.

### B. Mobile / Native Desktop / Edge Workers (JWT + Sliding Refresh Tokens)
- **Access Token**: Short-lived (15 minutes), signed with **Ed25519 (Asymmetric EdDSA)** or **RS256**.
- **Refresh Token**: Long-lived (7–30 days), stored hashed (`Argon2id` or `SHA-256`) in database. Rotated on every use with reuse detection (invalidates entire refresh token family if a stolen token is replayed).

### C. Machine-to-Machine / Edge Field Nodes (API Keys)
- Standard format: `<prefix>_<random_entropy>` (e.g., `sny_live_8f3a9e21b...`).
- Only store `SHA-256` hashes in the database. The plain API key is shown to the operator once upon generation.

---

##  2. Authorization: RBAC & ABAC Permission Matrix

Never perform authorization by checking loose role strings directly in controller routes (e.g. `if (user.role === 'admin')`). Instead, evaluate explicit **Permissions & Resource Scopes**.

### RBAC Permission Matrix Example

| Role | Domain Scope | Permissions Allowed |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | `*` | `*` (Full System Access) |
| `POS_COMMANDER` | `pos:current` | `pos:update`, `evacuee:register`, `evacuee:update`, `logistics:request`, `logistics:receive` |
| `FIELD_OPERATOR`| `pos:current` | `evacuee:register`, `evacuee:read`, `logistics:view` |
| `CENTRAL_COORDINATOR`| `org:current` | `pos:view_all`, `logistics:approve`, `logistics:dispatch`, `reports:generate` |
| `READONLY_AUDITOR`| `org:current` | `*:read` |

### ABAC (Attribute-Based Access Control) Enforcement
```typescript
export interface AuthContext {
  userId: string;
  orgId: string;
  posId?: string;
  roles: string[];
  permissions: Set<string>;
}

export function canAccessPos(ctx: AuthContext, targetPosId: string): boolean {
  if (ctx.permissions.has('pos:admin')) return true;
  return ctx.posId === targetPosId;
}
```

---

##  3. Cryptography & Digital Signatures

Modern backend systems (especially those handling offline data packets, audit trails, or disaster field sync) require strong cryptographic primitives:

### A. Digital Signatures: Ed25519 (Edwards-curve Digital Signature Algorithm)
- **Why**: 64-byte ultra-compact signatures, extremely fast verification, immunity to side-channel timing attacks.
- **Use Case**: Signing offline mutation packets (QR/Mesh) at the field node so Central can mathematically verify author authenticity without an internet connection.

```typescript
import * as ed from '@noble/ed25519';

export async function signPayload(privateKeyBytes: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  return await ed.signAsync(message, privateKeyBytes);
}

export async function verifyPayloadSignature(
  signature: Uint8Array,
  message: Uint8Array,
  publicKeyBytes: Uint8Array
): Promise<boolean> {
  return await ed.verifyAsync(signature, message, publicKeyBytes);
}
```

### B. Password Hashing: Argon2id
- Standard: Argon2id with memory cost = 64 MB (`m=65536`), iterations = 3 (`t=3`), parallelism = 4 (`p=4`).
- NEVER use MD5, SHA-1, or plain SHA-256 for passwords.

### C. Data-at-Rest Field Encryption: AES-256-GCM
- Encrypt sensitive Personally Identifiable Information (PII) like National ID or medical triage notes before storing in the database.
- Always include a unique 96-bit Initial Vector (IV / Nonce) and Authentication Tag for each encrypted record.

---

##  4. Sliding Window Rate Limiting

Protect endpoints from credential stuffing and DoS attacks using Redis Sliding Window logs:

```typescript
import { Redis } from 'ioredis';

export async function checkRateLimit(
  redis: Redis,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const clearBefore = now - windowSeconds * 1000;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, clearBefore);
  multi.zadd(key, now, `${now}-${Math.random()}`);
  multi.zcard(key);
  multi.expire(key, windowSeconds);

  const results = await multi.exec();
  const count = results?.[2]?.[1] as number;

  return {
  allowed: count <= limit,
  remaining: Math.max(0, limit - count),
  };
}
```
