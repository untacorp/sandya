import { InMemorySqliteConnection } from '../db/sqlite/sqlite-connection';
import { SqliteRefugeeRepository } from '../db/sqlite/repositories/sqlite-refugee.repository';
import { SqliteInventoryRepository } from '../db/sqlite/repositories/sqlite-inventory.repository';
import { SqliteOutboxRepository } from '../db/sqlite/repositories/sqlite-outbox.repository';
import { FastIntakeUseCase } from '@/core/use-cases/refugees/fast-intake.usecase';
import { BulkIntakeUseCase } from '@/core/use-cases/refugees/bulk-intake.usecase';
import { RecordRefugeeEventUseCase } from '@/core/use-cases/refugees/record-refugee-event.usecase';
import { RecordTriageExamUseCase } from '@/core/use-cases/refugees/record-triage-exam.usecase';
import { MutateStockUseCase } from '@/core/use-cases/logistics/mutate-stock.usecase';
import { IngestDeltaBatchUseCase } from '@/core/use-cases/sync/ingest-delta-batch.usecase';
import { FamilyReunionService } from '@/core/services/family-reunion.service';
import { DisasterAnalyticsService } from './disaster-analytics.service';
import { TacticalStreamService } from './tactical-stream.service';

export class ServiceContainer {
  private static instance: ServiceContainer | null = null;

  public readonly db: InMemorySqliteConnection;
  public readonly refugeeRepo: SqliteRefugeeRepository;
  public readonly inventoryRepo: SqliteInventoryRepository;
  public readonly outboxRepo: SqliteOutboxRepository;

  public readonly fastIntakeUseCase: FastIntakeUseCase;
  public readonly bulkIntakeUseCase: BulkIntakeUseCase;
  public readonly recordRefugeeEventUseCase: RecordRefugeeEventUseCase;
  public readonly recordTriageExamUseCase: RecordTriageExamUseCase;
  public readonly mutateStockUseCase: MutateStockUseCase;
  public readonly ingestDeltaBatchUseCase: IngestDeltaBatchUseCase;
  public readonly familyReunionService: FamilyReunionService;

  public readonly analyticsService: DisasterAnalyticsService;
  public readonly tacticalStreamService: TacticalStreamService;

  private constructor() {
    this.db = new InMemorySqliteConnection();
    this.refugeeRepo = new SqliteRefugeeRepository(this.db);
    this.inventoryRepo = new SqliteInventoryRepository(this.db);
    this.outboxRepo = new SqliteOutboxRepository(this.db);

    this.fastIntakeUseCase = new FastIntakeUseCase(this.refugeeRepo, this.outboxRepo);
    this.bulkIntakeUseCase = new BulkIntakeUseCase(this.refugeeRepo, this.outboxRepo);
    this.recordRefugeeEventUseCase = new RecordRefugeeEventUseCase(this.refugeeRepo, this.outboxRepo);
    this.recordTriageExamUseCase = new RecordTriageExamUseCase(this.refugeeRepo, this.outboxRepo);
    this.mutateStockUseCase = new MutateStockUseCase(this.inventoryRepo, this.outboxRepo);
    this.ingestDeltaBatchUseCase = new IngestDeltaBatchUseCase(this.refugeeRepo);
    this.familyReunionService = new FamilyReunionService(this.refugeeRepo);

    this.analyticsService = new DisasterAnalyticsService(this.refugeeRepo, this.inventoryRepo);
    this.tacticalStreamService = new TacticalStreamService();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}
