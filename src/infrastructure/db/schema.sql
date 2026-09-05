-- ====================================================================================
-- Sandya - INDUSTRIAL-GRADE DISASTER MANAGEMENT RELATIONAL DATABASE SCHEMA (DDL)
-- Compliant with: database-architect & backend-architect standards
-- Engines: SQLite 3.38+ (WAL Mode) & PostgreSQL 16+ (Local-First Edge & HQ Sync)
-- ====================================================================================

-- PRAGMA foreign_keys = ON; -- For SQLite execution

-- ------------------------------------------------------------------------------------
-- 1. ORGANIZATIONS (Lembaga Induk / Badan Penanggulangan Bencana)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(64) PRIMARY KEY,                         -- E.g. 'ORG-01' or UUIDv7
  name VARCHAR(255) NOT NULL,                         -- E.g. 'PMI Kabupaten Cianjur'
  category VARCHAR(64) NOT NULL CHECK (
  category IN ('BPBD_PEMERINTAH', 'PMI_LEMBAGA', 'NGO_YAYASAN', 'KOMUNITAS_MANDIRI')
  ),
  master_pubkey VARCHAR(255) NOT NULL,               -- Ed25519 Root Organization Public Key (DID)
  contact_number VARCHAR(64),
  headquarters_address TEXT,
  created_at BIGINT NOT NULL,                        -- Unix Epoch Milliseconds
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizations_category ON organizations (category);

