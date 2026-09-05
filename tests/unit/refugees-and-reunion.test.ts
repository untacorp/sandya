import assert from 'node:assert';
import { InMemorySqliteConnection } from '@/infrastructure/db/sqlite/sqlite-connection';
import { SqliteRefugeeRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-refugee.repository';
import { SqliteOutboxRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-outbox.repository';
import { FastIntakeUseCase } from '@/core/use-cases/refugees/fast-intake.usecase';
import { RecordRefugeeEventUseCase } from '@/core/use-cases/refugees/record-refugee-event.usecase';
import { FamilyReunionService } from '@/core/services/family-reunion.service';
import { RefugeeAggregate } from '@/core/domain/refugees/refugee.aggregate';
import { asRefugeeId, asPoskoId } from '@/core/shared/branded-types';

async function runRefugeesAndReunionTests() {
  console.log('RUNNING LANGKAH 2: REFUGEES INTAKE, EVENT SOURCING & FAMILY REUNION TEST SUITE...\n');

  const db = new InMemorySqliteConnection();
  const refugeeRepo = new SqliteRefugeeRepository(db);
  const outboxRepo = new SqliteOutboxRepository(db);

  const fastIntakeUseCase = new FastIntakeUseCase(refugeeRepo, outboxRepo);
  const recordEventUseCase = new RecordRefugeeEventUseCase(refugeeRepo, outboxRepo);
  const familyReunionService = new FamilyReunionService(refugeeRepo);

  const posko1Id = asPoskoId('POS-01');
  const posko2Id = asPoskoId('POS-02');

  // Test 1: Fast Mobile Intake with 0-Byte Dynamic NIK Null-Bypass
  console.log('Test 1: Fast Mobile Intake (Without KTP / 0 Byte NIK)');
  const intakeNoKtp = await fastIntakeUseCase.execute({
  poskoId: 'POS-01',
  fullName: 'Muhammad Budi Santoso',
  nationalId: null, // 0 byte null bypass
  gender: 'M',
  age: 34,
  domicileOrigin: 'Dusun Cijedil (RW 03)',
  shelterLocation: 'Tenda Darurat 02',
  missingKinName: 'Siti Rahmawati',
  registeredByUserId: 'USR-VOLUNTEER-01',
  });

  assert.strictEqual(intakeNoKtp.ok, true, 'Intake without KTP must succeed in emergency');
  const ref1Id = asRefugeeId(intakeNoKtp.value.refugeeId);
  const savedRef1 = await refugeeRepo.findById(ref1Id);
  assert.strictEqual(savedRef1.ok, true);
  assert.strictEqual(savedRef1.value?.toSnapshot().fullName, 'Muhammad Budi Santoso');
  assert.strictEqual(savedRef1.value?.toSnapshot().nationalId, null);
  console.log('  [PASS] Fast Intake 30s with Dynamic NIK Null-Bypass Passed');

  // Test 2: Initial Event Sourcing INTAKE Log
  console.log('Test 2: Initial Event Sourcing INTAKE Log & Monotonic Seq');
  const initialEvents = await refugeeRepo.getEventsByRefugeeId(ref1Id);
  assert.strictEqual(initialEvents.ok, true);
  assert.strictEqual(initialEvents.value.length, 1);
  assert.strictEqual(initialEvents.value[0]?.eventType, 'INTAKE');
  assert.strictEqual(initialEvents.value[0]?.logicalSeq, 1);
  console.log('  [PASS] Initial Event Sourcing INTAKE Log Passed');

  // Test 3: Append-Only Event Recording (HEALTH_CHECK & NEED_REPORTED)
  console.log('Test 3: Append-Only Event Sourcing (HEALTH_CHECK & Monotonic Sequence)');
  const healthCheckResult = await recordEventUseCase.execute({
  refugeeId: ref1Id,
  poskoId: 'POS-01',
  authorId: 'DOC-01',
  authorName: 'dr. Hendra',
  authorRole: 'MEDIS',
  eventType: 'HEALTH_CHECK',
  eventPayload: {
  triageCategory: 'YELLOW',
  vitalSigns: { systolic: 130, diastolic: 85, temperature: 38.5, complaint: 'Demam dan pusing' },
  },
  });

  assert.strictEqual(healthCheckResult.ok, true);
  assert.strictEqual(healthCheckResult.value.logicalSeq, 2);

  // Add another note event
  const noteResult = await recordEventUseCase.execute({
  refugeeId: ref1Id,
  poskoId: 'POS-01',
  authorId: 'USR-VOLUNTEER-01',
  authorName: 'Rizky',
  authorRole: 'RELAWAN',
  eventType: 'NOTE',
  eventPayload: { note: 'Pengungsi telah menerima paket P3K' },
  });
  assert.strictEqual(noteResult.ok, true);
  assert.strictEqual(noteResult.value.logicalSeq, 3);

  // Verify full chronological history
  const fullEvents = await refugeeRepo.getEventsByRefugeeId(ref1Id);
  assert.strictEqual(fullEvents.ok, true);
  assert.strictEqual(fullEvents.value.length, 3);
  assert.strictEqual(fullEvents.value[0]?.eventType, 'INTAKE');
  assert.strictEqual(fullEvents.value[1]?.eventType, 'HEALTH_CHECK');
  assert.strictEqual(fullEvents.value[2]?.eventType, 'NOTE');
  assert.strictEqual(fullEvents.value[2]?.causalParentId, fullEvents.value[1]?.id);
  console.log('  [PASS] Append-Only Event Sourcing & Causal Chaining Passed');

  // Test 4: Register Relative at Posko 02 (Siti Rahmawati seeking Muhammad Budi Santoso)
  console.log('Test 4: Register Relative at Posko 02 & Bi-Directional Match');
  const intakePosko2 = await fastIntakeUseCase.execute({
  poskoId: 'POS-02',
  fullName: 'Siti Rahmawati',
  nationalId: '3203015408920002',
  gender: 'F',
  age: 32,
  domicileOrigin: 'Dusun Cijedil (RW 03)',
  shelterLocation: 'Ruang Kelas 2B SDN 1 Pacet',
  missingKinName: 'Muhammad Budi Santoso',
  registeredByUserId: 'USR-VOLUNTEER-02',
  });
  assert.strictEqual(intakePosko2.ok, true);

  // Test 5: Family Reunion Service Search (Mode Warga / Guest)
  console.log('Test 5: Family Reunion Search (Guest Portal & Confidence Scoring)');
  const searchResults = await familyReunionService.searchRelatives({
  targetName: 'Siti Rahmawati',
  domicileOrigin: 'Dusun Cijedil',
  seekerName: 'Muhammad Budi Santoso',
  });

  assert.strictEqual(searchResults.ok, true);
  assert.ok(searchResults.value.length >= 1, 'Must find at least 1 match');
  const topMatch = searchResults.value[0]!;
  assert.strictEqual(topMatch.targetName, 'Siti Rahmawati');
  assert.strictEqual(topMatch.confidence, 99, 'Bi-directional match must have 99% confidence');
  assert.strictEqual(topMatch.status, 'CONFIRMED');
  console.log('  [PASS] Family Reunion Bi-Directional High Confidence Match Passed');

  // Test 6: Fuzzy Levenshtein Search (Typo Tolerance)
  console.log('Test 6: Fuzzy Levenshtein Search (Misspelled Name Tolerance)');
  const fuzzySearch = await familyReunionService.searchRelatives({
  targetName: 'Siti Rahma', // truncated
  domicileOrigin: 'Dusun Cijedil',
  });

  assert.strictEqual(fuzzySearch.ok, true);
  assert.ok(fuzzySearch.value.length >= 1, 'Fuzzy search should find candidate');
  assert.ok(fuzzySearch.value[0]!.confidence >= 75, 'Confidence must be >= 75% for partial match');
  console.log('  [PASS] Fuzzy Levenshtein Search Passed');

  // Test 7: Multi-Posko Audit Matcher
  console.log('Test 7: Posko Reunion Audit (Detecting Connected Pairs for Posko 01)');
  const poskoMatches = await familyReunionService.getPoskoReunionMatches(posko1Id);
  assert.strictEqual(poskoMatches.ok, true);
  assert.ok(poskoMatches.value.length >= 1, 'Posko 01 must automatically detect Siti at Posko 02');
  assert.strictEqual(poskoMatches.value[0]?.seekerName, 'Muhammad Budi Santoso');
  assert.strictEqual(poskoMatches.value[0]?.targetName, 'Siti Rahmawati');
  console.log('  [PASS] Posko Reunion Audit Matcher Passed');

  console.log('\n ALL LANGKAH 2 TESTS PASSED SUCCESSFULLY (100% GREEN)!\n');
}

runRefugeesAndReunionTests().catch((err) => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});
