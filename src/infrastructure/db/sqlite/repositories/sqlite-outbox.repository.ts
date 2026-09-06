import { Result, Ok } from '@/core/shared/result';
import { IOutboxRepository, OutboxItem } from '@/core/domain/sync/outbox.repository.interface';
import { OutboxId, asOutboxId, asPoskoId } from '@/core/shared/branded-types';
import { InMemorySqliteConnection } from '../sqlite-connection';

export class SqliteOutboxRepository implements IOutboxRepository {
  constructor(private readonly db: InMemorySqliteConnection) {}

  public async enqueue(
  item: Omit<OutboxItem, 'id' | 'status' | 'retryCount' | 'createdAt'>
  ): Promise<Result<OutboxId>> {
  const table = this.db.getTable('events_outbox');
  const id = asOutboxId(crypto.randomUUID());
  const now = Date.now();

  table.set(id, {
  id,
  pos_id: item.poskoId,
  topic: item.topic,
  payload: item.payload,
  status: 'PENDING',
  retry_count: 0,
  created_at: now,
  });

  return Ok(id);
  }

  public async getPendingBatch(limit: number): Promise<Result<OutboxItem[]>> {
  const table = this.db.getTable('events_outbox');
  const pending: OutboxItem[] = [];

  for (const row of table.values()) {
  if (row['status'] === 'PENDING') {
  pending.push({
  id: asOutboxId(row['id'] as string),
  poskoId: asPoskoId(row['pos_id'] as string),
  topic: row['topic'] as string,
          payload: row['payload'] as string,
          status: row['status'] as OutboxItem['status'],
          retryCount: row['retry_count'] as number,
  createdAt: row['created_at'] as number,
  });
  if (pending.length >= limit) break;
  }
  }

  pending.sort((a, b) => a.createdAt - b.createdAt);
  return Ok(pending);
  }

  public async markStatus(id: OutboxId, status: OutboxItem['status']): Promise<Result<void>> {
  const table = this.db.getTable('events_outbox');
  const row = table.get(id);
  if (row) {
  row['status'] = status;
  if (status === 'FAILED') {
  row['retry_count'] = ((row['retry_count'] as number) || 0) + 1;
  }
  }
  return Ok(undefined);
  }
}
