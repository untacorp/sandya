# Database Modeling Methodology & Best Practices

This guide establishes the foundational principles of relational and multi-tenant data modeling for enterprise and mission-critical applications.

---

## 1. Primary Key Strategy: The Case for UUIDv7 / ULID

Traditional autoincrementing integers (`BIGSERIAL` / `IDENTITY`) suffer from three critical flaws in modern architectures:
1. **Unsafe for Offline / Distributed Edge Generation**: Client devices cannot generate IDs without contacting a central server, causing ID collisions when syncing offline records.
2. **Security & Data Scraping Vulnerability**: Sequential IDs leak business volume (e.g. `/orders/1024` reveals total order count) and enable easy sequential enumeration attacks.
3. **Multi-Region / Sharding Bottlenecks**: Autoincrement sequences require central coordination or complex offset configurations.

Conversely, legacy **UUIDv4 (Random)** causes severe **B-Tree Page Fragmentation** and cache thrashing during high-volume inserts because randomly distributed keys force constant rebalancing of index pages.

### The Standard: UUIDv7 (RFC 9562) & ULID
- **Structure**: 48-bit UNIX timestamp (millisecond precision) + 74 bits of cryptographically secure random entropy.
- **Benefits**:
  - **Monotonically Increasing / Time-Ordered**: Near-zero B-Tree page fragmentation, matching the insert performance of sequential integers.
  - **Client-Generatable**: Field devices and browsers can generate unique IDs offline with mathematical guarantee against collision.
  - **Natively Supported**: Directly stored as 16-byte `uuid` in PostgreSQL and `BLOB(16)` or `TEXT(36)` in SQLite.

```sql
-- PostgreSQL 16+ / pg_uuidv7
CREATE TABLE evacuees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    ...
);
```

---

## 2. Normalization vs Strategic Denormalization

### Baseline Normalization: Third Normal Form (3NF)
- **1NF**: Atomic values per column, no repeating groups.
- **2NF**: All non-key attributes fully dependent on the primary key (no partial key dependencies).
- **3NF**: No transitive dependencies (non-key attributes depend *only* on the primary key, not on other non-key attributes).

### When to Strategically Denormalize (With Guardrails):
1. **Immutable Snapshots / Audit Records**:
   - Order line items must duplicate product name and price at time of purchase (`unit_price_at_purchase NUMERIC(12,2) NOT NULL`), because catalog prices will change later.
   - Evacuee relief delivery must snapshot the person's status at the moment of distribution.
2. **High-Frequency Read Counters**:
   - Storing `active_evacuee_count INT NOT NULL DEFAULT 0` on `pos_locations` table is acceptable **only if maintained by database triggers** or strict transactional increments to prevent race condition drift.
3. **JSONB for Semi-Structured / Dynamic Extensible Metadata**:
   - Use `metadata JSONB NOT NULL DEFAULT '{}'::jsonb` for dynamic sensor data or custom org attributes, while keeping core queryable attributes in typed columns.

---

## 3. Soft-Delete Engineering & Partial Unique Indexes

Naive soft-delete (`deleted_at TIMESTAMP`) frequently introduces catastrophic data integrity bugs:

```sql
-- BUG: If a user soft-deletes their account, they cannot re-register with the same email!
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL, -- ❌ BREAKS SOFT DELETE
    deleted_at TIMESTAMPTZ
);
```

### The Correct Industrial Pattern: Partial Unique Indexes

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- ✅ Enforces uniqueness ONLY among active (non-deleted) records:
CREATE UNIQUE INDEX uq_users_email_active 
ON users (LOWER(email)) 
WHERE deleted_at IS NULL;
```

---

## 4. Multi-Tenancy Architecture & Row-Level Security (RLS)

In multi-tenant SaaS or multi-organization systems, data isolation is paramount.

### Pattern: Shared Database, Shared Schema with PostgreSQL RLS

Every tenant-scoped table includes `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.

```sql
-- 1. Enable RLS on the table
ALTER TABLE evacuees ENABLE ROW LEVEL SECURITY;
ALTER TABLE evacuees FORCE ROW LEVEL SECURITY; -- Also applies to table owners

-- 2. Create Isolation Policy using session variable
CREATE POLICY evacuee_tenant_isolation_policy ON evacuees
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

-- 3. Application Connection Setup (Executed on connection checkout)
SET LOCAL app.current_tenant_id = '018dc339-4456-789a-bcde-f0123456789a';
```

---

## 5. Domain Constraints & Referential Actions

Always specify explicit foreign key delete and update behaviors:

| Relationship Type | Example | Recommended Action |
|---|---|---|
| **Parent-Child Cascade** | `Pos` $\rightarrow$ `PosDailyLogs` | `ON DELETE CASCADE ON UPDATE CASCADE` |
| **Protected Master Entity** | `DisasterCategory` $\rightarrow$ `DisasterIncident` | `ON DELETE RESTRICT` (Prevents deleting category in use) |
| **Audit Reference** | `User` $\rightarrow$ `CreatedBy` | `ON DELETE SET NULL` |

### Database-Level Check Constraints:
```sql
ALTER TABLE evacuees
    ADD CONSTRAINT chk_evacuee_age CHECK (age >= 0 AND age <= 130),
    ADD CONSTRAINT chk_nik_format CHECK (nik ~ '^[0-9]{16}$');
```
