import { InMemorySqliteConnection } from '../db/sqlite/sqlite-connection';
import { SqliteRefugeeRepository } from '../db/sqlite/repositories/sqlite-refugee.repository';
import { SqliteInventoryRepository } from '../db/sqlite/repositories/sqlite-inventory.repository';
import { SqliteOutboxRepository } from '../db/sqlite/repositories/sqlite-outbox.repository';
import { FastIntakeUseCase } from '@/core/use-cases/refugees/fast-intake.usecase';
import { MutateStockUseCase } from '@/core/use-cases/logistics/mutate-stock.usecase';
import { IngestDeltaBatchUseCase } from '@/core/use-cases/sync/ingest-delta-batch.usecase';
import { DisasterAnalyticsService } from './disaster-analytics.service';
import { TacticalStreamService } from './tactical-stream.service';
import { asItemId, asPoskoId } from '@/core/shared/branded-types';
import { InventoryAggregate } from '@/core/domain/logistics/inventory.aggregate';

export class ServiceContainer {
  private static instance: ServiceContainer | null = null;

  public readonly db: InMemorySqliteConnection;
  public readonly refugeeRepo: SqliteRefugeeRepository;
  public readonly inventoryRepo: SqliteInventoryRepository;
  public readonly outboxRepo: SqliteOutboxRepository;

  public readonly fastIntakeUseCase: FastIntakeUseCase;
  public readonly mutateStockUseCase: MutateStockUseCase;
  public readonly ingestDeltaBatchUseCase: IngestDeltaBatchUseCase;

  public readonly analyticsService: DisasterAnalyticsService;
  public readonly tacticalStreamService: TacticalStreamService;

  private constructor() {
    this.db = new InMemorySqliteConnection();
    this.refugeeRepo = new SqliteRefugeeRepository(this.db);
    this.inventoryRepo = new SqliteInventoryRepository(this.db);
    this.outboxRepo = new SqliteOutboxRepository(this.db);

    this.fastIntakeUseCase = new FastIntakeUseCase(this.refugeeRepo, this.outboxRepo);
    this.mutateStockUseCase = new MutateStockUseCase(this.inventoryRepo, this.outboxRepo);
    this.ingestDeltaBatchUseCase = new IngestDeltaBatchUseCase(this.refugeeRepo);

    this.analyticsService = new DisasterAnalyticsService(this.refugeeRepo, this.inventoryRepo);
    this.tacticalStreamService = new TacticalStreamService();

    this.seedDefaultData();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  private seedDefaultData() {
    // Seed initial demo items for tests/development
    const demoPoskoId = asPoskoId('posko-demo-001');
    const items = [
      { id: asItemId('item-001'), itemName: 'Beras 5kg', category: 'FOOD' as const, qty: 250, unit: 'KARUNG' },
      { id: asItemId('item-002'), itemName: 'Susu Formula Bayi (0-6 Bulan)', category: 'INFANT' as const, qty: 45, unit: 'KOTAK' },
      { id: asItemId('item-003'), itemName: 'Selimut Hangat Tebal', category: 'CLOTHING' as const, qty: 120, unit: 'PCS' },
      { id: asItemId('item-004'), itemName: 'Paracetamol 500mg', category: 'MEDICAL' as const, qty: 500, unit: 'STRIP' },
      { id: asItemId('item-005'), itemName: 'Air Minum Bersih Galon 19L', category: 'FOOD' as const, qty: 80, unit: 'GALON' },
    ];

    for (const it of items) {
      const agg = InventoryAggregate.create({
        id: it.id,
        poskoId: demoPoskoId,
        itemName: it.itemName,
        category: it.category,
        initialQuantity: it.qty,
        unit: it.unit,
      });
      if (agg.ok) {
        this.inventoryRepo.save(agg.value);
      }
    }
  }
}
