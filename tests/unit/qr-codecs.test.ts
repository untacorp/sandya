import assert from 'node:assert';
import {
  splitPayloadToAnimatedFrames,
  OutOfOrderFrameAssembler,
  computeCrc16,
} from '@/core/codecs/animated-qr-codec';
import { PosterGenerator } from '@/core/codecs/poster-generator';
import { XorParityEngine } from '@/core/codecs/parity-xor';
import { RolePassCodec } from '@/core/codecs/role-pass-codec';
import { Ed25519Signer } from '@/core/crypto/ed25519-signer';

async function runQrTests() {
  console.log('RUNNING Sandya QR CODECS TEST SUITE...\n');

  // 1. Test Animated Dynamic Multipart QR (Out-of-Order Capture)
  console.log('Test 1: Animated QR Out-of-Order Capture & Assembly (6 FPS Simulation)');
  const sampleLargePayload = Buffer.from(
  'SANDYA_OFFLINE_DISASTER_EVACUEE_DATA_'.repeat(100), // ~3.8 KB
  'utf8'
  );

  const frames = splitPayloadToAnimatedFrames(sampleLargePayload, 1000); // 4 chunks
  assert.strictEqual(frames.length, 4, 'Should be split into 4 frames');

  // Simulate camera capturing frames OUT OF ORDER: [Frame 2, Frame 0, Frame 3, Frame 1]
  const captureOrder = [frames[2]!, frames[0]!, frames[3]!, frames[1]!];
  const assembler = new OutOfOrderFrameAssembler();

  for (let i = 0; i < captureOrder.length; i++) {
  const frame = captureOrder[i]!;
  const res = assembler.ingestFrame(frame.rawBuffer);
  if (i < captureOrder.length - 1) {
  assert.strictEqual(res.completed, false, `Frame ${i} should not complete entire payload yet`);
  } else {
  assert.strictEqual(res.completed, true, 'Last frame should complete the assembly');
  assert.strictEqual(res.progress, 100);
  }
  }

  const restoredPayload = assembler.getFullPayload();
  assert.strictEqual(
  restoredPayload.toString('utf8'),
  sampleLargePayload.toString('utf8'),
  'Assembled payload must match original 100%'
  );
  console.log('  [PASS] Animated QR Out-of-Order Assembly Passed (100% Match)');

  // 2. Test Parity Poster Grid 4 (Erasure Coding Recovery)
  console.log('Test 2: Parity Poster Grid 4 (Torn QR Recovery)');
  const poskoPayload = Buffer.from('POSKO_DATA_WITH_500_EVACUEES_DISASTER_RECORDS', 'utf8');
  const posterSpec = PosterGenerator.generateGrid4Poster('Posko Cijedil RW 03', 500, 12, poskoPayload);
  assert.strictEqual(posterSpec.cells.length, 4, 'Grid 4 should have 4 QR cells');

  // Simulate loss of QR B (cell index 1)
  const remainingCells = [
  {
  data: Buffer.from(posterSpec.cells[0]!.qrPayloadBase64, 'base64'),
  index: posterSpec.cells[0]!.partIndex,
  totalChunks: 4,
  isParity: posterSpec.cells[0]!.isParity,
  originalLength: posterSpec.cells[0]!.byteLength,
  },
  {
  data: Buffer.from(posterSpec.cells[2]!.qrPayloadBase64, 'base64'),
  index: posterSpec.cells[2]!.partIndex,
  totalChunks: 4,
  isParity: posterSpec.cells[2]!.isParity,
  originalLength: posterSpec.cells[2]!.byteLength,
  },
  {
  data: Buffer.from(posterSpec.cells[3]!.qrPayloadBase64, 'base64'),
  index: posterSpec.cells[3]!.partIndex,
  totalChunks: 4,
  isParity: posterSpec.cells[3]!.isParity,
  originalLength: posterSpec.cells[3]!.byteLength,
  },
  ];

  const originalLengths = posterSpec.cells.slice(0, 3).map((c) => c.byteLength);
  const recoveredData = XorParityEngine.assembleFromChunks(remainingCells, 3, originalLengths);
  assert.strictEqual(
  recoveredData.toString('utf8'),
  poskoPayload.toString('utf8'),
  'Parity Poster must recover 100% of data when 1 QR is lost'
  );
  console.log('  [PASS] Parity Poster 1-QR Loss Recovery Passed (100% Recovery)');

  // 3. Test Role Pass QR (Ed25519 Signed Staff Card)
  console.log('Test 3: Role Pass QR Issuance & Cryptographic Verification');
  const masterKey = Ed25519Signer.generateKeyPair();
  const passQrString = RolePassCodec.issuePass(
  {
  orgId: 'ORG-01',
  missionId: 'MSN-2026-01',
  poskoId: 'POS-01',
  role: 'PETUGAS_MEDIS',
  userId: 'MED-099',
  userName: 'dr. Siti Rahmawati, Sp.A',
  issuedAt: Date.now(),
  expiresAt: Date.now() + 86400000 * 7, // 7 Hari
  },
  masterKey.privateKeyHex
  );

  const verifyResult = await RolePassCodec.verifyAndDecodePass(passQrString, masterKey.publicKeyHex);
  assert.strictEqual(verifyResult.ok, true, 'Valid pass must verify successfully');
  assert.strictEqual(verifyResult.value.role, 'PETUGAS_MEDIS');
  assert.strictEqual(verifyResult.value.userName, 'dr. Siti Rahmawati, Sp.A');

  // Verify forged key rejection
  const fakeKey = Ed25519Signer.generateKeyPair();
  const forgedResult = await RolePassCodec.verifyAndDecodePass(passQrString, fakeKey.publicKeyHex);
  assert.strictEqual(forgedResult.ok, false, 'Forged pass must be rejected');
  console.log('  [PASS] Role Pass QR Cryptographic Verification Passed');

  console.log('\n ALL QR CODEC TESTS PASSED SUCCESSFULLY (100% VERIFIED)!');
}

runQrTests().catch((err) => {
  console.error('[FAIL] QR Test Failed:', err);
  process.exit(1);
});
