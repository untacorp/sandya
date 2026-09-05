import assert from 'node:assert';
import { InMemorySqliteConnection } from '@/infrastructure/db/sqlite/sqlite-connection';
import { SqliteRefugeeRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-refugee.repository';
import { SqliteOutboxRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-outbox.repository';
import { FastIntakeUseCase } from '@/core/use-cases/refugees/fast-intake.usecase';
import { RecordTriageExamUseCase } from '@/core/use-cases/refugees/record-triage-exam.usecase';
import { asRefugeeId, asPoskoId } from '@/core/shared/branded-types';

async function runTriageMedisTests() {
  console.log('RUNNING LANGKAH 3: TRIASE MEDIS START 4-WARNA & AUTO-TICKET FARMASI TEST SUITE...\n');

  const db = new InMemorySqliteConnection();
  const refugeeRepo = new SqliteRefugeeRepository(db);
  const outboxRepo = new SqliteOutboxRepository(db);

  const fastIntakeUseCase = new FastIntakeUseCase(refugeeRepo, outboxRepo);
  const recordTriageUseCase = new RecordTriageExamUseCase(refugeeRepo, outboxRepo);

  // 1. Setup Patient Intake
  console.log('Setup: Register patient via Fast Intake');
  const intakeRes = await fastIntakeUseCase.execute({
  poskoId: 'POS-01',
  fullName: 'Ibu Ratna Kumalasari',
  nationalId: '3203014502800001',
  gender: 'F',
  age: 44,
  domicileOrigin: 'Dusun Cijedil RW 03',
  shelterLocation: 'Tenda Medis 01',
  registeredByUserId: 'USR-REL-01',
  });
  assert.strictEqual(intakeRes.ok, true);
  const refugeeId = intakeRes.value.refugeeId;
  console.log('  [PASS] Patient registered with ID:', refugeeId);

  // Test 1: RBAC Rejection for Unauthorized Role (RELAWAN_LAPANGAN)
  console.log('\nTest 1: RBAC Guard - Reject Unauthorized Role (RELAWAN_LAPANGAN)');
  const unauthExam = await recordTriageUseCase.execute({
  refugeeId,
  poskoId: 'POS-01',
  authorId: 'USR-REL-01',
  authorName: 'Rizky Relawan',
  authorRole: 'RELAWAN_LAPANGAN',
  triageCategory: 'RED',
  vitalSigns: { temperature: 39.2, pulse: 110, complaint: 'Demam tinggi & sesak' },
  });

  assert.strictEqual(unauthExam.ok, false, 'Unauthorized role must be rejected');
  assert.strictEqual(unauthExam.error.code, 'UNAUTHORIZED_ROLE');
  assert.strictEqual(unauthExam.error.status, 403);
  console.log('  [PASS] Non-medical/non-lead role properly blocked with 403 UNAUTHORIZED_ROLE');

  // Test 2: Successful Clinical Exam & Prescription by PETUGAS_MEDIS
  console.log('\nTest 2: Clinical Exam & Prescription by PETUGAS_MEDIS');
  const examResult = await recordTriageUseCase.execute({
  refugeeId,
  poskoId: 'POS-01',
  authorId: 'USR-DOC-01',
  authorName: 'dr. Hendra Sp.PD',
  authorRole: 'PETUGAS_MEDIS',
  triageCategory: 'RED',
  vitalSigns: {
  systolic: 150,
  diastolic: 95,
  temperature: 39.4,
  pulse: 108,
  spo2: 94,
  complaint: 'Hipertensi krisis & demam akut',
  diagnosis: 'Suspek Krisis Hipertensi + ISPA Akut',
  },
  prescriptions: [
  {
  needTokenId: 0x22, // Obat Hipertensi
  medicineName: 'Amlodipine 10mg',
  quantity: 3,
  unit: 'STRIP',
  dosage: '1x1 malam sesudah makan',
  },
  {
  needTokenId: 0x27, // Paracetamol
  medicineName: 'Paracetamol 500mg',
  quantity: 2,
  unit: 'STRIP',
  dosage: '3x1 sesudah makan',
  },
  {
  needTokenId: 0x29, // Tabung Oksigen Portabel
  medicineName: 'Tabung Oksigen',
  quantity: 1,
  unit: 'TABUNG',
  dosage: 'Aliran 2-4 L/menit bila sesak',
  },
  ],
  });

  assert.strictEqual(examResult.ok, true, 'Medical exam execution must succeed');
  assert.strictEqual(examResult.value.triageCategory, 'RED');
  assert.strictEqual(examResult.value.logicalSeq, 2);
  assert.strictEqual(examResult.value.prescriptionsIssued, 3);
  assert.strictEqual(examResult.value.ticketIds.length, 3);
  assert.ok(examResult.value.ticketIds[0]?.startsWith('TKT-RX-'));
  console.log('  [PASS] Clinical Exam recorded with Monotonic Seq 2 and 3 Rx Tickets issued');

  // Test 3: Verify Aggregate State & Snapshot in Repository
  console.log('\nTest 3: Verify Refugee Aggregate State');
  const savedRef = await refugeeRepo.findById(asRefugeeId(refugeeId));
  assert.strictEqual(savedRef.ok, true);
  const snap = savedRef.value?.toSnapshot();
  assert.strictEqual(snap?.currentTriage, 'RED');

  const allEvents = await refugeeRepo.getEventsByRefugeeId(asRefugeeId(refugeeId));
  assert.strictEqual(allEvents.ok, true);
  assert.strictEqual(allEvents.value.length, 2);
  assert.strictEqual(allEvents.value[0]?.eventType, 'INTAKE');
  assert.strictEqual(allEvents.value[1]?.eventType, 'HEALTH_CHECK');

  const healthEvent = allEvents.value[1];
  assert.strictEqual(healthEvent?.causalParentId, allEvents.value[0]?.id);
  const payload = healthEvent?.eventPayload as any;
  assert.strictEqual(payload.triageCategory, 'RED');
  assert.strictEqual(payload.vitalSigns.temperature, 39.4);
  assert.strictEqual(payload.prescriptions.length, 3);
  assert.strictEqual(payload.prescriptions[0].tokenHex, '0x22');
  assert.strictEqual(payload.prescriptions[0].medicineName, 'Obat Hipertensi (Amlodipine/Captopril)');
  assert.strictEqual(payload.prescriptions[1].tokenHex, '0x27');
  console.log('  [PASS] Event Sourcing History & Causal Chaining verified with DISASTER_NEEDS_CATALOG');

  // Test 4: Verify Outbox Message Enqueued for Mesh Sync
  console.log('\nTest 4: Verify Outbox Message for Tactical Mesh');
  const pendingOutbox = await outboxRepo.getPendingBatch(10);
  assert.strictEqual(pendingOutbox.ok, true);
  // We had 1 from intake + 1 from triage exam
  assert.strictEqual(pendingOutbox.value.length, 2);
  const triageOutboxMsg = pendingOutbox.value.find((m) => m.topic === 'TRIAGE_EXAM');
  assert.ok(triageOutboxMsg, 'Outbox must contain TRIAGE_EXAM topic');
  const outboxPayload = JSON.parse(triageOutboxMsg.payload);
  assert.strictEqual(outboxPayload.eventType, 'HEALTH_CHECK');
  console.log('  [PASS] Outbox Queue verified with TRIAGE_EXAM topic');

  // Test 5: Re-examination and Demotion of Triage (RED -> YELLOW)
  console.log('\nTest 5: Follow-up Exam (Reclassification to YELLOW)');
  const followUpResult = await recordTriageUseCase.execute({
  refugeeId,
  poskoId: 'POS-01',
  authorId: 'USR-DOC-01',
  authorName: 'dr. Hendra Sp.PD',
  authorRole: 'PETUGAS_MEDIS',
  triageCategory: 'YELLOW',
  vitalSigns: {
  systolic: 130,
  diastolic: 85,
  temperature: 37.8,
  pulse: 84,
  spo2: 98,
  complaint: 'Kondisi membaik setelah oksigen dan obat hipertensi',
  diagnosis: 'Pemulihan Krisis Hipertensi - Observasi Posko',
  },
  });

  assert.strictEqual(followUpResult.ok, true);
  assert.strictEqual(followUpResult.value.logicalSeq, 3);
  assert.strictEqual(followUpResult.value.triageCategory, 'YELLOW');

  const refUpdated = await refugeeRepo.findById(asRefugeeId(refugeeId));
  assert.strictEqual(refUpdated.value?.toSnapshot().currentTriage, 'YELLOW');
  console.log('  [PASS] Follow-up Exam with Monotonic Seq 3 and Triage Transition verified');

  console.log('\n ALL LANGKAH 3 UNIT TESTS PASSED (100% GREEN)!\n');
}

runTriageMedisTests().catch((err) => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});
