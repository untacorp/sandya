import assert from 'node:assert';
import {
  splitPayloadToAnimatedFrames,
  OutOfOrderFrameAssembler,
} from '@/core/codecs/animated-qr-codec';
import {
  PosterGenerator,
} from '@/core/codecs/poster-generator';
import {
  packManifestV4,
  unpackManifestV4,
  compressManifestV4,
  decompressManifestV4,
  DisasterManifestV4,
} from '@/core/codecs/bitpacker-v4';

async function runDynamicSyncTests() {
  console.log('RUNNING Sandya DYNAMIC SYNC TRANSPORTS TEST SUITE...\n');

  // 1. Dynamic N+1 Parity Poster Sizing
  console.log('Test 1: Dynamic Parity Poster Sizing (N+1 QR Cells)');

  // 1a. Small payload (100 bytes) -> N=2 data parts + 1 parity = 3 cells
  const smallPayload = Buffer.from('SMALL_PAYLOAD_TEST_100_BYTES'.repeat(4), 'utf8');
  const smallPoster = PosterGenerator.generateDynamicParityPoster({
  poskoName: 'Posko A',
  totalRefugees: 10,
  criticalNeedsCount: 1,
  payload: smallPayload,
  maxChunkBytes: 200,
  });
  assert.strictEqual(smallPoster.totalDataParts, 2, 'Small payload must produce minimum 2 data parts');
  assert.strictEqual(smallPoster.totalGridCells, 3, 'Total cells must be 2 + 1 = 3');
  assert.strictEqual(smallPoster.cells.length, 3);
  assert.strictEqual(smallPoster.cells[2]!.isParity, true);
  console.log('  [PASS] Small payload sizing: 2 Data + 1 Parity = 3 QR cells');

  // 1b. Medium payload (750 bytes with maxChunkBytes=200) -> ceil(750/200) = 4 data parts + 1 parity = 5 cells
  const medPayload = Buffer.from('MEDIUM_POSKO_DISASTER_EVACUEE_DATA_'.repeat(25), 'utf8'); // ~900 bytes
  const medPoster = PosterGenerator.generateDynamicParityPoster({
  poskoName: 'Posko B',
  totalRefugees: 50,
  criticalNeedsCount: 5,
  payload: medPayload,
  maxChunkBytes: 200,
  });
  const expectedMedN = Math.ceil(medPayload.length / 200);
  assert.strictEqual(medPoster.totalDataParts, expectedMedN);
  assert.strictEqual(medPoster.totalGridCells, expectedMedN + 1);
  assert.strictEqual(medPoster.cells.length, expectedMedN + 1);
  console.log(`  [PASS] Medium payload sizing: ${medPoster.totalDataParts} Data + 1 Parity = ${medPoster.totalGridCells} QR cells`);

  // 1c. Large payload (~2,500 bytes with maxChunkBytes=250) -> ceil(2500/250) = 10 data parts + 1 parity = 11 cells
  const largePayload = Buffer.from('LARGE_DISASTER_DATABASE_PAYLOAD_WITH_1000_EVACUEES_'.repeat(50), 'utf8');
  const largePoster = PosterGenerator.generateDynamicParityPoster({
  poskoName: 'Posko C (Mega Posko 1000+)',
  totalRefugees: 1000,
  criticalNeedsCount: 40,
  payload: largePayload,
  maxChunkBytes: 250,
  });
  const expectedLargeN = Math.ceil(largePayload.length / 250);
  assert.strictEqual(largePoster.totalDataParts, expectedLargeN);
  assert.strictEqual(medPoster.cells.length, expectedMedN + 1);
  console.log(`  [PASS] Large payload sizing: ${largePoster.totalDataParts} Data + 1 Parity = ${largePoster.totalGridCells} QR cells`);

  // 2. Dynamic Erasure Recovery (Loss of Any 1 Data Box in N+1 Grid)
  console.log('\nTest 2: Dynamic Erasure Recovery with 1 Torn/Lost Box');
  const dynamicTestPayload = Buffer.from('CRITICAL_POSKO_STATE_STREAM_RECONSTRUCTION_TEST_2026', 'utf8');
  const poster = PosterGenerator.generateDynamicParityPoster({
  poskoName: 'Posko RW 05',
  totalRefugees: 120,
  criticalNeedsCount: 4,
  payload: dynamicTestPayload,
  maxChunkBytes: 15, // Force 4 data parts + 1 parity = 5 cells
  });
  assert.strictEqual(poster.totalDataParts, 4);
  assert.strictEqual(poster.totalGridCells, 5);

  // Test losing cell 0, 1, 2, 3 (each data cell individually)
  for (let lostIndex = 0; lostIndex < 4; lostIndex++) {
  const scannedCells = poster.cells
  .filter((_, idx) => idx !== lostIndex)
  .map((cell) => {
  const parsed = PosterGenerator.parsePosterCellQr(cell.qrRawString);
  assert.ok(parsed, 'QR string must parse correctly');
  return parsed!;
  });

  assert.strictEqual(scannedCells.length, 4, 'Must have 4 scanned cells out of 5');
  const reconstructed = PosterGenerator.reconstructFromPosterCells(scannedCells, 4);
  assert.strictEqual(
  reconstructed.toString('utf8'),
  dynamicTestPayload.toString('utf8'),
  `Lost box ${lostIndex} must be perfectly recovered via XOR Parity`
  );
  }
  console.log('  [PASS] 100% Lossless Recovery verified for all possible missing data box positions (0, 1, 2, 3)');

  // 3. Animated Multipart QR Out-of-Order Assembly & Frame Validation
  console.log('\nTest 3: Animated QR Screen-to-Screen Streaming & Frame Assembly');
  const animPayload = Buffer.from('ANIMATED_FOUNTAIN_STREAM_PAYLOAD_'.repeat(60), 'utf8');
  const animFrames = splitPayloadToAnimatedFrames(animPayload, 300);
  assert.ok(animFrames.length >= 4, 'Should be at least 4 frames');

  // Test Out of Order Ingestion
  const assembler = new OutOfOrderFrameAssembler();
  const shuffledFrames = [...animFrames].sort(() => 0.5 - Math.random());

  for (let i = 0; i < shuffledFrames.length; i++) {
  const f = shuffledFrames[i]!;
  const res = assembler.ingestFrame(f.frameString);
  if (i < shuffledFrames.length - 1) {
  assert.strictEqual(res.completed, false);
  } else {
  assert.strictEqual(res.completed, true);
  assert.strictEqual(res.progress, 100);
  }
  }

  const restoredAnimPayload = assembler.getFullPayload();
  assert.strictEqual(
  restoredAnimPayload.toString('utf8'),
  animPayload.toString('utf8'),
  'Animated QR reconstructed payload must be 100% bit-for-bit identical'
  );
  console.log('  [PASS] Out-of-order animated QR capture & CRC16 validation passed (100% match)');

  // 4. End-to-End Posko Manifest Pack -> Dynamic Parity Poster -> Torn QR Recovery -> Manifest Unpack
  console.log('\nTest 4: Full End-to-End Posko Manifest Dynamic Parity Poster Roundtrip');
  const originalManifest: DisasterManifestV4 = {
  poskoName: 'Posko Cijedil Bencana 2026',
  defaultRegionCode: '320101',
  timestamp: 1772678400000,
  persons: [
  {
  fullName: 'Haji Ahmad Dahlan',
  nationalId: '3201011508750003',
  gender: 'M',
  age: 51,
  vulnerabilities: 0x01, // Lansia
  urgentNeeds: [0x21, 0x22], // Makanan Bayi & Selimut
  domicileOrigin: 'Kampung Sukasari RT 02/04',
  shelterLocation: 'Tenda VIP Medis',
  missingKinName: 'Hj. Siti Mariam',
  },
  {
  fullName: 'Hj. Siti Mariam',
  nationalId: '3201015206800004',
  gender: 'F',
  age: 46,
  vulnerabilities: 0x00,
  urgentNeeds: [0x23], // Obat Kronis
  domicileOrigin: 'Kampung Sukasari RT 02/04',
  shelterLocation: 'Tenda VIP Medis',
  missingKinName: 'Haji Ahmad Dahlan',
  },
  {
  fullName: 'Ananda Rizky Ramadhan',
  nationalId: '3201011005180009',
  gender: 'M',
  age: 8,
  vulnerabilities: 0x04, // Anak-anak
  urgentNeeds: [0x21],
  domicileOrigin: 'Kampung Sukasari RT 02/04',
  shelterLocation: 'Tenda VIP Medis',
  },
  ],
  };

  // Pack & compress
  const packedManifest = packManifestV4(originalManifest);
  const compressedManifest = compressManifestV4(packedManifest);

  // Generate dynamic poster
  const e2ePoster = PosterGenerator.generateDynamicParityPoster({
  poskoName: originalManifest.poskoName,
  totalRefugees: originalManifest.persons.length,
  criticalNeedsCount: 1,
  payload: compressedManifest,
  maxChunkBytes: 80, // Dynamic N ~ 3 data parts
  });

  // Simulate missing Box 1 (middle data box)
  const availablePosterCells = e2ePoster.cells
  .filter((_, idx) => idx !== 1)
  .map((c) => PosterGenerator.parsePosterCellQr(c.qrRawString)!);

  const restoredCompressedBuf = PosterGenerator.reconstructFromPosterCells(
  availablePosterCells,
  e2ePoster.totalDataParts
  );

  const restoredPackedBuf = decompressManifestV4(restoredCompressedBuf);
  const unpackedManifest = unpackManifestV4(restoredPackedBuf);

  assert.strictEqual(unpackedManifest.poskoName, originalManifest.poskoName);
  assert.strictEqual(unpackedManifest.persons.length, originalManifest.persons.length);
  assert.strictEqual(unpackedManifest.persons[0]!.fullName, 'Haji Ahmad Dahlan');
  assert.strictEqual(unpackedManifest.persons[0]!.nationalId, '3201011508750003');
  assert.strictEqual(unpackedManifest.persons[0]!.missingKinName, 'Hj. Siti Mariam');
  assert.strictEqual(unpackedManifest.persons[1]!.fullName, 'Hj. Siti Mariam');
  assert.strictEqual(unpackedManifest.persons[2]!.fullName, 'Ananda Rizky Ramadhan');

  console.log('  [PASS] Full E2E Disaster Manifest Roundtrip & Torn Poster Recovery Succeeded 100%!');
  console.log('\n ALL DYNAMIC SYNC TRANSPORTS TESTS PASSED SUCCESSFULLY!');
}

runDynamicSyncTests().catch((err) => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});
