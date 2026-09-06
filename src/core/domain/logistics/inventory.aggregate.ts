import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { ItemId, PoskoId, TicketId } from '@/core/shared/branded-types';
import { HTTP_STATUS } from '@/core/shared/constants';

export const INVENTORY_CATEGORIES = [
  'FOOD',
  'CLOTHING',
  'MEDICAL',
  'HYGIENE',
  'SHELTER',
  'INFANT',
  'ASSISTIVE',
  'EMERGENCY_TOOLS',
  'OTHER',
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const MUTATION_TYPES = [
  'RESTOCK',
  'DISTRIBUTION',
  'DAMAGE',
  'TRANSFER_OUT',
  'TRANSFER_IN',
] as const;

export type MutationType = (typeof MUTATION_TYPES)[number];

export interface CreateInventoryProps {
  id: ItemId;
  poskoId: PoskoId;
  itemName: string;
  category: InventoryCategory;
  initialQuantity: number;
  unit: string;
}

export interface InventoryTransactionProps {
  id: string;
  itemId: ItemId;
  poskoId: PoskoId;
  officerId: string;
  officerRole: string;
  txType: MutationType;
  quantityChange: number;
  referenceTicketId?: TicketId | null | undefined;
  notes?: string | undefined;
  deviceTimestamp: number;
  logicalSeq: number;
}

const INITIAL_INVENTORY_VERSION = 1;

export class InventoryAggregate {
  private constructor(
  private readonly id: ItemId,
  private readonly poskoId: PoskoId,
  private readonly itemName: string,
  private readonly category: InventoryCategory,
  private currentQuantity: number,
  private readonly unit: string,
  private lastUpdatedAt: number,
  private version: number,
  private readonly transactions: InventoryTransactionProps[] = []
  ) {}

  public static create(props: CreateInventoryProps): Result<InventoryAggregate, DomainError> {
  if (!props.itemName.trim()) {
  return Err(new DomainError('INVALID_ITEM_NAME', 'Nama barang logistik tidak boleh kosong.', HTTP_STATUS.UNPROCESSABLE_ENTITY));
  }
  if (props.initialQuantity < 0) {
  return Err(new DomainError('INVALID_QUANTITY', 'Kuantitas awal stok tidak boleh negatif.', HTTP_STATUS.UNPROCESSABLE_ENTITY));
  }

  const now = Date.now();
  return Ok(
  new InventoryAggregate(
  props.id,
  props.poskoId,
  props.itemName.trim(),
  props.category,
  props.initialQuantity,
  props.unit.trim() || 'PCS',
  now,
  INITIAL_INVENTORY_VERSION,
  []
  )
  );
  }

  public static reconstitute(
  snapshot: {
  id: ItemId;
  poskoId: PoskoId;
  itemName: string;
  category: InventoryCategory;
  currentQuantity: number;
  unit: string;
  lastUpdatedAt: number;
  version: number;
  },
  transactions: InventoryTransactionProps[] = []
  ): InventoryAggregate {
  return new InventoryAggregate(
  snapshot.id,
  snapshot.poskoId,
  snapshot.itemName,
  snapshot.category,
  snapshot.currentQuantity,
  snapshot.unit,
  snapshot.lastUpdatedAt,
  snapshot.version,
  [...transactions]
  );
  }

  /**
  * Mutasi stok fisik - dijaga ketat oleh aturan Single-Writer
  */
  public mutateStock(
  officerId: string,
  officerRole: string,
  txType: MutationType,
  quantityChange: number,
  logicalSeq: number,
  referenceTicketId?: TicketId | null,
  notes?: string
  ): Result<InventoryTransactionProps, DomainError> {
    // 1. Invarian Hak Akses Single-Writer: Eksklusif Petugas Logistik
    const isAuthorized =
      officerRole === 'PETUGAS_LOGISTIK' ||
      officerRole === 'LOGISTIK';

    if (!isAuthorized) {
      return Err(
        new DomainError(
          'UNAUTHORIZED_WRITER',
          `Hanya Petugas Logistik (Single-Writer) yang berhak memutasi stok fisik posko ini. Peran Anda: ${officerRole}`,
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

  if (quantityChange === 0) {
  return Err(new DomainError('ZERO_CHANGE', 'Perubahan kuantitas tidak boleh 0.', HTTP_STATUS.UNPROCESSABLE_ENTITY));
  }

  const nextQuantity = this.currentQuantity + quantityChange;
  // 2. Invarian Non-Negative: Stok fisik tidak boleh bernilai negatif
  if (nextQuantity < 0) {
  return Err(
  new DomainError(
  'INSUFFICIENT_STOCK',
  `Stok tidak mencukupi! Tersedia: ${this.currentQuantity} ${this.unit}, Permintaan pemotongan: ${Math.abs(quantityChange)} ${this.unit}`,
  HTTP_STATUS.CONFLICT
  )
  );
  }

  const now = Date.now();
  this.currentQuantity = nextQuantity;
  this.lastUpdatedAt = now;
  this.version += 1;

  const tx: InventoryTransactionProps = {
  id: crypto.randomUUID(),
  itemId: this.id,
  poskoId: this.poskoId,
  officerId,
  officerRole,
  txType,
  quantityChange,
  referenceTicketId: referenceTicketId ?? null,
  notes: notes ?? undefined,
  deviceTimestamp: now,
  logicalSeq,
  };

  this.transactions.push(tx);
  return Ok(tx);
  }

  public toSnapshot() {
  return Object.freeze({
  id: this.id,
  poskoId: this.poskoId,
  itemName: this.itemName,
  category: this.category,
  currentQuantity: this.currentQuantity,
  unit: this.unit,
  lastUpdatedAt: this.lastUpdatedAt,
  version: this.version,
  });
  }

  public getTransactions(): ReadonlyArray<InventoryTransactionProps> {
  return Object.freeze([...this.transactions]);
  }
}
