# High-Performance Indexing & Query Optimization Guide

This guide details enterprise indexing strategies to achieve sub-millisecond query latencies and eliminate sequential table scans.

---

## 1. The ESR Rule for Composite B-Tree Indexes

When designing composite indexes for multi-clause queries (`WHERE a = 1 AND b > 10 ORDER BY c`), the column order within the index definition is critical.

### The ESR Order: **Equality $\rightarrow$ Sort $\rightarrow$ Range**

```sql
-- Query to optimize:
SELECT id, full_name, registered_at
FROM evacuees
WHERE pos_id = '...'              -- [E] Equality
  AND registered_at >= '...'      -- [R] Range
ORDER BY urgency_level DESC;      -- [S] Sort

-- ❌ BAD INDEX: Range before Sort forces an in-memory Sort step (Top-N heap sort)
CREATE INDEX idx_bad ON evacuees (pos_id, registered_at, urgency_level);

-- ✅ PERFECT ESR INDEX: Allows index scan to satisfy Equality, Sort, and Range without sorting:
CREATE INDEX idx_optimal_esr ON evacuees (pos_id, urgency_level DESC, registered_at);
```

---

## 2. Specialized PostgreSQL Index Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       POSTGRESQL INDEX TYPE SELECTOR                        │
├─────────────┬──────────────────────────┬────────────────────────────────────┤
│ Index Type  │ Best For                 │ Example Scenario                   │
├─────────────┼──────────────────────────┼────────────────────────────────────┤
│ **B-Tree**  │ Scalar equality, ranges, │ `id`, `email`, `created_at`,       │
│             │ sorting, prefix LIKE     │ `tenant_id`                        │
├─────────────┼──────────────────────────┼────────────────────────────────────┤
│ **GIN**     │ JSONB documents, arrays, │ `metadata @> '{"tags": ["urgent"]}'│
│             │ full-text search         │ `to_tsvector('indonesian', notes)` │
├─────────────┼──────────────────────────┼────────────────────────────────────┤
│ **GiST**    │ Geospatial / PostGIS,    │ `ST_DWithin(gps_coords, point, r)` │
│             │ ranges, 2D geometry      │ Posko distance search              │
├─────────────┼──────────────────────────┼────────────────────────────────────┤
│ **BRIN**    │ Massive time-series logs │ Append-only mutation events table  │
│             │ naturally ordered on disk│ (Millions of rows, 1% index size)  │
└─────────────┴──────────────────────────┴────────────────────────────────────┘
```

### A. GIN Indexing for JSONB & Full-Text Search
```sql
-- JSONB sub-document filtering:
CREATE INDEX idx_evacuees_metadata_gin ON evacuees USING GIN (metadata jsonb_path_ops);

-- Indonesian Full-Text Search on notes / descriptions:
CREATE INDEX idx_evacuees_fts ON evacuees USING GIN (to_tsvector('indonesian', full_name || ' ' || COALESCE(notes, '')));
```

### B. GiST Geospatial Indexing (PostGIS)
```sql
-- Fast bounding box & radial distance lookup for disaster pos locations:
ALTER TABLE pos_locations ADD COLUMN geom geometry(Point, 4326);
CREATE INDEX idx_pos_locations_geom ON pos_locations USING GiST (geom);
```

### C. BRIN Indexing for Append-Only Logs
For tables with tens of millions of rows sorted by insert timestamp (e.g. event sourcing store, telemetry logs), a **BRIN (Block Range Index)** uses $<1\%$ of the RAM of a B-Tree index:
```sql
CREATE TABLE audit_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_payload JSONB NOT NULL
);

-- BRIN index stores min/max values per disk block range:
CREATE INDEX idx_audit_events_ts_brin ON audit_events USING BRIN (event_timestamp);
```

---

## 3. Covering Indexes (`INCLUDE` Clause)

Index-Only Scans avoid touching the heap table pages completely, dramatically reducing disk I/O.

```sql
-- If a query frequently looks up user status and full name by email:
CREATE INDEX idx_users_email_covering 
ON users (email) 
INCLUDE (full_name, status, role);

-- Execution of:
-- SELECT full_name, status, role FROM users WHERE email = '...';
-- -> Satisfied 100% within the index leaf pages (Zero Table Heap Access).
```

---

## 4. Declarative Table Partitioning (Time-Series & Scale)

When tables exceed $100\text{M}$ rows, partition by date range to allow instant partition pruning and rapid historical data archiving (`DROP TABLE ..._2025_01` vs slow `DELETE WHERE`).

```sql
CREATE TABLE sync_event_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v7(),
    pos_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    payload BYTEA NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly partition tables:
CREATE TABLE sync_event_logs_2026_09 PARTITION OF sync_event_logs
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
```
