# Local-First, Offline Sync & Event Sourcing Data Architectures

This guide defines schema patterns for distributed, edge, and offline-first applications (such as field disaster response apps) that synchronize over peer-to-peer (QR/Bluetooth) or intermittent networks.

---

## 1. Dual-Tier Database Topology

```
┌─────────────────────────────────────────────────────────────┐
│                 EDGE / FIELD TIER (SQLite)                  │
│ • Local-First: Zero latency writes, 100% offline capability │
│ • Append-Only Event Log + Materialized Local Read Views     │
│ • Transactional Outbox for optical QR or P2P Sync           │
└──────────────────────────────┬──────────────────────────────┘
  │
  Optical QR / Intermittent Net
  │
┌──────────────────────────────▼──────────────────────────────┐
│                CENTRAL HQ TIER (PostgreSQL)                 │
│ • Consolidated Multi-Org Tenant Event Store                 │
│ • Materialized Projections / Aggregated BI Dashboards       │
│ • PostGIS Spatial Analysis & Global Deduplication           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Local-First SQLite Configuration (Production Baseline)

SQLite embedded in Tauri / Mobile MUST execute the following PRAGMAs on every database connection:

```sql
PRAGMA journal_mode = WAL;          -- Write-Ahead Logging for concurrent readers/writers
PRAGMA synchronous = NORMAL;        -- Safe across OS crashes while maximizing throughput
PRAGMA foreign_keys = ON;           -- Enforce referential integrity
PRAGMA busy_timeout = 5000;         -- Wait 5s on lock contention rather than erroring
PRAGMA auto_vacuum = INCREMENTAL;   -- Reclaim storage from purged sync logs
```

---

## 3. The Transactional Outbox Pattern Schema

To ensure local state changes and pending sync exports never drift out of sync, wrap local view updates and outbox insertions in a single atomic transaction.

```sql
-- SQLite Local Outbox Schema
CREATE TABLE events_outbox (
  event_id TEXT PRIMARY KEY,               -- UUIDv7 generated locally
  aggregate_type TEXT NOT NULL,           -- 'EVACUEE' | 'LOGISTICS_NEED' | 'POS'
  aggregate_id TEXT NOT NULL,             -- Entity UUID
  event_type TEXT NOT NULL,               -- 'REGISTERED' | 'NEEDS_UPDATED' | 'RELOCATED'
  event_version INTEGER NOT NULL,         -- Monotonically increasing per aggregate
  payload_bin BLOB NOT NULL,              -- Bit-packed binary payload / compressed struct
  created_at INTEGER NOT NULL,            -- Epoch millisecond timestamp
  sync_status TEXT NOT NULL DEFAULT 'PENDING' 
  CHECK (sync_status IN ('PENDING', 'EXPORTED_QR', 'SYNCED_CLOUD', 'CONFLICT')),
  synced_at INTEGER                       -- Epoch millisecond when acknowledged
);

CREATE INDEX idx_outbox_pending ON events_outbox (sync_status, created_at)
WHERE sync_status = 'PENDING';
```

---

## 4. Conflict Resolution & Vector Clock / HLC Schema

When multiple offline devices modify the same record without a central server:

### A. Hybrid Logical Clock (HLC) Field Structure
```sql
-- Format: <Physical_Timestamp_MS>-<Logical_Counter>-<Device_UUID_Suffix>
-- Example: '1788392400000-0001-a1b2c3d4'
```
HLC guarantees strict causal ordering across devices even if physical device clocks have drift.

### B. Staged Conflict Review Schema (PostgreSQL & SQLite)
When an automatic Last-Write-Wins (LWW) or CRDT merge cannot safely resolve a domain conflict (e.g. same evacuee NIK modified in two distinct camps):

```sql
CREATE TABLE sync_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  aggregate_id UUID NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  local_version INT NOT NULL,
  remote_version INT NOT NULL,
  local_payload JSONB NOT NULL,
  remote_payload JSONB NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_choice VARCHAR(32) 
  CHECK (resolution_choice IN ('KEEP_LOCAL', 'KEEP_REMOTE', 'CUSTOM_MERGED'))
);
```

---

## 5. Central Consolidated Event Store Schema (PostgreSQL)

```sql
CREATE TABLE event_store (
  sequence_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id UUID UNIQUE NOT NULL,               -- Originating UUIDv7 from edge
  origin_device_id UUID NOT NULL,              -- Hardware / app instance fingerprint
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  pos_id UUID NOT NULL,
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  event_version INT NOT NULL,
  payload JSONB NOT NULL,
  signature BYTEA NOT NULL,                   -- Ed25519 digital signature of origin
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT uq_aggregate_version UNIQUE (tenant_id, aggregate_type, aggregate_id, event_version)
);

-- Fast replay index for projecting read views:
CREATE INDEX idx_event_store_replay 
ON event_store (tenant_id, aggregate_type, aggregate_id, sequence_id);
```
