import { Result, Ok, Err } from '@/core/shared/result';
import { IInventoryRepository } from '@/core/domain/logistics/inventory.repository.interface';
import {
  InventoryAggregate,
  InventoryTransactionProps,
  InventoryCategory,
} from '@/core/domain/logistics/inventory.aggregate';
import { ItemId, PoskoId, asItemId, asPoskoId } from '@/core/shared/branded-types';
import { InMemorySqliteConnection } from '../sqlite-connection';

export class SqliteInventoryRepository implements IInventoryRepository {
  constructor(private readonly db: InMemorySqliteConnection) {}

  public async findById(id: ItemId): Promise<Result<InventoryAggregate | null>> {
  const table = this.db.getTable('inventory_items');
  const row = table.get(id);
  if (!row) {
  return Ok(null);
  }

  const txsResult = await this.getTransactionsByItemId(id);
  const transactions = txsResult.ok ? txsResult.value : [];

  const agg = InventoryAggregate.reconstitute(
  {
  id: asItemId(row['id'] as string),
  poskoId: asPoskoId(row['post_id'] as string),
  itemName: row['item_name'] as string,
  category: row['category'] as InventoryCategory,
  currentQuantity: row['current_quantity'] as number,
  unit: row['unit'] as string,
  lastUpdatedAt: (row['last_updated_at'] as number) || Date.now(),
  version: (row['version'] as number) || 1,
  },
  transactions
  );

  return Ok(agg);
  }

  public async findByPoskoId(poskoId: PoskoId): Promise<Result<InventoryAggregate[]>> {
  const table = this.db.getTable('inventory_items');
  const list: InventoryAggregate[] = [];

  for (const row of table.values()) {
  if (poskoId === 'ALL' || poskoId === asPoskoId('ALL') || row['post_id'] === poskoId) {
  const itemId = asItemId(row['id'] as string);
  const txsResult = await this.getTransactionsByItemId(itemId);
  const transactions = txsResult.ok ? txsResult.value : [];

  const agg = InventoryAggregate.reconstitute(
  {
  id: itemId,
  poskoId: asPoskoId(row['post_id'] as string),
  itemName: row['item_name'] as string,
  category: row['category'] as InventoryCategory,
  currentQuantity: row['current_quantity'] as number,
  unit: row['unit'] as string,
  lastUpdatedAt: (row['last_updated_at'] as number) || Date.now(),
  version: (row['version'] as number) || 1,
  },
  transactions
  );

  list.push(agg);
  }
  }

  return Ok(list);
  }

  public async save(inventory: InventoryAggregate): Promise<Result<void>> {
  const snap = inventory.toSnapshot();
  const table = this.db.getTable('inventory_items');
  table.set(snap.id, {
  id: snap.id,
  post_id: snap.poskoId,
  item_name: snap.itemName,
  category: snap.category,
  current_quantity: snap.currentQuantity,
  unit: snap.unit,
  last_updated_at: snap.lastUpdatedAt,
  version: snap.version,
  });

  // Simpan ledger transaksi
  const txTable = this.db.getTable('inventory_transactions');
  for (const tx of inventory.getTransactions()) {
  txTable.set(tx.id, {
  id: tx.id,
  item_id: tx.itemId,
  post_id: tx.poskoId,
  officer_id: tx.officerId,
  officer_role: tx.officerRole,
  tx_type: tx.txType,
  quantity_change: tx.quantityChange,
  reference_ticket_id: tx.referenceTicketId,
  notes: tx.notes,
  device_timestamp: tx.deviceTimestamp,
  logical_seq: tx.logicalSeq,
  });
  }

  return Ok(undefined);
  }

  public async getTransactionsByItemId(
  itemId: ItemId
  ): Promise<Result<InventoryTransactionProps[]>> {
  const table = this.db.getTable('inventory_transactions');
  const list: InventoryTransactionProps[] = [];

  for (const row of table.values()) {
  if (row['item_id'] === itemId) {
  list.push({
  id: row['id'] as string,
  itemId: asItemId(row['item_id'] as string),
  poskoId: asPoskoId(row['post_id'] as string),
  officerId: row['officer_id'] as string,
  officerRole: row['officer_role'] as string,
  txType: row['tx_type'] as any,
  quantityChange: row['quantity_change'] as number,
  referenceTicketId: row['reference_ticket_id'] as any,
  notes: row['notes'] as string | undefined,
  deviceTimestamp: row['device_timestamp'] as number,
  logicalSeq: row['logical_seq'] as number,
  });
  }
  }

  list.sort((a, b) => a.logicalSeq - b.logicalSeq);
  return Ok(list);
  }
}
