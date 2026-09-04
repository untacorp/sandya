import { Result } from '@/core/shared/result';
import { InventoryAggregate, InventoryTransactionProps } from './inventory.aggregate';
import { ItemId, PoskoId } from '@/core/shared/branded-types';

export interface IInventoryRepository {
  findById(id: ItemId): Promise<Result<InventoryAggregate | null>>;
  findByPoskoId(poskoId: PoskoId): Promise<Result<InventoryAggregate[]>>;
  save(inventory: InventoryAggregate): Promise<Result<void>>;
  getTransactionsByItemId(itemId: ItemId): Promise<Result<InventoryTransactionProps[]>>;
}
