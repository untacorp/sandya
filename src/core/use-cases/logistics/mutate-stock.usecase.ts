import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { IInventoryRepository } from '@/core/domain/logistics/inventory.repository.interface';
import { IOutboxRepository } from '@/core/domain/sync/outbox.repository.interface';
import { MutationType } from '@/core/domain/logistics/inventory.aggregate';
import { asItemId, asPoskoId, asTicketId } from '@/core/shared/branded-types';
import { HTTP_STATUS } from '@/core/shared/constants';

export interface MutateStockInput {
  poskoId: string;
  itemId: string;
  officerId: string;
  officerRole: string;
  txType: MutationType;
  quantityChange: number;
  logicalSeq: number;
  referenceTicketId?: string | null | undefined;
  notes?: string | undefined;
}

export interface MutateStockOutput {
  itemId: string;
  newQuantity: number;
  transactionId: string;
}

export class MutateStockUseCase {
  constructor(
  private readonly inventoryRepo: IInventoryRepository,
  private readonly outboxRepo: IOutboxRepository
  ) {}

  public async execute(input: MutateStockInput): Promise<Result<MutateStockOutput>> {
  // 1. Ambil agregat inventaris dari repository
  const fetchResult = await this.inventoryRepo.findById(asItemId(input.itemId));
  if (!fetchResult.ok) {
  return Err(fetchResult.error);
  }

  const inventory = fetchResult.value;
  if (!inventory) {
  return Err(new DomainError('ITEM_NOT_FOUND', 'Item logistik tidak ditemukan di posko ini.', HTTP_STATUS.NOT_FOUND));
  }

  // 2. Eksekusi mutasi dengan pengawasan invarian Single-Writer
  const mutateResult = inventory.mutateStock(
  input.officerId,
  input.officerRole,
  input.txType,
  input.quantityChange,
  input.logicalSeq,
  input.referenceTicketId ? asTicketId(input.referenceTicketId) : null,
  input.notes
  );

  if (!mutateResult.ok) {
  return Err(mutateResult.error);
  }

  const tx = mutateResult.value;

  // 3. Persistensi ke basis data
  const saveResult = await this.inventoryRepo.save(inventory);
  if (!saveResult.ok) {
  return Err(saveResult.error);
  }

  // 4. Masukkan ke Transactional Outbox
  await this.outboxRepo.enqueue({
  poskoId: asPoskoId(input.poskoId),
  topic: 'STOCK_MUTATED',
  payload: JSON.stringify(tx),
  });

  return Ok({
  itemId: inventory.toSnapshot().id,
  newQuantity: inventory.toSnapshot().currentQuantity,
  transactionId: tx.id,
  });
  }
}
