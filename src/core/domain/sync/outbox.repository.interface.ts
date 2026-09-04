import { Result } from '@/core/shared/result';
import { OutboxId, PoskoId } from '@/core/shared/branded-types';

export interface OutboxItem {
  id: OutboxId;
  poskoId: PoskoId;
  topic: string;
  payload: string; // JSON string / base64 binary
  status: 'PENDING' | 'IN_FLIGHT' | 'ACKNOWLEDGED' | 'FAILED';
  retryCount: number;
  createdAt: number;
}

export interface IOutboxRepository {
  enqueue(item: Omit<OutboxItem, 'id' | 'status' | 'retryCount' | 'createdAt'>): Promise<Result<OutboxId>>;
  getPendingBatch(limit: number): Promise<Result<OutboxItem[]>>;
  markStatus(id: OutboxId, status: OutboxItem['status']): Promise<Result<void>>;
}
