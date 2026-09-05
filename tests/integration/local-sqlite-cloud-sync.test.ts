import assert from 'node:assert';
import { InMemorySqliteConnection } from '@/infrastructure/db/sqlite/sqlite-connection';
import { SqliteRefugeeRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-refugee.repository';
import { SqliteInventoryRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-inventory.repository';
import { SqliteOutboxRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-outbox.repository';
import { FastIntakeUseCase } from '@/core/use-cases/refugees/fast-intake.usecase';
import { RecordTriageExamUseCase } from '@/core/use-cases/refugees/record-triage-exam.usecase';
import { MutateStockUseCase } from '@/core/use-cases/logistics/mutate-stock.usecase';
import { InventoryAggregate } from '@/core/domain/logistics/inventory.aggregate';
import { CloudSyncService } from '@/infrastructure/sync/cloud-sync.service';
import { asPoskoId, asItemId, asRefugeeId } from '@/core/shared/branded-types';
import { ServiceContainer } from '@/infrastructure/services/service-container';

async function runLocalSqliteCloudSyncTests() {
  console.log('RUNNING Sandya LOCAL SQLITE -> CLOUD SYNC PIPELINE TEST SUITE...\n');

  const poskoId = asPoskoId('POS-CIJEDIL-01');
  const db = new InMemorySqliteConnection();
  const refugeeRepo = new SqliteRefugeeRepository(db);
  const inventoryRepo = new SqliteInventoryRepository(db);
  const outboxRepo = new SqliteOutboxRepository(db);

  const fastIntake = new FastIntakeUseCase(refugeeRepo, outboxRepo);
  const recordTriage = new RecordTriageExamUseCase(refugeeRepo, outboxRepo);
  const mutateStock = new MutateStockUseCase(inventoryRepo, outboxRepo);

  // Test 1: Local-First Fast Intake Write into Local SQLite
  console.log('Test 1: Local SQLite Write - Fast Intake Offline Registration');
  const intakeResult = await fastIntake.execute({
  poskoId: 'POS-CIJEDIL-01',
  fullName: 'Siti Fatimah',
  gender: 'F',
  age: 28,
  domicileOrigin: 'Dusun Cijedil RT 02/03',
  shelterLocation: 'Tenda Medis 01',
  missingKinName: 'Ahmad Dahlan',
  vulnerabilities: ['IBU_HAMIL'],
  urgentNeeds: [0x21, 0x27],
  registeredByUserId: 'USR-REL-01',
  registeredByUserName: 'Relawan Alpha',
  });

  assert.strictEqual(intakeResult.ok, true, 'Fast intake should succeed on local SQLite');
  const refugeeId = intakeResult.value.refugeeId;
  const refugeeInDb = await refugeeRepo.findById(refugeeId);
  assert.strictEqual(refugeeInDb.ok, true);
  assert.strictEqual(refugeeInDb.value.toSnapshot().fullName, 'Siti Fatimah');
  console.log('  [PASS] Local SQLite Fast Intake Saved Successfully');

  // Test 2: Local SQLite Write - Clinical Triage Exam & Pharmacy Tickets
  console.log('Test 2: Local SQLite Write - Clinical Triage Examination (Monotonic Seq 2)');
  const triageResult = await recordTriage.execute({
  refugeeId: refugeeId,
  poskoId: 'POS-CIJEDIL-01',
  authorId: 'DOC-01',
  authorName: 'dr. Hendra',
  authorRole: 'PETUGAS_MEDIS',
  triageCategory: 'YELLOW',
  vitalSigns: {
  systolic: 110,
  diastolic: 75,
  temperature: 37.2,
  complaint: 'Pusing dan lemas paska gempa',
  },
  prescriptions: [
  { needTokenId: 0x27, medicineName: 'Paracetamol 500mg', quantity: 1, unit: 'STRIP', dosage: '3x1 tablet' },
  ],
  });

  assert.strictEqual(triageResult.ok, true, 'Triage exam should succeed on local SQLite');
  const updatedRefugee = await refugeeRepo.findById(refugeeId);
  assert.strictEqual(updatedRefugee.value.toSnapshot().currentTriage, 'YELLOW');
  console.log('  [PASS] Local SQLite Triage Exam & Prescription Logged');

  // Test 3: Local SQLite Write - Single-Writer Inventory Restock
  console.log('Test 3: Local SQLite Write - Single-Writer Inventory Restock');
  const initialItem = InventoryAggregate.create({
  id: asItemId('POS-CIJEDIL-01-ITEM-BERAS'),
  poskoId,
  itemName: 'Beras Medium 5kg',
  category: 'FOOD',
  initialQuantity: 50,
  unit: 'KARUNG',
  });
  assert.strictEqual(initialItem.ok, true);
  await inventoryRepo.save(initialItem.value);

  const restockResult = await mutateStock.execute({
  poskoId: 'POS-CIJEDIL-01',
  itemId: 'POS-CIJEDIL-01-ITEM-BERAS',
  officerId: 'LOG-01',
  officerRole: 'PETUGAS_LOGISTIK',
  txType: 'RESTOCK',
  quantityChange: 100,
  logicalSeq: 2,
  notes: 'Penerimaan truk bantuan logistik',
  });

  assert.strictEqual(restockResult.ok, true);
  const updatedItem = await inventoryRepo.findById(asItemId('POS-CIJEDIL-01-ITEM-BERAS'));
  assert.strictEqual(updatedItem.value.toSnapshot().currentQuantity, 150);
  console.log('  [PASS] Local SQLite Stock Mutated (Balance: 150 KARUNG)');

  // Test 4: Verify Local SQLite Transactional Outbox Queue
  console.log('Test 4: Verify Local SQLite Outbox Queue');
  const unsyncedRes = await outboxRepo.getPendingBatch(10);
  assert.strictEqual(unsyncedRes.ok, true);
  assert.strictEqual(unsyncedRes.value.length, 3, 'Should have exactly 3 queued outbox events');
  assert.strictEqual(unsyncedRes.value[0].topic, 'REFUGEE_INTAKE');
  assert.strictEqual(unsyncedRes.value[1].topic, 'TRIAGE_EXAM');
  assert.strictEqual(unsyncedRes.value[2].topic, 'STOCK_MUTATED');
  console.log('  [PASS] Transactional Outbox accurately captured all 3 local events');

  // Test 5: Cloud Sync Service (Supabase & VPS PostgreSQL Pipeline)
  console.log('Test 5: Cloud Sync Service - Upstream Push Execution');
  const cloudSync = new CloudSyncService(
  {
  driver: 'SUPABASE',
  supabase: {
  url: 'https://mock-supabase.local',
  anonKey: 'mock-key',
  },
  postgresVps: {
  endpoint: 'https://mock-vps.local/api/v1/sync',
  ssl: false,
  },
  syncOptions: {
  batchSize: 50,
  autoSyncIntervalMs: 30000,
  maxRetryAttempts: 3,
  retryBackoffBaseMs: 1000,
  timeoutMs: 5000,
  },
  },
  {
  db,
  refugeeRepo,
  inventoryRepo,
  outboxRepo,
  } as any
  );

  const syncResult = await cloudSync.syncAll('POS-CIJEDIL-01');
  assert.strictEqual(syncResult.success, true);
  assert.strictEqual(syncResult.pushedCount, 3, 'All 3 outbox events pushed to Cloud');

  // Test 6: Verify Local Outbox State after Successful Sync
  console.log('Test 6: Idempotent Outbox Acknowledgment (All Synced)');
  const postSyncOutbox = await outboxRepo.getPendingBatch(10);
  assert.strictEqual(postSyncOutbox.ok, true);
  assert.strictEqual(postSyncOutbox.value.length, 0, 'Outbox queue should now be empty (0 pending)');
  console.log('  [PASS] All Outbox records marked as ACKNOWLEDGED in Local SQLite');

  // Test 7: Secondary Sync Run (Zero redundant push)
  console.log('Test 7: Secondary Sync Run (No duplicate transmission)');
  const secondSync = await cloudSync.syncAll('POS-CIJEDIL-01');
  assert.strictEqual(secondSync.success, true);
  assert.strictEqual(secondSync.pushedCount, 0, 'No redundant push when outbox is clean');
  console.log('  [PASS] Idempotent Cloud Sync Verified');

  console.log('\n ALL LOCAL SQLITE -> CLOUD POSTGRES/SUPABASE TESTS PASSED (100% VERIFIED)!');
}

runLocalSqliteCloudSyncTests().catch((err) => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});
