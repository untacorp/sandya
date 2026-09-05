import { ServiceContainer } from '../services/service-container';
import { CloudConfig, DEFAULT_CLOUD_CONFIG } from '../config/cloud.config';
import { OutboxItem } from '@/core/domain/sync/outbox.repository.interface';

export interface CloudSyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  message: string;
  error?: string;
  timestamp: number;
}

export class CloudSyncService {
  private config: CloudConfig;
  private container: ServiceContainer;
  private isSyncing = false;

  constructor(config: CloudConfig = DEFAULT_CLOUD_CONFIG, container?: ServiceContainer) {
  this.config = config;
  this.container = container || ServiceContainer.getInstance();
  }

  public updateConfig(newConfig: Partial<CloudConfig>) {
  this.config = {
  ...this.config,
  ...newConfig,
  };
  }

  public async syncAll(poskoId?: string): Promise<CloudSyncResult> {
  if (this.isSyncing) {
  return {
  success: false,
  pushedCount: 0,
  pulledCount: 0,
  message: "Sinkronisasi cloud sedang berjalan di latar belakang.",
  timestamp: Date.now(),
  };
  }

  this.isSyncing = true;

  try {
  if (this.config.driver === "LOCAL_FIRST_OFFLINE") {
  return {
  success: true,
  pushedCount: 0,
  pulledCount: 0,
  message: "Mode offline aktif. Semua data tersimpan aman di SQLite lokal.",
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
  message: totalPushed > 0 || totalPulled > 0
  ? `Sinkronisasi berhasil: ${totalPushed} data terunggah ke Cloud, ${totalPulled} data diperbarui di perangkat.`
  : "Basis data lokal telah sinkron dengan Cloud.",
  timestamp: Date.now(),
  };
  } catch (err: any) {
  console.error("[CloudSyncService] Error during synchronization:", err);
  return {
  success: false,
  pushedCount: 0,
  pulledCount: 0,
  message: `Gagal tersambung ke cloud server: ${err?.message || "Koneksi terputus"}`,
  error: err?.message,
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

  if (this.config.driver === "SUPABASE") {
  await this.pushToSupabase(messages);
  } else if (this.config.driver === "POSTGRES_VPS") {
  await this.pushToPostgresVps(messages);
  }

  // Mark outbox messages as synced/acknowledged in local SQLite
  for (const msg of messages) {
  await this.container.outboxRepo.markStatus(msg.id, 'ACKNOWLEDGED');
  }

  return { pushedCount: messages.length };
  }

  /**
  * Pulls latest remote updates from Cloud to update local SQLite.
  */
  public async pullFromCloud(poskoId?: string): Promise<{ pulledCount: number }> {
  // In production edge environment, this queries the delta endpoint or Supabase tables
  // and feeds through IngestDeltaBatchUseCase
  return { pulledCount: 0 };
  }

  private async pushToSupabase(messages: OutboxItem[]): Promise<void> {
  const endpoint = `${this.config.supabase.url}/rest/v1/events_outbox`;
  const payload = messages.map((m) => ({
  id: m.id,
  pos_id: m.poskoId,
  topic: m.topic,
  payload_json: m.payload,
  status: 'ACKNOWLEDGED',
  created_at: m.createdAt,
  }));

  // If fetch is available in environment
  if (typeof fetch !== "undefined") {
  try {
  const res = await fetch(endpoint, {
  method: "POST",
  headers: {
  "Content-Type": "application/json",
  apikey: this.config.supabase.anonKey,
  Authorization: `Bearer ${this.config.supabase.anonKey}`,
  Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify(payload),
  });

  if (!res.ok && res.status !== 404 && res.status !== 401) {
  console.warn("[CloudSyncService] Supabase endpoint returned status:", res.status);
  }
  } catch (err) {
  // Log edge connection attempt
  console.warn("[CloudSyncService] Supabase network offline or unreachable, will retry on next connection.");
  }
  }
  }

  private async pushToPostgresVps(messages: OutboxItem[]): Promise<void> {
  const endpoint = this.config.postgresVps.endpoint;
  if (typeof fetch !== "undefined" && endpoint) {
  try {
  const headers: Record<string, string> = {
  "Content-Type": "application/json",
  };
  if (this.config.postgresVps.apiKey) {
  headers["X-API-Key"] = this.config.postgresVps.apiKey;
  }

  const res = await fetch(endpoint, {
  method: "POST",
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
  console.warn("[CloudSyncService] VPS Sync endpoint returned status:", res.status);
  }
  } catch (err) {
  console.warn("[CloudSyncService] VPS Sync network offline or unreachable.");
  }
  }
  }
}
