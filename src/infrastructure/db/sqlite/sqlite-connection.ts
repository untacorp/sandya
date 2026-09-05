/**
 * SQLite Connection Manager & Memory Database for Edge Node Execution
 * Mendukung simulasi in-memory untuk Web / Test runner serta hook FFI Tauri Native.
 */

export interface SqlQueryResult<T = unknown> {
  rows: T[];
  rowsAffected: number;
  lastInsertId?: number | string | undefined;
}

export interface ISqlConnection {
  execute(query: string, params?: unknown[]): Promise<SqlQueryResult>;
  query<T = unknown>(query: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(fn: (tx: ISqlConnection) => Promise<T>): Promise<T>;
}

/**
 * In-Memory SQL Storage Engine untuk pengujian unit & Web fallback
 */
export class InMemorySqliteConnection implements ISqlConnection {
  private tables = new Map<string, Map<string, Record<string, unknown>>>();

  constructor() {
  this.initTables();
  }

  private initTables() {
  this.tables.set('organizations', new Map());
  this.tables.set('disaster_missions', new Map());
  this.tables.set('posts', new Map());
  this.tables.set('refugees', new Map());
  this.tables.set('refugee_events', new Map());
  this.tables.set('inventory_items', new Map());
  this.tables.set('inventory_transactions', new Map());
  this.tables.set('needs_requests', new Map());
  this.tables.set('events_outbox', new Map());
  this.tables.set('mesh_sync_clocks', new Map());
  }

  public getTable(name: string): Map<string, Record<string, unknown>> {
  if (!this.tables.has(name)) {
  this.tables.set(name, new Map());
  }
  return this.tables.get(name)!;
  }

  public async execute(query: string, params: unknown[] = []): Promise<SqlQueryResult> {
  // Simple stub for in-memory execution
  return {
  rows: [],
  rowsAffected: 1,
  };
  }

  public async query<T = unknown>(query: string, params: unknown[] = []): Promise<T[]> {
  return [];
  }

  public async transaction<T>(fn: (tx: ISqlConnection) => Promise<T>): Promise<T> {
  return fn(this);
  }
}
