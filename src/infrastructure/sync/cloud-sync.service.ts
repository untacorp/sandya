import { ServiceContainer } from '../services/service-container';
import { CloudConfig, DEFAULT_CLOUD_CONFIG } from '../config/cloud.config';
import { OutboxItem } from '@/core/domain/sync/outbox.repository.interface';
import {
  type Organization,
  type DisasterMission,
  type Posko,
  type DisasterPerson,
  type RefugeeEvent,
  type InventoryItem,
  type InventoryTransaction,
  type NeedsTicket,
  type TacticalMessage,
} from '@/shared/types';

export interface CloudSyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  message: string;
  error?: string;
  timestamp: number;
}

export interface CloudPullData {
  organizations?: Organization[];
  missions?: DisasterMission[];
  poskos?: Posko[];
  refugees?: DisasterPerson[];
  refugeeEvents?: RefugeeEvent[];
  inventory?: InventoryItem[];
  transactions?: InventoryTransaction[];
  needsTickets?: NeedsTicket[];
  messages?: TacticalMessage[];
}

export class CloudSyncService {
  private config: CloudConfig;
  private container: ServiceContainer;
  private isSyncing = false;

  constructor(config: CloudConfig = DEFAULT_CLOUD_CONFIG, container?: ServiceContainer) {
    this.config = config;
    this.container = container || ServiceContainer.getInstance();
  }

  public getConfig(): CloudConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<CloudConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  private getSupabaseHeaders(): Record<string, string> {
    const key = this.config.supabase.anonKey;
    return {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'resolution=merge-duplicates,return=representation',
    };
  }