-- ------------------------------------------------------------------------------------
-- 2. DISASTER MISSIONS (Operasi Tanggap Darurat Bencana)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disaster_missions (
  id VARCHAR(64) PRIMARY KEY,                         -- E.g. 'MSN-2026-01' or UUIDv7
  org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  disaster_type VARCHAR(64) NOT NULL CHECK (
  disaster_type IN ('GEMPA_BUMI', 'BANJIR_BANDANG', 'ERUPSI_GUNUNG', 'LONGSOR', 'TSUNAMI')
  ),
  status VARCHAR(64) NOT NULL CHECK (
  status IN ('PREPAREDNESS', 'ACTIVE_EMERGENCY', 'TRANSITION_RECOVERY', 'CLOSED_ARCHIVED')
  ) DEFAULT 'ACTIVE_EMERGENCY',
  target_days INT NOT NULL CHECK (target_days > 0),
  location VARCHAR(255) NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_disaster_missions_org_status ON disaster_missions (org_id, status);

-- ------------------------------------------------------------------------------------
-- 3. POSTS / POSKOS (Posko Lapangan & Gudang Sentral Logistik)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(64) PRIMARY KEY,                         -- E.g. 'POS-01' or UUIDv7
  org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  mission_id VARCHAR(64) NOT NULL REFERENCES disaster_missions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  post_type VARCHAR(64) NOT NULL CHECK (
  post_type IN ('MAIN_WAREHOUSE', 'FIELD_SHELTER', 'MEDICAL_POST')
  ),
  status VARCHAR(64) NOT NULL CHECK (
  status IN ('OPERATIONAL_NORMAL', 'HAZARD_EVACUATION', 'STANDBY')
  ) DEFAULT 'OPERATIONAL_NORMAL',
  capacity INT NOT NULL CHECK (capacity >= 0),
  current_refugees INT NOT NULL DEFAULT 0 CHECK (current_refugees >= 0),
  location_name VARCHAR(255) NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_mission_status ON posts (mission_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_org ON posts (org_id);

-- ------------------------------------------------------------------------------------
-- 4. REFUGEES (Warga Terdampak Bencana & Pengungsi)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refugees (
  id VARCHAR(64) PRIMARY KEY,                         -- UUIDv7 or 'REF-001'
  post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  full_name VARCHAR(255) NOT NULL,
  national_id VARCHAR(32),                            -- NIK (Optional for fast intake, 0-byte bypass)
  gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
  age INT NOT NULL CHECK (age >= 0 AND age <= 150),
  domicile_origin VARCHAR(255) NOT NULL,
  shelter_location VARCHAR(255) NOT NULL,
  missing_kin_name VARCHAR(255),
  current_triage VARCHAR(16) NOT NULL CHECK (
  current_triage IN ('RED', 'YELLOW', 'GREEN', 'BLACK')
  ) DEFAULT 'GREEN',
  vulnerabilities TEXT,                              -- JSON array of VulnerabilityCategory
  urgent_needs TEXT,                                 -- JSON array of strings
  registered_by_user_id VARCHAR(64) NOT NULL,
  registered_by_user_name VARCHAR(255) NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  version INT NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_refugees_post_triage ON refugees (post_id, current_triage);
CREATE INDEX IF NOT EXISTS idx_refugees_full_name ON refugees (full_name);
CREATE INDEX IF NOT EXISTS idx_refugees_national_id ON refugees (national_id);

-- ------------------------------------------------------------------------------------
-- 5. REFUGEE EVENTS (Append-Only Event-Sourcing Timeline Warga)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refugee_events (
  id VARCHAR(64) PRIMARY KEY,                         -- UUIDv7
  refugee_id VARCHAR(64) NOT NULL REFERENCES refugees(id) ON DELETE CASCADE,
  author_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL CHECK (
  event_type IN ('INTAKE', 'HEALTH_CHECK', 'NEED_REPORTED', 'AID_RECEIVED', 'NOTE', 'TRIAGE_UPDATE')
  ),
  event_payload TEXT NOT NULL,                        -- JSON payload
  device_timestamp BIGINT NOT NULL,
  logical_seq INT NOT NULL CHECK (logical_seq >= 1),
  causal_parent_id VARCHAR(64),
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refugee_events_refugee_seq ON refugee_events (refugee_id, logical_seq ASC);

-- ------------------------------------------------------------------------------------
-- 6. INVENTORY ITEMS (Katalog Stok Gudang & Saldo Posko)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(64) PRIMARY KEY,                         -- UUIDv7 or 'ITEM-01'
  post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL CHECK (
  category IN ('FOOD', 'CLOTHING', 'MEDICAL', 'HYGIENE', 'SHELTER', 'BABY_SUPPLIES')
  ),
  current_quantity DECIMAL(12, 2) NOT NULL CHECK (current_quantity >= 0),
  unit VARCHAR(32) NOT NULL,
  burn_rate_days DECIMAL(8, 2) DEFAULT 0.00,
  last_updated_at BIGINT NOT NULL,
  version INT NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_inventory_post_category ON inventory_items (post_id, category);
CREATE UNIQUE INDEX IF NOT EXISTS unq_inventory_post_item ON inventory_items (post_id, item_name);

-- ------------------------------------------------------------------------------------
-- 7. INVENTORY TRANSACTIONS (Single-Writer Immutable Ledger Mutasi Logistik)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id VARCHAR(64) PRIMARY KEY,                         -- UUIDv7
  item_id VARCHAR(64) NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  officer_id VARCHAR(64) NOT NULL,
  officer_name VARCHAR(255) NOT NULL,
  officer_role VARCHAR(64) NOT NULL,
  tx_type VARCHAR(32) NOT NULL CHECK (
  tx_type IN ('RESTOCK', 'DISTRIBUTION', 'DAMAGE', 'TRANSFER')
  ),
  quantity_change DECIMAL(12, 2) NOT NULL,            -- Positive for restock, negative for distribution
  reference_ticket_id VARCHAR(64),
  notes TEXT,
  device_timestamp BIGINT NOT NULL,
  logical_seq INT NOT NULL CHECK (logical_seq >= 1),
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_tx_item_seq ON inventory_transactions (item_id, logical_seq ASC);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_post_time ON inventory_transactions (post_id, device_timestamp DESC);

-- ------------------------------------------------------------------------------------
-- 8. MACRO WAYBILLS (Surat Jalan Distribusi Logistik Antar-Posko / Gudang Sentral)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS macro_waybills (
  id VARCHAR(64) PRIMARY KEY,                         -- E.g. 'WB-2026-081' or UUIDv7
  mission_id VARCHAR(64) NOT NULL REFERENCES disaster_missions(id) ON DELETE CASCADE,
  source_hub VARCHAR(255) NOT NULL,
  target_posko_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  target_posko_name VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (
  status IN ('PREPARING', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED')
  ) DEFAULT 'PREPARING',
  driver_name VARCHAR(255) NOT NULL,
  dispatched_at BIGINT NOT NULL,
  received_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_macro_waybills_mission_status ON macro_waybills (mission_id, status);
CREATE INDEX IF NOT EXISTS idx_macro_waybills_target_posko ON macro_waybills (target_posko_id, status);

-- ------------------------------------------------------------------------------------
-- 9. NEEDS REQUESTS / TICKETS (Permintaan Kebutuhan & Resep Farmasi)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS needs_requests (
  id VARCHAR(64) PRIMARY KEY,                         -- UUIDv7 or 'TKT-001'
  refugee_id VARCHAR(64) NOT NULL REFERENCES refugees(id) ON DELETE CASCADE,
  refugee_name VARCHAR(255) NOT NULL,
  shelter_location VARCHAR(255) NOT NULL,
  post_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (
  status IN ('PENDING', 'ALLOCATED', 'COMPLETED', 'REJECTED', 'CANCELLED')
  ) DEFAULT 'PENDING',
  urgency VARCHAR(16) NOT NULL CHECK (urgency IN ('HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
  created_by_user_id VARCHAR(64) NOT NULL,
  created_by_user_name VARCHAR(255) NOT NULL,
  allocated_by_user_id VARCHAR(64),
  distributed_by_user_id VARCHAR(64),
  created_at BIGINT NOT NULL,
  completed_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_needs_post_status ON needs_requests (post_id, status);
CREATE INDEX IF NOT EXISTS idx_needs_refugee ON needs_requests (refugee_id);

-- ------------------------------------------------------------------------------------
-- 10. TACTICAL MESSAGES (Pesan Taktis Lapangan & Alarm Darurat SOS)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tactical_messages (
  id VARCHAR(64) PRIMARY KEY,                         -- UUIDv7 or 'MSG-001'
  channel VARCHAR(32) NOT NULL CHECK (
  channel IN ('POSKO_ALL', 'MEDIS', 'LOGISTIK', 'SOS')
  ),
  sender_peer_id VARCHAR(64) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(64) NOT NULL,
  recipient_peer_id VARCHAR(64),                      -- NULL for broadcast
  content_type VARCHAR(32) NOT NULL CHECK (
  content_type IN ('TEXT', 'VOICE_NOTE', 'ALERT')
  ),
  text_content TEXT,
  audio_duration_ms INT CHECK (audio_duration_ms IS NULL OR (audio_duration_ms >= 500 AND audio_duration_ms <= 5000)),
  audio_waveform TEXT,                                -- JSON array of amplitude values
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tactical_channel_time ON tactical_messages (channel, created_at DESC);

-- ------------------------------------------------------------------------------------
-- 11. EVENTS OUTBOX (Transactional Outbox untuk Replikasi Mesh & Cloud Sync)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events_outbox (
  id VARCHAR(64) PRIMARY KEY,                         -- UUIDv7
  topic VARCHAR(64) NOT NULL,                         -- E.g. 'REFUGEE_INTAKE', 'STOCK_MUTATED', 'TRIAGE_EXAM'
  payload_json TEXT NOT NULL,
  signature VARCHAR(255) NOT NULL,                   -- Ed25519 digital signature
  monotonic_seq INT NOT NULL CHECK (monotonic_seq >= 1),
  is_synced BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_unsynced ON events_outbox (is_synced, monotonic_seq ASC);

-- ------------------------------------------------------------------------------------
-- 12. MESH SYNC CLOCKS (Vector Clock Tracker Antar-Posko & Peer)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mesh_sync_clocks (
  posko_id VARCHAR(64) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  peer_id VARCHAR(64) NOT NULL,
  last_seen_seq INT NOT NULL DEFAULT 0 CHECK (last_seen_seq >= 0),
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (posko_id, peer_id)
);
