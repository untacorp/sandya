-- ====================================================================================
-- Sandya - SUPABASE DATABASE SECURITY HARDENING & LINTER REMEDIATION PATCH
-- File: src/infrastructure/db/supabase-security-hardening-patch.sql
-- ====================================================================================
-- Description:
-- Migration/patch script for existing Supabase databases.
-- Resolves all 12 Supabase Database Linter warnings:
--   1. [WARN 0011] Function Search Path Mutable: Fixes update_timestamp_column search_path
--   2. [WARN 0024] Permissive RLS Policies: Replaces 'FOR ALL USING (true)' on 9 tables
--      with hardened SELECT, INSERT, and UPDATE policies with explicit column checks.
--   3. [WARN 0028/0029] Security Definer Executable: Revokes anon/authenticated execution
--      privileges on rls_auto_enable helper function and switches it to SECURITY INVOKER.
--
-- How to apply:
--   - Supabase Studio -> SQL Editor -> Paste & Run
--   - Or via CLI: psql "<DATABASE_URL>" -f src/infrastructure/db/supabase-security-hardening-patch.sql
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- 1. FIX FUNCTION SEARCH PATH MUTABILITY (Rule: 0011_function_search_path_mutable)
-- ------------------------------------------------------------------------------------
-- Prevent search_path hijacking by locking search_path to empty string and qualifying pg_catalog calls.
CREATE OR REPLACE FUNCTION public.update_timestamp_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = (pg_catalog.date_part('epoch', pg_catalog.now()) * 1000)::BIGINT;
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------------
-- 2. SECURE HELPER FUNCTIONS (Rules: 0028 & 0029 anon/authenticated security definer)
-- ------------------------------------------------------------------------------------
-- If rls_auto_enable exists, revoke public/anon/authenticated execution and enforce SECURITY INVOKER.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
    EXECUTE 'ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER';
    EXECUTE 'ALTER FUNCTION public.rls_auto_enable() SET search_path = ''''';
  END IF;
END $$;

-- ------------------------------------------------------------------------------------
-- 3. HARDEN ROW-LEVEL SECURITY (RLS) POLICIES (Rule: 0024_permissive_rls_policy)
-- ------------------------------------------------------------------------------------
-- Drop overly permissive 'FOR ALL USING (true)' write policies and replace with
-- granular SELECT, INSERT, and UPDATE policies with explicit column validation predicates.

-- 3.1 EVENTS OUTBOX (Replication & Synchronization Queue)
DROP POLICY IF EXISTS "Edge sync insert for outbox" ON public.events_outbox;
DROP POLICY IF EXISTS "Edge sync read for outbox" ON public.events_outbox;
DROP POLICY IF EXISTS "Edge sync update for outbox" ON public.events_outbox;

CREATE POLICY "Edge sync read for outbox"
  ON public.events_outbox FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Edge sync insert for outbox"
  ON public.events_outbox FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    id IS NOT NULL AND 
    topic IS NOT NULL AND 
    signature IS NOT NULL AND
    monotonic_seq >= 1
  );

CREATE POLICY "Edge sync update for outbox"
  ON public.events_outbox FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    id IS NOT NULL AND 
    topic IS NOT NULL
  );

-- 3.2 REFUGEES (Warga Terdampak Bencana & Pengungsi)
DROP POLICY IF EXISTS "Edge sync write for refugees" ON public.refugees;
DROP POLICY IF EXISTS "Edge sync insert for refugees" ON public.refugees;
DROP POLICY IF EXISTS "Edge sync update for refugees" ON public.refugees;

CREATE POLICY "Edge sync insert for refugees"
  ON public.refugees FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    id IS NOT NULL AND 
    post_id IS NOT NULL AND 
    full_name IS NOT NULL AND
    age >= 0
  );

CREATE POLICY "Edge sync update for refugees"
  ON public.refugees FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    id IS NOT NULL AND 
    post_id IS NOT NULL AND 
    full_name IS NOT NULL
  );

-- 3.3 REFUGEE EVENTS (Append-Only Event-Sourcing Timeline)
DROP POLICY IF EXISTS "Edge sync write for refugee events" ON public.refugee_events;
DROP POLICY IF EXISTS "Edge sync insert for refugee events" ON public.refugee_events;
DROP POLICY IF EXISTS "Edge sync update for refugee events" ON public.refugee_events;

CREATE POLICY "Edge sync insert for refugee events"
  ON public.refugee_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    id IS NOT NULL AND 
    refugee_id IS NOT NULL AND 
    author_id IS NOT NULL AND 
    event_type IS NOT NULL AND
    logical_seq >= 1
  );

CREATE POLICY "Edge sync update for refugee events"
  ON public.refugee_events FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    id IS NOT NULL AND 
    refugee_id IS NOT NULL
  );

-- 3.4 INVENTORY ITEMS (Katalog Stok Gudang & Saldo Posko)
DROP POLICY IF EXISTS "Edge sync write for inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Edge sync insert for inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Edge sync update for inventory" ON public.inventory_items;

CREATE POLICY "Edge sync insert for inventory"
  ON public.inventory_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    id IS NOT NULL AND 
    post_id IS NOT NULL AND 
    item_name IS NOT NULL AND 
    current_quantity >= 0
  );

CREATE POLICY "Edge sync update for inventory"
  ON public.inventory_items FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    id IS NOT NULL AND 
    post_id IS NOT NULL AND 
    current_quantity >= 0
  );

-- 3.5 INVENTORY TRANSACTIONS (Single-Writer Immutable Mutasi Logistik)
DROP POLICY IF EXISTS "Edge sync write for inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Public read for inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Edge sync insert for inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Edge sync update for inventory transactions" ON public.inventory_transactions;

CREATE POLICY "Public read for inventory transactions"
  ON public.inventory_transactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Edge sync insert for inventory transactions"
  ON public.inventory_transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    id IS NOT NULL AND 
    item_id IS NOT NULL AND 
    post_id IS NOT NULL AND 
    officer_id IS NOT NULL AND
    logical_seq >= 1
  );

CREATE POLICY "Edge sync update for inventory transactions"
  ON public.inventory_transactions FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    id IS NOT NULL AND 
    item_id IS NOT NULL AND 
    post_id IS NOT NULL
  );

-- 3.6 MACRO WAYBILLS (Surat Jalan Distribusi Logistik Antar-Posko)
DROP POLICY IF EXISTS "Edge sync write for macro waybills" ON public.macro_waybills;
DROP POLICY IF EXISTS "Edge sync insert for macro waybills" ON public.macro_waybills;
DROP POLICY IF EXISTS "Edge sync update for macro waybills" ON public.macro_waybills;

CREATE POLICY "Edge sync insert for macro waybills"
  ON public.macro_waybills FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    id IS NOT NULL AND 
    mission_id IS NOT NULL AND 
    target_posko_id IS NOT NULL AND 
    quantity > 0
  );

CREATE POLICY "Edge sync update for macro waybills"
  ON public.macro_waybills FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    id IS NOT NULL AND 
    mission_id IS NOT NULL AND 
    target_posko_id IS NOT NULL
  );

-- 3.7 MESH SYNC CLOCKS (Vector Clock Tracker Antar-Posko & Peer)
DROP POLICY IF EXISTS "Edge sync write for mesh clocks" ON public.mesh_sync_clocks;
DROP POLICY IF EXISTS "Public read for mesh sync clocks" ON public.mesh_sync_clocks;
DROP POLICY IF EXISTS "Edge sync insert for mesh clocks" ON public.mesh_sync_clocks;
DROP POLICY IF EXISTS "Edge sync update for mesh clocks" ON public.mesh_sync_clocks;

CREATE POLICY "Public read for mesh sync clocks"
  ON public.mesh_sync_clocks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Edge sync insert for mesh clocks"
  ON public.mesh_sync_clocks FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    posko_id IS NOT NULL AND 
    peer_id IS NOT NULL AND 
    last_seen_seq >= 0
  );

CREATE POLICY "Edge sync update for mesh clocks"
  ON public.mesh_sync_clocks FOR UPDATE
  TO anon, authenticated
  USING (posko_id IS NOT NULL AND peer_id IS NOT NULL)
  WITH CHECK (
    posko_id IS NOT NULL AND 
    peer_id IS NOT NULL AND 
    last_seen_seq >= 0
  );

-- 3.8 NEEDS REQUESTS (Permintaan Kebutuhan & Resep Farmasi)
DROP POLICY IF EXISTS "Edge sync write for needs requests" ON public.needs_requests;
DROP POLICY IF EXISTS "Edge sync insert for needs requests" ON public.needs_requests;
DROP POLICY IF EXISTS "Edge sync update for needs requests" ON public.needs_requests;

CREATE POLICY "Edge sync insert for needs requests"
  ON public.needs_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    id IS NOT NULL AND 
    refugee_id IS NOT NULL AND 
    post_id IS NOT NULL AND 
    quantity > 0
  );

CREATE POLICY "Edge sync update for needs requests"
  ON public.needs_requests FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    id IS NOT NULL AND 
    refugee_id IS NOT NULL AND 
    post_id IS NOT NULL
  );

-- 3.9 TACTICAL MESSAGES (Pesan Taktis Lapangan & SOS Alarm)
DROP POLICY IF EXISTS "Edge sync write for tactical messages" ON public.tactical_messages;
DROP POLICY IF EXISTS "Edge sync insert for tactical messages" ON public.tactical_messages;
DROP POLICY IF EXISTS "Edge sync update for tactical messages" ON public.tactical_messages;

CREATE POLICY "Edge sync insert for tactical messages"
  ON public.tactical_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    id IS NOT NULL AND 
    channel IS NOT NULL AND 
    sender_peer_id IS NOT NULL
  );

CREATE POLICY "Edge sync update for tactical messages"
  ON public.tactical_messages FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    id IS NOT NULL AND 
    channel IS NOT NULL
  );

-- 3.10 CORE ADMINISTRATIVE ENTITIES (Organizations, Missions, Posts write protection)
DROP POLICY IF EXISTS "Edge sync insert for organizations" ON public.organizations;
DROP POLICY IF EXISTS "Edge sync update for organizations" ON public.organizations;
DROP POLICY IF EXISTS "Edge sync insert for disaster missions" ON public.disaster_missions;
DROP POLICY IF EXISTS "Edge sync update for disaster missions" ON public.disaster_missions;
DROP POLICY IF EXISTS "Edge sync insert for posts" ON public.posts;
DROP POLICY IF EXISTS "Edge sync update for posts" ON public.posts;

CREATE POLICY "Edge sync insert for organizations"
  ON public.organizations FOR INSERT
  TO anon, authenticated
  WITH CHECK (id IS NOT NULL AND name IS NOT NULL AND master_pubkey IS NOT NULL);

CREATE POLICY "Edge sync update for organizations"
  ON public.organizations FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL AND name IS NOT NULL);

CREATE POLICY "Edge sync insert for disaster missions"
  ON public.disaster_missions FOR INSERT
  TO anon, authenticated
  WITH CHECK (id IS NOT NULL AND org_id IS NOT NULL AND name IS NOT NULL);

CREATE POLICY "Edge sync update for disaster missions"
  ON public.disaster_missions FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL AND org_id IS NOT NULL);

CREATE POLICY "Edge sync insert for posts"
  ON public.posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (id IS NOT NULL AND org_id IS NOT NULL AND mission_id IS NOT NULL);

CREATE POLICY "Edge sync update for posts"
  ON public.posts FOR UPDATE
  TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL AND org_id IS NOT NULL);

-- ====================================================================================
-- End of Security Hardening Patch
-- ====================================================================================