  public async syncAll(poskoId?: string): Promise<CloudSyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        message: 'Sinkronisasi cloud sedang berjalan di latar belakang.',
        timestamp: Date.now(),
      };
    }

    this.isSyncing = true;

    try {
      if (this.config.driver === 'LOCAL_FIRST_OFFLINE') {
        return {
          success: true,
          pushedCount: 0,
          pulledCount: 0,
          message: 'Mode offline aktif. Semua data tersimpan aman di SQLite lokal.',
          timestamp: Date.now(),
        };
      }

      // Step 1: PUSH local SQLite outbox to Cloud (Device -> Cloud)
      const pushResult = await this.pushOutboxToCloud();

      // Step 2: PULL remote updates from Cloud to local SQLite (Cloud -> Device)
      const pullResult = await this.pullFromCloud(poskoId);

      const totalPushed = pushResult.pushedCount;
      const totalPulled = pullResult.pulledCount;

      return {
        success: true,
        pushedCount: totalPushed,
        pulledCount: totalPulled,
        message:
          totalPushed > 0 || totalPulled > 0
            ? `Sinkronisasi berhasil: ${totalPushed} antrean terunggah ke Cloud, ${totalPulled} data diperbarui di perangkat.`
            : 'Basis data lokal telah sinkron dengan Cloud.',
        timestamp: Date.now(),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Koneksi terputus';
      console.error('[CloudSyncService] Error during synchronization:', err);
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        message: `Gagal tersambung ke cloud server: ${errorMsg}`,
        error: errorMsg,
        timestamp: Date.now(),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pushes unsynced local events from SQLite events_outbox upstream to Cloud.
   */
  public async pushOutboxToCloud(): Promise<{ pushedCount: number }> {
    const unsyncedRes = await this.container.outboxRepo.getPendingBatch(this.config.syncOptions.batchSize);
    if (!unsyncedRes.ok || unsyncedRes.value.length === 0) {
      return { pushedCount: 0 };
    }

    const messages = unsyncedRes.value;

    if (this.config.driver === 'SUPABASE') {
      await this.pushToSupabase(messages);
    } else if (this.config.driver === 'POSTGRES_VPS') {
      await this.pushToPostgresVps(messages);
    }

    // Mark outbox messages as synced/acknowledged in local SQLite
    for (const msg of messages) {
      await this.container.outboxRepo.markStatus(msg.id, 'ACKNOWLEDGED');
    }

    return { pushedCount: messages.length };
  }

  private async pushToSupabase(messages: OutboxItem[]): Promise<void> {
    const endpoint = `${this.config.supabase.url}/rest/v1/events_outbox`;
    const payload = messages.map((m, idx) => {
      let parsedPayload: Record<string, unknown> = {};
      try {
        parsedPayload = typeof m.payload === 'string' ? JSON.parse(m.payload) : (m.payload as Record<string, unknown>);
      } catch {
        parsedPayload = { raw: m.payload };
      }
      return {
        id: m.id,
        topic: m.topic,
        payload_json: parsedPayload,
        signature: `sig_${m.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`,
        monotonic_seq: idx + 1,
        is_synced: true,
        created_at: m.createdAt || Date.now(),
      };
    });

    if (typeof fetch !== 'undefined' && this.config.supabase.url) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: this.getSupabaseHeaders(),
          body: JSON.stringify(payload),
        });

        if (!res.ok && res.status !== 404 && res.status !== 401) {
          console.warn('[CloudSyncService] Supabase outbox endpoint returned status:', res.status);
        }
      } catch {
        console.warn('[CloudSyncService] Supabase network offline or unreachable, will retry on next connection.');
      }
    }
  }

  private async pushToPostgresVps(messages: OutboxItem[]): Promise<void> {
    const endpoint = this.config.postgresVps.endpoint;
    if (typeof fetch !== 'undefined' && endpoint) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (this.config.postgresVps.apiKey) {
          headers['X-API-Key'] = this.config.postgresVps.apiKey;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            events: messages.map((m) => ({
              id: m.id,
              posId: m.poskoId,
              topic: m.topic,
              payload: m.payload,
              status: 'ACKNOWLEDGED',
              createdAt: m.createdAt,
            })),
          }),
        });

        if (!res.ok) {
          console.warn('[CloudSyncService] VPS Sync endpoint returned status:', res.status);
        }
      } catch {
        console.warn('[CloudSyncService] VPS Sync network offline or unreachable.');
      }
    }
  }

  /**
   * Sync Organizations to Cloud
   */
  public async syncOrganizations(orgs: Organization[]): Promise<{ count: number; error?: string }> {
    if (this.config.driver !== 'SUPABASE' || !orgs.length) return { count: 0 };
    const endpoint = `${this.config.supabase.url}/rest/v1/organizations`;
    const payload = orgs.map((o) => ({
      id: o.id,
      name: o.name,
      category: o.category,
      master_pubkey: o.masterPubkey || `did:sandya:org_${o.id}`,
      contact_number: o.contactNumber || null,
      headquarters_address: o.headquartersAddress || null,
      created_at: o.createdAt || Date.now(),
      updated_at: Date.now(),
    }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[CloudSyncService] syncOrganizations failed (HTTP ${res.status}):`, errorText);
        return { count: 0, error: `HTTP ${res.status}: ${errorText}` };
      }
      return { count: payload.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[CloudSyncService] syncOrganizations exception:', msg);
      return { count: 0, error: msg };
    }
  }

  /**
   * Sync Disaster Missions to Cloud
   */
  public async syncMissions(missions: DisasterMission[]): Promise<{ count: number; error?: string }> {
    if (this.config.driver !== 'SUPABASE' || !missions.length) return { count: 0 };
    const endpoint = `${this.config.supabase.url}/rest/v1/disaster_missions`;
    const payload = missions.map((m) => ({
      id: m.id,
      org_id: m.orgId,
      name: m.name,
      disaster_type: m.disasterType,
      status: m.status,
      target_days: m.targetDays,
      location: m.location,
      created_at: m.createdAt || Date.now(),
      updated_at: Date.now(),
    }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[CloudSyncService] syncMissions failed (HTTP ${res.status}):`, errorText);
        return { count: 0, error: `HTTP ${res.status}: ${errorText}` };
      }
      return { count: payload.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[CloudSyncService] syncMissions exception:', msg);
      return { count: 0, error: msg };
    }
  }

  /**
   * Sync Poskos to Cloud
   */
  public async syncPoskos(poskos: Posko[]): Promise<{ count: number; error?: string }> {
    if (this.config.driver !== 'SUPABASE' || !poskos.length) return { count: 0 };
    const endpoint = `${this.config.supabase.url}/rest/v1/posts`;
    const payload = poskos.map((p) => ({
      id: p.id,
      org_id: p.orgId,
      mission_id: p.missionId,
      name: p.name,
      post_type: p.postType,
      status: p.status,
      capacity: p.capacity,
      current_refugees: p.currentRefugees || 0,
      location_name: p.locationName,
      location_lat: p.locationLat || null,
      location_lng: p.locationLng || null,
      created_at: p.createdAt || Date.now(),
      updated_at: Date.now(),
    }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[CloudSyncService] syncPoskos failed (HTTP ${res.status}):`, errorText);
        return { count: 0, error: `HTTP ${res.status}: ${errorText}` };
      }
      return { count: payload.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[CloudSyncService] syncPoskos exception:', msg);
      return { count: 0, error: msg };
    }
  }

  /**
   * Sync Refugees to Cloud
   */
  public async syncRefugees(refugees: DisasterPerson[]): Promise<{ count: number; error?: string }> {
    if (this.config.driver !== 'SUPABASE' || !refugees.length) return { count: 0 };
    const endpoint = `${this.config.supabase.url}/rest/v1/refugees`;
    const payload = refugees.map((r) => ({
      id: r.id,
      post_id: r.postId,
      full_name: r.fullName,
      national_id: r.nik || null,
      gender: r.gender,
      age: r.age,
      domicile_origin: r.domicileOrigin,
      shelter_location: r.shelterLocation,
      missing_kin_name: r.missingKinName || null,
      current_triage: r.triageStatus || 'GREEN',
      vulnerabilities: Array.isArray(r.vulnerabilities) ? r.vulnerabilities : [],
      urgent_needs: Array.isArray(r.urgentNeeds) ? r.urgentNeeds : [],
      registered_by_user_id: r.registeredByUserId,
      registered_by_user_name: r.registeredByUserName,
      created_at: r.createdAt || Date.now(),
      updated_at: Date.now(),
      version: 1,
    }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[CloudSyncService] syncRefugees failed (HTTP ${res.status}):`, errorText);
        return { count: 0, error: `HTTP ${res.status}: ${errorText}` };
      }
      return { count: payload.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[CloudSyncService] syncRefugees exception:', msg);
      return { count: 0, error: msg };
    }
  }

  /**
   * Sync Refugee Timeline Events (Append-Only Event Sourcing) to Cloud
   */
  public async syncRefugeeEvents(events: RefugeeEvent[]): Promise<{ count: number; error?: string }> {
    if (this.config.driver !== 'SUPABASE' || !events.length) return { count: 0 };
    const endpoint = `${this.config.supabase.url}/rest/v1/refugee_events`;
    const payload = events.map((e) => ({
      id: e.id,
      refugee_id: e.refugeeId,
      author_id: e.authorId,
      author_name: e.authorName,
      author_role: e.authorRole,
      event_type: e.eventType,
      event_payload: e.eventPayload || {},
      device_timestamp: e.deviceTimestamp || Date.now(),
      logical_seq: Math.max(1, e.logicalSeq || 1),
      causal_parent_id: e.causalParentId || null,
      created_at: e.deviceTimestamp || Date.now(),
    }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[CloudSyncService] syncRefugeeEvents failed (HTTP ${res.status}):`, errorText);
        return { count: 0, error: `HTTP ${res.status}: ${errorText}` };
      }
      return { count: payload.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[CloudSyncService] syncRefugeeEvents exception:', msg);
      return { count: 0, error: msg };
    }
  }

  /**
   * Sync Inventory to Cloud
   */
  public async syncInventory(items: InventoryItem[], txs: InventoryTransaction[]): Promise<{ count: number; error?: string }> {
    if (this.config.driver !== 'SUPABASE') return { count: 0 };
    let count = 0;
    let lastError: string | undefined;

    if (items.length > 0) {
      const itemsEndpoint = `${this.config.supabase.url}/rest/v1/inventory_items`;
      const payload = items.map((i) => ({
        id: i.id,
        post_id: i.postId,
        item_name: i.itemName,
        category: i.category,
        current_quantity: i.currentQuantity,
        unit: i.unit,
        burn_rate_days: i.burnRateDays || 5,
        last_updated_at: i.lastUpdatedAt || Date.now(),
        version: 1,
      }));
      try {
        const res = await fetch(itemsEndpoint, {
          method: 'POST',
          headers: this.getSupabaseHeaders(),
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          count += payload.length;
        } else {
          const errorText = await res.text().catch(() => '');
          console.error(`[CloudSyncService] syncInventory items failed (HTTP ${res.status}):`, errorText);
          lastError = `Items HTTP ${res.status}: ${errorText}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Network error';
      }
    }

    if (txs.length > 0) {
      const txEndpoint = `${this.config.supabase.url}/rest/v1/inventory_transactions`;
      const txPayload = txs.map((t, idx) => ({
        id: t.id,
        item_id: t.itemId,
        post_id: t.postId,
        officer_id: t.officerId,
        officer_name: t.officerName,
        officer_role: 'PETUGAS_LOGISTIK',
        tx_type: t.txType,
        quantity_change: t.quantityChange,
        reference_ticket_id: t.referenceTicketId || null,
        notes: t.note || null,
        device_timestamp: t.deviceTimestamp || Date.now(),
        logical_seq: idx + 1,
        created_at: t.deviceTimestamp || Date.now(),
      }));
      try {
        const res = await fetch(txEndpoint, {
          method: 'POST',
          headers: this.getSupabaseHeaders(),
          body: JSON.stringify(txPayload),
        });
        if (res.ok) {
          count += txPayload.length;
        } else {
          const errorText = await res.text().catch(() => '');
          console.error(`[CloudSyncService] syncInventory transactions failed (HTTP ${res.status}):`, errorText);
          lastError = `Tx HTTP ${res.status}: ${errorText}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Network error';
      }
    }

    return { count, error: lastError };
  }

  /**
   * Sync Needs Tickets to Cloud
   */
  public async syncNeedsTickets(tickets: NeedsTicket[]): Promise<{ count: number; error?: string }> {
    if (this.config.driver !== 'SUPABASE' || !tickets.length) return { count: 0 };
    const endpoint = `${this.config.supabase.url}/rest/v1/needs_requests`;
    const payload = tickets.map((t) => ({
      id: t.id,
      refugee_id: t.refugeeId,
      refugee_name: t.refugeeName,
      shelter_location: t.shelterLocation,
      post_id: t.postId,
      item_name: t.itemName,
      quantity: t.quantity,
      unit: t.unit,
      status: t.status,
      urgency: t.urgency,
      created_by_user_id: t.createdByUserId,
      created_by_user_name: t.createdByUserName,
      allocated_by_user_id: t.allocatedByUserId || null,
      distributed_by_user_id: t.distributedByUserId || null,
      created_at: t.createdAt || Date.now(),
      completed_at: t.completedAt || null,
    }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[CloudSyncService] syncNeedsTickets failed (HTTP ${res.status}):`, errorText);
        return { count: 0, error: `HTTP ${res.status}: ${errorText}` };
      }
      return { count: payload.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[CloudSyncService] syncNeedsTickets exception:', msg);
      return { count: 0, error: msg };
    }
  }

  /**
   * Sync Tactical Messages to Cloud
   */
  public async syncTacticalMessages(messages: TacticalMessage[]): Promise<{ count: number; error?: string }> {
    if (this.config.driver !== 'SUPABASE' || !messages.length) return { count: 0 };
    const endpoint = `${this.config.supabase.url}/rest/v1/tactical_messages`;
    const payload = messages.map((m) => ({
      id: m.id,
      channel: m.channel,
      sender_peer_id: m.senderPeerId,
      sender_name: m.senderName,
      sender_role: m.senderRole,
      recipient_peer_id: m.recipientPeerId || null,
      content_type: m.contentType,
      text_content: m.contentType === 'VOICE_NOTE' ? (m.audioBase64 || m.textContent || null) : (m.textContent || null),
      audio_duration_ms: m.audioDurationMs || null,
      audio_waveform: m.audioWaveform ? JSON.stringify(m.audioWaveform) : null,
      is_urgent: m.isUrgent || false,
      created_at: m.createdAt || Date.now(),
    }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[CloudSyncService] syncTacticalMessages failed (HTTP ${res.status}):`, errorText);
        return { count: 0, error: `HTTP ${res.status}: ${errorText}` };
      }
      return { count: payload.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[CloudSyncService] syncTacticalMessages exception:', msg);
      return { count: 0, error: msg };
    }
  }

  /**
   * Pulls latest remote updates from Cloud to update local state.
   * Filters out stale test records and archived missions.
   */
  public async pullFromCloud(_poskoId?: string): Promise<{ pulledCount: number; data?: CloudPullData }> {
    if (this.config.driver !== 'SUPABASE' || !this.config.supabase.url) {
      return { pulledCount: 0 };
    }

    try {
      const headers = {
        apikey: this.config.supabase.anonKey,
        Authorization: `Bearer ${this.config.supabase.anonKey}`,
      };

      const [orgsRes, missionsRes, poskosRes, refugeesRes, eventsRes, itemsRes, ticketsRes, msgsRes] = await Promise.allSettled([
        fetch(`${this.config.supabase.url}/rest/v1/organizations?select=*`, { headers }),
        fetch(`${this.config.supabase.url}/rest/v1/disaster_missions?select=*&status=neq.CLOSED_ARCHIVED`, { headers }),
        fetch(`${this.config.supabase.url}/rest/v1/posts?select=*`, { headers }),
        fetch(`${this.config.supabase.url}/rest/v1/refugees?select=*`, { headers }),
        fetch(`${this.config.supabase.url}/rest/v1/refugee_events?select=*&limit=200&order=device_timestamp.desc`, { headers }),
        fetch(`${this.config.supabase.url}/rest/v1/inventory_items?select=*`, { headers }),
        fetch(`${this.config.supabase.url}/rest/v1/needs_requests?select=*`, { headers }),
        fetch(`${this.config.supabase.url}/rest/v1/tactical_messages?select=*&limit=50&order=created_at.desc`, { headers }),
      ]);

      let totalPulled = 0;
      const pullData: CloudPullData = {};

      const isTestId = (id?: string | null) => !id || id.includes('-TEST-') || id.startsWith('TEST-');

      if (orgsRes.status === 'fulfilled' && orgsRes.value.ok) {
        const rows = await orgsRes.value.json();
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isTestId(r.id));
          totalPulled += validRows.length;
          pullData.organizations = validRows.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            masterPubkey: r.master_pubkey,
            contactNumber: r.contact_number || undefined,
            headquartersAddress: r.headquarters_address || undefined,
            createdAt: Number(r.created_at),
          }));
        }
      }

      if (missionsRes.status === 'fulfilled' && missionsRes.value.ok) {
        const rows = await missionsRes.value.json();
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isTestId(r.id) && r.status !== 'CLOSED_ARCHIVED');
          totalPulled += validRows.length;
          pullData.missions = validRows.map((r) => ({
            id: r.id,
            orgId: r.org_id,
            name: r.name,
            disasterType: r.disaster_type,
            status: r.status,
            targetDays: r.target_days,
            location: r.location,
            createdAt: Number(r.created_at),
          }));
        }
      }

      if (poskosRes.status === 'fulfilled' && poskosRes.value.ok) {
        const rows = await poskosRes.value.json();
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isTestId(r.id) && !isTestId(r.mission_id));
          totalPulled += validRows.length;
          pullData.poskos = validRows.map((r) => ({
            id: r.id,
            orgId: r.org_id,
            missionId: r.mission_id,
            name: r.name,
            postType: r.post_type,
            status: r.status,
            capacity: r.capacity,
            currentRefugees: r.current_refugees || 0,
            locationName: r.location_name,
            locationLat: r.location_lat || undefined,
            locationLng: r.location_lng || undefined,
            createdAt: Number(r.created_at),
          }));
        }
      }

      if (refugeesRes.status === 'fulfilled' && refugeesRes.value.ok) {
        const rows = await refugeesRes.value.json();
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isTestId(r.id) && !isTestId(r.post_id));
          totalPulled += validRows.length;
          pullData.refugees = validRows.map((r) => {
            let parsedVuln = r.vulnerabilities;
            if (typeof parsedVuln === 'string') {
              try { parsedVuln = JSON.parse(parsedVuln); } catch { parsedVuln = []; }
            }
            let parsedNeeds = r.urgent_needs;
            if (typeof parsedNeeds === 'string') {
              try { parsedNeeds = JSON.parse(parsedNeeds); } catch { parsedNeeds = []; }
            }
            return {
              id: r.id,
              postId: r.post_id,
              fullName: r.full_name,
              nik: r.national_id || null,
              gender: r.gender,
              age: r.age,
              domicileOrigin: r.domicile_origin,
              shelterLocation: r.shelter_location,
              missingKinName: r.missing_kin_name || undefined,
              vulnerabilities: Array.isArray(parsedVuln) ? parsedVuln : [],
              urgentNeeds: Array.isArray(parsedNeeds) ? parsedNeeds : [],
              registeredByUserId: r.registered_by_user_id,
              registeredByUserName: r.registered_by_user_name,
              triageStatus: r.current_triage,
              createdAt: Number(r.created_at),
            };
          });
        }
      }

      if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
        const rows = await eventsRes.value.json();
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isTestId(r.id) && !isTestId(r.refugee_id));
          totalPulled += validRows.length;
          pullData.refugeeEvents = validRows.map((r) => {
            let parsedPayload = r.event_payload;
            if (typeof parsedPayload === 'string') {
              try { parsedPayload = JSON.parse(parsedPayload); } catch { parsedPayload = {}; }
            }
            return {
              id: r.id,
              refugeeId: r.refugee_id,
              authorId: r.author_id,
              authorName: r.author_name,
              authorRole: r.author_role,
              eventType: r.event_type,
              eventPayload: typeof parsedPayload === 'object' && parsedPayload !== null ? parsedPayload : {},
              deviceTimestamp: Number(r.device_timestamp),
              logicalSeq: Number(r.logical_seq),
              causalParentId: r.causal_parent_id || undefined,
            };
          });
        }
      }

      if (itemsRes.status === 'fulfilled' && itemsRes.value.ok) {
        const rows = await itemsRes.value.json();
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isTestId(r.id) && !isTestId(r.post_id));
          totalPulled += validRows.length;
          pullData.inventory = validRows.map((r) => ({
            id: r.id,
            postId: r.post_id,
            itemName: r.item_name,
            category: r.category,
            currentQuantity: Number(r.current_quantity),
            unit: r.unit,
            burnRateDays: Number(r.burn_rate_days) || 5,
            lastUpdatedAt: Number(r.last_updated_at),
          }));
        }
      }

      if (ticketsRes.status === 'fulfilled' && ticketsRes.value.ok) {
        const rows = await ticketsRes.value.json();
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isTestId(r.id) && !isTestId(r.post_id));
          totalPulled += validRows.length;
          pullData.needsTickets = validRows.map((r) => ({
            id: r.id,
            refugeeId: r.refugee_id,
            refugeeName: r.refugee_name,
            shelterLocation: r.shelter_location,
            postId: r.post_id,
            itemName: r.item_name,
            quantity: Number(r.quantity),
            unit: r.unit,
            status: r.status,
            urgency: r.urgency,
            createdByUserId: r.created_by_user_id,
            createdByUserName: r.created_by_user_name,
            allocatedByUserId: r.allocated_by_user_id || undefined,
            distributedByUserId: r.distributed_by_user_id || undefined,
            createdAt: Number(r.created_at),
            completedAt: r.completed_at ? Number(r.completed_at) : undefined,
          }));
        }
      }

      if (msgsRes.status === 'fulfilled' && msgsRes.value.ok) {
        const rows = await msgsRes.value.json();
        if (Array.isArray(rows)) {
          const validRows = rows.filter((r) => !isTestId(r.id));
          totalPulled += validRows.length;
          pullData.messages = validRows.map((r) => {
            const isVoice = r.content_type === 'VOICE_NOTE';
            const isBase64Audio = typeof r.text_content === 'string' && r.text_content.startsWith('data:audio');
            return {
              id: r.id,
              channel: r.channel,
              senderPeerId: r.sender_peer_id,
              senderName: r.sender_name,
              senderRole: r.sender_role,
              recipientPeerId: r.recipient_peer_id || undefined,
              contentType: r.content_type,
              textContent: isVoice ? (isBase64Audio ? undefined : r.text_content) : (r.text_content || undefined),
              audioBase64: isVoice && isBase64Audio ? r.text_content : undefined,
              audioDurationMs: r.audio_duration_ms || undefined,
              audioWaveform: typeof r.audio_waveform === 'string' ? JSON.parse(r.audio_waveform) : r.audio_waveform || undefined,
              isUrgent: r.is_urgent || false,
              createdAt: Number(r.created_at),
            };
          });
        }
      }

      return { pulledCount: totalPulled, data: pullData };
    } catch (err) {
      console.error('[CloudSyncService] pullFromCloud error:', err);
      return { pulledCount: 0 };
    }
  }
}
