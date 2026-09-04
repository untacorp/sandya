import assert from 'node:assert';
import { ALL_USER_ROLES, STAFF_ROLES } from '@/core/shared/roles';
import { INDONESIAN_NAME_WORDS, tokenizeFullName, detokenizeFullName } from '@/core/codecs/name-dictionary';
import { NameTokenizer } from '@/core/codecs/name-tokenizer';
import { RefugeeAggregate } from '@/core/domain/refugees/refugee.aggregate';
import {
  InventoryAggregate,
  INVENTORY_CATEGORIES,
  MUTATION_TYPES,
} from '@/core/domain/logistics/inventory.aggregate';
import { TacticalMessageEntity } from '@/core/domain/tactical/tactical.aggregate';
import { XorParityEngine } from '@/core/codecs/parity-xor';
import { Ed25519Signer } from '@/core/crypto/ed25519-signer';
import { FastIntakeUseCase } from '@/core/use-cases/refugees/fast-intake.usecase';
import { InMemorySqliteConnection } from '@/infrastructure/db/sqlite/sqlite-connection';
import { SqliteRefugeeRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-refugee.repository';
import { SqliteInventoryRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-inventory.repository';
import { SqliteOutboxRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-outbox.repository';
import { asRefugeeId, asPoskoId, asItemId, asPeerId } from '@/core/shared/branded-types';

async function runCoreDomainTests() {
  console.log('🧪 RUNNING SANIDYA V2 CORE DOMAIN & ARCHITECTURE TEST SUITE...\n');

  // 1. Canonical Roles & Hierarchy Test
  console.log('Test 1: Canonical Roles & Staff Hierarchy');
  assert.strictEqual(ALL_USER_ROLES.length, 7, 'Must have 7 total user roles');
  assert.strictEqual(STAFF_ROLES.length, 6, 'Must have 6 staff roles (excluding WARGA_TAMU)');
  assert.strictEqual(ALL_USER_ROLES.includes('WARGA_TAMU'), true);
  assert.strictEqual((STAFF_ROLES as readonly string[]).includes('WARGA_TAMU'), false, 'WARGA_TAMU must not be in STAFF_ROLES');
  console.log('  ✅ Canonical Roles & Hierarchy Passed');

  // 2. Pre-Shared Name Dictionary & JSON Loader Test
  console.log('Test 2: Name Dictionary JSON & Deterministic Tokenizer');
  assert.strictEqual(INDONESIAN_NAME_WORDS.length, 2048, 'Must contain exactly 2048 curated words (11-bit index)');
  assert.strictEqual(INDONESIAN_NAME_WORDS[0], 'Dwi', 'First word in dictionary must match index 1');

  const commonName = 'Muhammad Budi Santoso';
  const tokenizedCommon = NameTokenizer.tokenize(commonName);
  assert.strictEqual(tokenizedCommon.totalWords, 3);
  assert.ok(tokenizedCommon.tokenizedWordsCount >= 1, 'Common words must map to dictionary tokens');
  const restoredCommon = NameTokenizer.detokenize(tokenizedCommon.tokens);
  assert.strictEqual(restoredCommon.toLowerCase(), commonName.toLowerCase(), 'Common name roundtrip lossless');

  const rareName = 'Xavier Zulkarnain';
  const tokenizedRare = NameTokenizer.tokenize(rareName);
  assert.strictEqual(tokenizedRare.literalWordsCount >= 1, true, 'Unmapped words must fallback to literal');
  const restoredRare = NameTokenizer.detokenize(tokenizedRare.tokens);
  assert.strictEqual(restoredRare.toLowerCase(), rareName.toLowerCase(), 'Rare name fallback lossless');
  console.log('  ✅ Name Dictionary JSON & Tokenizer Passed');

  // 3. Invariant Test: Refugee Creation & Validation
  console.log('Test 3: RefugeeAggregate Invariant Guards');
  const validRefugeeResult = RefugeeAggregate.create({
    id: asRefugeeId(crypto.randomUUID()),
    poskoId: asPoskoId(crypto.randomUUID()),
    fullName: 'Muhammad Budi Santoso',
    gender: 'M',
    age: 34,
    registeredByUserId: 'user-001',
    missingKinName: 'Siti Rahmawati',
  });
  assert.strictEqual(validRefugeeResult.ok, true, 'Valid refugee creation should succeed');
  assert.strictEqual(validRefugeeResult.value.toSnapshot().fullName, 'Muhammad Budi Santoso');

  // Invalid age invariant (>127)
  const invalidAgeResult = RefugeeAggregate.create({
    id: asRefugeeId(crypto.randomUUID()),
    poskoId: asPoskoId(crypto.randomUUID()),
    fullName: 'Agus',
    gender: 'M',
    age: 150,
    registeredByUserId: 'user-001',
  });
  assert.strictEqual(invalidAgeResult.ok, false, 'Invalid age (>127) must fail invariant');
  console.log('  ✅ RefugeeAggregate Invariants Passed');

  // 4. Logistics Inventory Single-Writer & Balance Protection
  console.log('Test 4: Inventory Single-Writer & Non-Negative Balance Guards');
  assert.ok(INVENTORY_CATEGORIES.length >= 8, 'Must define standard humanitarian supply categories');
  assert.ok(MUTATION_TYPES.length >= 4, 'Must define stock mutation types');

  const inventoryResult = InventoryAggregate.create({
    id: asItemId(crypto.randomUUID()),
    poskoId: asPoskoId(crypto.randomUUID()),
    itemName: 'Beras Ramos 5kg',
    category: 'FOOD',
    initialQuantity: 100,
    unit: 'KARUNG',
  });
  assert.strictEqual(inventoryResult.ok, true);
  const inventory = inventoryResult.value;

  // Mutate with authorized role (LOGISTIK)
  const mutateOk = inventory.mutateStock('officer-1', 'PETUGAS_LOGISTIK', 'DISTRIBUTION', -30, 1);
  assert.strictEqual(mutateOk.ok, true, 'Authorized distribution must succeed');
  assert.strictEqual(inventory.toSnapshot().currentQuantity, 70);

  // Unauthorized role (RELAWAN trying to mutate physical stock)
  const mutateUnauthorized = inventory.mutateStock('volunteer-1', 'RELAWAN_LAPANGAN', 'DISTRIBUTION', -10, 2);
  assert.strictEqual(mutateUnauthorized.ok, false, 'Relawan must be forbidden from mutating physical stock');

  // Negative balance attempt (trying to deduct 80 from remaining 70)
  const mutateNegative = inventory.mutateStock('officer-1', 'PETUGAS_LOGISTIK', 'DISTRIBUTION', -80, 3);
  assert.strictEqual(mutateNegative.ok, false, 'Deduction exceeding available balance must fail');
  console.log('  ✅ Inventory Single-Writer Invariants Passed');

  // 5. Tactical Channel Access Control
  console.log('Test 5: Tactical Channels & Guest Isolation');
  const guestAttempt = TacticalMessageEntity.create(
    asPeerId('peer-001'),
    'Guest User',
    'WARGA_TAMU',
    'POSKO_ALL',
    'TEXT',
    { textContent: 'Halo dari pengungsi' }
  );
  assert.strictEqual(guestAttempt.ok, false, 'Guest must be muted from broadcasting to tactical channels');

  const validMedicalMessage = TacticalMessageEntity.create(
    asPeerId('peer-002'),
    'dr. Siti',
    'PETUGAS_MEDIS',
    'MEDIS',
    'TEXT',
    { textContent: 'Butuh tambahan tabung oksigen di Tenda Medis' }
  );
  assert.strictEqual(validMedicalMessage.ok, true, 'Medical officer can broadcast to #medis channel');
  console.log('  ✅ Tactical Message Guards Passed');

  // 6. XOR Parity Erasure Coding Test
  console.log('Test 6: XOR Parity Erasure Coding (Recovering Lost Chunk)');
  const samplePayload = Buffer.from('SANIDYA_OFFLINE_DISASTER_DATA_PAYLOAD_WITH_EMERGENCY_RECORDS_2026', 'utf8');
  const splitResult = XorParityEngine.splitWithParity(samplePayload, 3);
  assert.strictEqual(splitResult.chunks.length, 4, '3 Data + 1 Parity Chunk');

  // Simulate loss of Chunk #1 (middle chunk)
  const originalLengths = splitResult.chunks.slice(0, 3).map((c) => c.originalLength);
  const remainingChunks = [splitResult.chunks[0]!, splitResult.chunks[2]!, splitResult.chunks[3]!]; // Chunk 1 lost!
  const restoredPayload = XorParityEngine.assembleFromChunks(remainingChunks, 3, originalLengths);
  assert.strictEqual(restoredPayload.toString('utf8'), samplePayload.toString('utf8'), 'Payload recovered perfectly from parity');
  console.log('  ✅ XOR Parity Recovery Passed (100% Lossless Recovery)');

  // 7. Cryptography Test: Ed25519 Sign & Verify
  console.log('Test 7: Ed25519 Keypair Generation & Signature Verification');
  const keypair = Ed25519Signer.generateKeyPair();
  const testData = Buffer.from('DISASTER_MANIFEST_OFFLINE_SIGNED_DATA', 'utf8');
  const signatureHex = Ed25519Signer.signPayload(testData, keypair.privateKeyHex);
  const isValid = Ed25519Signer.verifySignature(testData, signatureHex, keypair.publicKeyHex);
  assert.strictEqual(isValid, true, 'Signature verification must succeed');

  const isTampered = Ed25519Signer.verifySignature(Buffer.from('TAMPERED_DATA', 'utf8'), signatureHex, keypair.publicKeyHex);
  assert.strictEqual(isTampered, false, 'Tampered data must fail signature verification');
  console.log('  ✅ Ed25519 Cryptography Passed');

  // 8. End-to-End Use Case Pipeline Test
  console.log('Test 8: Fast Intake & Transactional Outbox Pipeline');
  const db = new InMemorySqliteConnection();
  const refugeeRepo = new SqliteRefugeeRepository(db);
  const inventoryRepo = new SqliteInventoryRepository(db);
  const outboxRepo = new SqliteOutboxRepository(db);

  const intakeUseCase = new FastIntakeUseCase(refugeeRepo, outboxRepo);
  const intakeResult = await intakeUseCase.execute({
    poskoId: crypto.randomUUID(),
    fullName: 'Siti Rahmawati',
    gender: 'F',
    age: 32,
    shelterLocation: 'Tenda 02',
    registeredByUserId: 'volunteer-1',
  });
  assert.strictEqual(intakeResult.ok, true);

  // Check outbox
  const pendingOutbox = await outboxRepo.getPendingBatch(10);
  assert.strictEqual(pendingOutbox.ok, true);
  assert.strictEqual(pendingOutbox.value.length, 1, 'Event must be recorded in transactional outbox');
  console.log('  ✅ End-to-End Pipeline & Outbox Verification Passed');

  console.log('\n🎉 ALL CORE DOMAIN TESTS PASSED SUCCESSFULLY (100% VERIFIED)!');
}

runCoreDomainTests().catch((err) => {
  console.error('❌ Core Domain Test Failed:', err);
  process.exit(1);
});
