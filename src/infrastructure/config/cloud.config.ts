/**
 * Cloud Configuration for Local-First Edge Synchronization
 * Supports Supabase Cloud & PostgreSQL VPS Self-Hosted Instances.
 */

export type CloudDriverType = "SUPABASE" | "POSTGRES_VPS" | "LOCAL_FIRST_OFFLINE";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  schema?: string;
}

export interface PostgresVpsConfig {
  endpoint: string;
  apiKey?: string;
  postgresUrl?: string;
  ssl: boolean;
}

export interface CloudSyncOptions {
  batchSize: number;
  autoSyncIntervalMs: number;
  maxRetryAttempts: number;
  retryBackoffBaseMs: number;
  timeoutMs: number;
}

export interface CloudConfig {
  driver: CloudDriverType;
  supabase: SupabaseConfig;
  postgresVps: PostgresVpsConfig;
  syncOptions: CloudSyncOptions;
}

export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  driver: (process.env.NEXT_PUBLIC_CLOUD_DRIVER as CloudDriverType) || "LOCAL_FIRST_OFFLINE",
  supabase: {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sandya-cloud.supabase.co",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sandya-anonymous-edge-key",
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  schema: "public",
  },
  postgresVps: {
  endpoint: process.env.NEXT_PUBLIC_VPS_SYNC_ENDPOINT || "https://vps.bpbd.go.id/api/v1/sync",
  apiKey: process.env.VPS_SYNC_API_KEY,
  postgresUrl: process.env.DATABASE_URL || "postgresql://sandya_admin:sandya_secret@localhost:5432/sandya_db",
  ssl: process.env.NODE_ENV === "production",
  },
  syncOptions: {
  batchSize: 50,
  autoSyncIntervalMs: 30000, // 30 seconds
  maxRetryAttempts: 3,
  retryBackoffBaseMs: 1000,
  timeoutMs: 10000,
  },
};
