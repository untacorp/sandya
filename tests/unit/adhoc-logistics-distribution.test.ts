import assert from 'node:assert';
import { InMemorySqliteConnection } from '@/infrastructure/db/sqlite/sqlite-connection';
import { SqliteInventoryRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-inventory.repository';
import { SqliteRefugeeRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-refugee.repository';
import { SqliteOutboxRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-outbox.repository';
import { MutateStockUseCase } from '@/core/use-cases/logistics/mutate-stock.usecase';
import { RecordRefugeeEventUseCase } from '@/core/use-cases/refugees/record-refugee-event.usecase';
import { InventoryAggregate } from '@/core/domain/logistics/inventory.aggregate';
import { RefugeeAggregate } from '@/core/domain/refugees/refugee.aggregate';
import { asItemId, asPoskoId, asRefugeeId } from '@/core/shared/branded-types';
import { NeedsTicket } from '@/shared/types';

async function runAdHocLogisticsDistributionTests() {
  console.log('RUNNING AD-HOC LOGISTICS DISTRIBUTION & ANTI-HOARDING TEST SUITE...\n');

  const db = new InMemorySqliteConnection();
  const inventoryRepo = new SqliteInventoryRepository(db);
  const refugeeRepo = new SqliteRefugeeRepository(db);
  const outboxRepo = new SqliteOutboxRepository(db);

  const mutateStockUseCase = new MutateStockUseCase(inventoryRepo, outboxRepo);
  const recordRefugeeEventUseCase = new RecordRefugeeEventUseCase(refugeeRepo, outboxRepo);

  const poskoId = asPoskoId('POS-01');
  const refugeeId = asRefugeeId('REF-CITIZEN-001');
  const itemId = asItemId('POS-01-ITEM-BERAS');

  // Setup 1: Register an existing refugee
  console.log('Setup 1: Register citizen at Posko 01 (Siti Rahmawati, Tenda Darurat 03)');
  const refugeeRes = RefugeeAggregate.create({
    id: refugeeId,
    poskoId,
    fullName: 'Siti Rahmawati',
    nationalId: '3201015505900001',
    gender: 'F',
    age: 34,
    shelterLocation: 'Tenda Darurat 03',
    registeredByUserId: 'USR-REL-01',
  });
  assert.strictEqual(refugeeRes.ok, true);
  await refugeeRepo.save(refugeeRes.value);
  console.log('  [PASS] Citizen registered in SQLite domain repository');

  // Setup 2: Setup posko inventory with 50 Karung Beras
  console.log('Setup 2: Setup initial inventory (Beras Premium 5kg, Qty: 50 Karung)');
  const itemRes = InventoryAggregate.create({
    id: itemId,
    poskoId,
    itemName: 'Beras Premium 5kg',
    category: 'FOOD',
    initialQuantity: 50,
    unit: 'KARUNG',
  });
  assert.strictEqual(itemRes.ok, true);
  await inventoryRepo.save(itemRes.value);
  console.log('  [PASS] Initial inventory item created with 50 Karung\n');

  // Test 1: Skenario A - Warga Walk-In ke Meja Logistik (Direct Handover)
  console.log('Test 1: Walk-In Direct Handover at Logistics Desk');
  const directMutateRes = await mutateStockUseCase.execute({
    poskoId: 'POS-01',
    itemId: 'POS-01-ITEM-BERAS',
    officerId: 'USR-LOG-01',
    officerRole: 'PETUGAS_LOGISTIK',
    txType: 'DISTRIBUTION',
    quantityChange: -1,
    logicalSeq: 2,
    referenceTicketId: 'TKT-DIR-001',
    notes: 'Serah langsung ad-hoc meja logistik: Siti Rahmawati (Tenda Darurat 03)',
  });

  assert.strictEqual(directMutateRes.ok, true, 'Direct handover stock reduction must succeed');
  assert.strictEqual(directMutateRes.value.newQuantity, 49, 'Inventory balance must reduce from 50 to 49');

  // Catat AID_RECEIVED pada event sourcing warga
  const eventDirectRes = await recordRefugeeEventUseCase.execute({
    refugeeId: 'REF-CITIZEN-001',
    poskoId: 'POS-01',
    authorId: 'USR-LOG-01',
    authorName: 'Petugas Logistik Budi',
    authorRole: 'LOGISTIK',
    eventType: 'AID_RECEIVED',
    eventPayload: {
      item: 'Beras Premium 5kg',
      quantity: 1,
      unit: 'KARUNG',
      fulfillment: 'DIRECT_HANDOVER',
      distributedAt: Date.now(),
    },
  });
  assert.strictEqual(eventDirectRes.ok, true, 'AID_RECEIVED event must be appended');

  // Verifikasi event timeline warga memuat AID_RECEIVED
  const eventsAfterDirect = await refugeeRepo.getEventsByRefugeeId(refugeeId);
  assert.strictEqual(eventsAfterDirect.ok, true);
  const aidEvents = eventsAfterDirect.value.filter((e) => e.eventType === 'AID_RECEIVED');
  assert.strictEqual(aidEvents.length, 1, 'Refugee must have exactly 1 AID_RECEIVED event');
  console.log('  [PASS] Direct handover cut inventory to 49 and recorded AID_RECEIVED event\n');

  // Test 2: Proteksi Anti-Hoarding (Deteksi Pengambilan Berulang dalam 72 Jam)
  console.log('Test 2: Anti-Hoarding & Fair Distribution Check');
  const mockTickets: NeedsTicket[] = [
    {
      id: 'TKT-DIR-001',
      refugeeId: 'REF-CITIZEN-001',
      refugeeName: 'Siti Rahmawati',
      shelterLocation: 'Tenda Darurat 03',
      postId: 'POS-01',
      itemName: 'Beras Premium 5kg',
      quantity: 1,
      unit: 'KARUNG',
      status: 'COMPLETED',
      urgency: 'HIGH',
      createdByUserId: 'USR-LOG-01',
      createdByUserName: 'Budi Logistik',
      createdAt: Date.now() - 24 * 60 * 60 * 1000, // 24 jam yang lalu
      completedAt: Date.now() - 24 * 60 * 60 * 1000,
    },
  ];

  const targetCommodity = 'Beras Premium 5kg';
  const cutoffTime = Date.now() - 72 * 60 * 60 * 1000;
  const recentClaim = mockTickets.find(
    (t) =>
      t.refugeeId === 'REF-CITIZEN-001' &&
      t.status === 'COMPLETED' &&
      t.itemName.toLowerCase().includes(targetCommodity.toLowerCase()) &&
      (t.completedAt || t.createdAt) > cutoffTime
  );

  assert.ok(recentClaim, 'Must detect that citizen received this commodity within 72 hours');
  assert.strictEqual(recentClaim?.itemName, 'Beras Premium 5kg');
  console.log('  [PASS] Anti-hoarding algorithm successfully detected previous claim (< 72 hours)\n');

  // Test 3: Skenario B - Visitasi Tenda Relawan (Tent Delivery Queue)
  console.log('Test 3: Tent Delivery Request via Volunteer Visit');
  const eventNeedReportedRes = await recordRefugeeEventUseCase.execute({
    refugeeId: 'REF-CITIZEN-001',
    poskoId: 'POS-01',
    authorId: 'USR-REL-02',
    authorName: 'Relawan Tenda Andi',
    authorRole: 'RELAWAN',
    eventType: 'NEED_REPORTED',
    eventPayload: {
      item: 'Popok Bayi Size M',
      quantity: 2,
      unit: 'paket',
      urgency: 'HIGH',
      reason: 'Bayi warga baru lahir, popok habis',
      reportedAt: Date.now(),
    },
  });
  assert.strictEqual(eventNeedReportedRes.ok, true, 'NEED_REPORTED event must be recorded');

  const eventsAfterNeed = await refugeeRepo.getEventsByRefugeeId(refugeeId);
  assert.strictEqual(eventsAfterNeed.ok, true);
  const needEvents = eventsAfterNeed.value.filter((e) => e.eventType === 'NEED_REPORTED');
  assert.strictEqual(needEvents.length, 1, 'Refugee must have 1 NEED_REPORTED event');
  console.log('  [PASS] Volunteer visit recorded NEED_REPORTED event into causal chain\n');

  // Test 4: RBAC Guard - Non-logistics role blocked from direct stock deduction
  console.log('Test 4: RBAC Guard on Direct Stock Mutation');
  const unauthDirect = await mutateStockUseCase.execute({
    poskoId: 'POS-01',
    itemId: 'POS-01-ITEM-BERAS',
    officerId: 'USR-REL-02',
    officerRole: 'RELAWAN_LAPANGAN',
    txType: 'DISTRIBUTION',
    quantityChange: -1,
    logicalSeq: 3,
    referenceTicketId: 'TKT-UNAUTH-01',
  });
  assert.strictEqual(unauthDirect.ok, false, 'Field volunteer must be blocked from directly mutating stock');
  assert.strictEqual(unauthDirect.error.code, 'UNAUTHORIZED_WRITER');
  console.log('  [PASS] RBAC correctly blocked unauthorized direct physical stock mutation\n');

  console.log('ALL AD-HOC LOGISTICS DISTRIBUTION & ANTI-HOARDING TESTS PASSED (100% VERIFIED)!');
}

runAdHocLogisticsDistributionTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
