import assert from 'node:assert';
import { InMemorySqliteConnection } from '@/infrastructure/db/sqlite/sqlite-connection';
import { SqliteInventoryRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-inventory.repository';
import { SqliteOutboxRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-outbox.repository';
import { MutateStockUseCase } from '@/core/use-cases/logistics/mutate-stock.usecase';
import { InventoryAggregate } from '@/core/domain/logistics/inventory.aggregate';
import { asItemId, asPoskoId } from '@/core/shared/branded-types';

async function runLogisticsSingleWriterTests() {
  console.log('RUNNING LANGKAH 4: LOGISTIK GUDANG POSKO, SINGLE-WRITER LEDGER & MUTUAL AID SUITE...\n');

  const db = new InMemorySqliteConnection();
  const inventoryRepo = new SqliteInventoryRepository(db);
  const outboxRepo = new SqliteOutboxRepository(db);

  const mutateStockUseCase = new MutateStockUseCase(inventoryRepo, outboxRepo);

  const posko1Id = asPoskoId('POS-01');
  const posko2Id = asPoskoId('POS-02');
  const itemId = asItemId('POS-01-ITEM-001');

  // Setup: Create initial inventory item at Posko 01
  console.log('Setup: Create initial inventory item (Beras 5kg, Qty: 100 Karung)');
  const initialItem = InventoryAggregate.create({
  id: itemId,
  poskoId: posko1Id,
  itemName: 'Beras Premium 5kg',
  category: 'FOOD',
  initialQuantity: 100,
  unit: 'KARUNG',
  });
  assert.strictEqual(initialItem.ok, true);
  await inventoryRepo.save(initialItem.value);
  console.log('  [PASS] Initial inventory item saved in repository');

  // Test 1: Single-Writer RBAC Rejection for Unauthorized Role (RELAWAN_LAPANGAN)
  console.log('\nTest 1: Single-Writer RBAC Guard - Reject Unauthorized Role (RELAWAN_LAPANGAN)');
  const unauthMutation = await mutateStockUseCase.execute({
  poskoId: 'POS-01',
  itemId: 'POS-01-ITEM-001',
  officerId: 'USR-REL-01',
  officerRole: 'RELAWAN_LAPANGAN',
  txType: 'DISTRIBUTION',
  quantityChange: -10,
  logicalSeq: 2,
  notes: 'Percobaan pemotongan tanpa hak akses logistik',
  });

  assert.strictEqual(unauthMutation.ok, false, 'Non-logistics officer must be blocked from mutating stock');
  assert.strictEqual(unauthMutation.error.code, 'UNAUTHORIZED_WRITER');
  assert.strictEqual(unauthMutation.error.status, 403);
  console.log('  [PASS] Unauthorized role mutation blocked with 403 UNAUTHORIZED_WRITER');

  // Test 2: Valid RESTOCK by Authorized PETUGAS_LOGISTIK
  console.log('\nTest 2: RESTOCK Operation by Authorized PETUGAS_LOGISTIK');
  const restockResult = await mutateStockUseCase.execute({
  poskoId: 'POS-01',
  itemId: 'POS-01-ITEM-001',
  officerId: 'USR-LOG-01',
  officerRole: 'PETUGAS_LOGISTIK',
  txType: 'RESTOCK',
  quantityChange: 50,
  logicalSeq: 2,
  notes: 'Penerimaan tambahan beras truk PMI Induk',
  });

  assert.strictEqual(restockResult.ok, true, 'RESTOCK execution must succeed');
  assert.strictEqual(restockResult.value.newQuantity, 150, 'Balance must increase from 100 to 150');
  console.log('  [PASS] RESTOCK successful: balance updated to 150 KARUNG');

  // Test 3: Non-Negative Stock Balance Invariant Guard
  console.log('\nTest 3: Non-Negative Balance Guard (Excessive Deduction Rejection)');
  const excessiveDeduction = await mutateStockUseCase.execute({
  poskoId: 'POS-01',
  itemId: 'POS-01-ITEM-001',
  officerId: 'USR-LOG-01',
  officerRole: 'PETUGAS_LOGISTIK',
  txType: 'DISTRIBUTION',
  quantityChange: -200, // available is only 150
  logicalSeq: 3,
  notes: 'Permintaan melebihi stok fisik',
  });

  assert.strictEqual(excessiveDeduction.ok, false, 'Deduction exceeding available balance must be rejected');
  assert.strictEqual(excessiveDeduction.error.code, 'INSUFFICIENT_STOCK');
  assert.strictEqual(excessiveDeduction.error.status, 409);
  console.log('  [PASS] Excessive deduction rejected with 409 INSUFFICIENT_STOCK');

  // Test 4: Valid DISTRIBUTION for Refugee Ticket Fulfillment
  console.log('\nTest 4: Valid DISTRIBUTION with referenceTicketId');
  const ticketDistResult = await mutateStockUseCase.execute({
  poskoId: 'POS-01',
  itemId: 'POS-01-ITEM-001',
  officerId: 'USR-LOG-01',
  officerRole: 'PETUGAS_LOGISTIK',
  txType: 'DISTRIBUTION',
  quantityChange: -25,
  logicalSeq: 3,
  referenceTicketId: 'TKT-101',
  notes: 'Distribusi beras untuk Tenda Darurat 01',
  });

  assert.strictEqual(ticketDistResult.ok, true);
  assert.strictEqual(ticketDistResult.value.newQuantity, 125);
  console.log('  [PASS] DISTRIBUTION successful: balance reduced to 125 KARUNG with ref TKT-101');

  // Test 5: Transactional Outbox Queuing for BLE Mesh Sync
  console.log('\nTest 5: Transactional Outbox Queuing (Topic: STOCK_MUTATED)');
  const outboxItems = await outboxRepo.getPendingBatch(10);
  assert.strictEqual(outboxItems.ok, true);
  const stockOutbox = outboxItems.value.find((m) => m.topic === 'STOCK_MUTATED');
  assert.ok(stockOutbox, 'Outbox must contain STOCK_MUTATED message');
  const outboxPayload = JSON.parse(stockOutbox.payload);
  assert.strictEqual(outboxPayload.itemId, 'POS-01-ITEM-001');
  assert.strictEqual(outboxPayload.officerRole, 'PETUGAS_LOGISTIK');
  console.log('  [PASS] STOCK_MUTATED event enqueued into Outbox for offline mesh gossiping');

  // Test 6: TRANSFER_OUT & TRANSFER_IN (Inter-Posko Mutual Aid)
  console.log('\nTest 6: Inter-Posko Mutual Aid (TRANSFER_OUT & TRANSFER_IN)');
  // Posko 01 transfers out 20 karung
  const transferOutResult = await mutateStockUseCase.execute({
  poskoId: 'POS-01',
  itemId: 'POS-01-ITEM-001',
  officerId: 'USR-COORD-01',
  officerRole: 'KOORDINATOR_POSKO',
  txType: 'TRANSFER_OUT',
  quantityChange: -20,
  logicalSeq: 4,
  notes: 'Surat jalan WB-2026-085 kirim ke Posko 02',
  });
  assert.strictEqual(transferOutResult.ok, true);
  assert.strictEqual(transferOutResult.value.newQuantity, 105);

  // Setup receiving item at Posko 02
  const item2Id = asItemId('POS-02-ITEM-001');
  const posko2Item = InventoryAggregate.create({
  id: item2Id,
  poskoId: posko2Id,
  itemName: 'Beras Premium 5kg',
  category: 'FOOD',
  initialQuantity: 10,
  unit: 'KARUNG',
  });
  assert.strictEqual(posko2Item.ok, true);
  await inventoryRepo.save(posko2Item.value);

  // Posko 02 receives 20 karung (TRANSFER_IN)
  const transferInResult = await mutateStockUseCase.execute({
  poskoId: 'POS-02',
  itemId: 'POS-02-ITEM-001',
  officerId: 'USR-LOG-02',
  officerRole: 'PETUGAS_LOGISTIK',
  txType: 'TRANSFER_IN',
  quantityChange: 20,
  logicalSeq: 2,
  notes: 'Penerimaan armada surat jalan WB-2026-085 dari Posko 01',
  });
  assert.strictEqual(transferInResult.ok, true);
  assert.strictEqual(transferInResult.value.newQuantity, 30);
  console.log('  [PASS] Inter-Posko Transfer successful: Posko 01 saldo 105, Posko 02 saldo 30');

  // Test 7: Persistence & Reconstitution Verification
  console.log('\nTest 7: Repository Reconstitution & Full Transaction History');
  const reloadedPosko1 = await inventoryRepo.findById(itemId);
  assert.strictEqual(reloadedPosko1.ok, true);
  assert.strictEqual(reloadedPosko1.value?.toSnapshot().currentQuantity, 105);

  const txs = await inventoryRepo.getTransactionsByItemId(itemId);
  assert.strictEqual(txs.ok, true);
  assert.strictEqual(txs.value.length, 3, 'Must record RESTOCK, DISTRIBUTION, and TRANSFER_OUT');
  // Test 8: DAMAGE Operation (Barang Rusak / Kadaluwarsa / Basah)
  console.log('\nTest 8: DAMAGE Operation (Pencatatan Barang Rusak / Kadaluwarsa)');
  const damageResult = await mutateStockUseCase.execute({
    poskoId: 'POS-01',
    itemId: 'POS-01-ITEM-001',
    officerId: 'USR-LOG-01',
    officerRole: 'PETUGAS_LOGISTIK',
    txType: 'DAMAGE',
    quantityChange: -5,
    logicalSeq: 5,
    notes: '5 karung beras basah terkena hujan di tenda logistik',
  });

  assert.strictEqual(damageResult.ok, true, 'DAMAGE execution must succeed');
  assert.strictEqual(damageResult.value.newQuantity, 100, 'Balance must decrease from 105 to 100');
  console.log('  [PASS] DAMAGE successful: balance updated to 100 KARUNG');

  // Test 9: Centralized Posko Permissions Verification
  console.log('\nTest 9: Posko Permissions Guard Helper Verification');
  const {
    canMutateStock,
    canApproveDistribution,
    canDeliverAid,
    canManageWaybills,
    canConductTriage,
    canManagePoskoTeam,
  } = await import('@/core/permissions/posko-permissions');

  assert.strictEqual(canMutateStock('PETUGAS_LOGISTIK'), true);
  assert.strictEqual(canMutateStock('KOORDINATOR_POSKO'), true);
  assert.strictEqual(canMutateStock('RELAWAN_LAPANGAN'), false);
  assert.strictEqual(canMutateStock('PETUGAS_MEDIS'), false);

  assert.strictEqual(canApproveDistribution('PETUGAS_LOGISTIK'), true);
  assert.strictEqual(canApproveDistribution('RELAWAN_LAPANGAN'), false);

  assert.strictEqual(canDeliverAid('RELAWAN_LAPANGAN'), true);
  assert.strictEqual(canDeliverAid('PETUGAS_LOGISTIK'), true);
  assert.strictEqual(canDeliverAid('WARGA_TAMU'), false);

  assert.strictEqual(canManageWaybills('PETUGAS_LOGISTIK'), true);
  assert.strictEqual(canManageWaybills('KOMANDAN_MISI'), true);
  assert.strictEqual(canManageWaybills('RELAWAN_LAPANGAN'), false);

  assert.strictEqual(canConductTriage('PETUGAS_MEDIS'), true);
  assert.strictEqual(canConductTriage('KOORDINATOR_POSKO'), true);
  assert.strictEqual(canConductTriage('PETUGAS_LOGISTIK'), false);
  assert.strictEqual(canConductTriage('RELAWAN_LAPANGAN'), false);

  assert.strictEqual(canManagePoskoTeam('KOORDINATOR_POSKO'), true);
  assert.strictEqual(canManagePoskoTeam('KOMANDAN_MISI'), true);
  assert.strictEqual(canManagePoskoTeam('PETUGAS_LOGISTIK'), false);
  console.log('  [PASS] All Posko Permissions verified across roles');

  console.log('\n ALL LANGKAH 4 UNIT TESTS PASSED (100% GREEN)!\n');
}

runLogisticsSingleWriterTests().catch((err) => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});
