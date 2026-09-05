import assert from 'node:assert';
import { IsomorphicEd25519 } from '@/core/crypto/ed25519-isomorphic';
import { generate12WordSeed, validateSeedPhrase, EMERGENCY_SEED_WORDS } from '@/core/crypto/seed-phrase';
import { RolePassCodec, RolePassPayload } from '@/core/codecs/role-pass-codec';

async function runRolePassAuthTests() {
  console.log('RUNNING SANDYA STEP 1: ISOMORPHIC ED25519 & ROLE PASS TESTS...\n');

  // 1. Isomorphic Ed25519 Key Generation & Verification
  console.log('Test 1: Isomorphic Ed25519 Key Generation, Sign & Verify');
  const keyPair = await IsomorphicEd25519.generateKeyPair();
  assert.ok(keyPair.publicKeyHex.length > 0, 'Public key SPKI hex must not be empty');
  assert.ok(keyPair.privateKeyHex.length > 0, 'Private key PKCS8 hex must not be empty');
  assert.strictEqual(keyPair.rawPublicKeyHex.length, 64, 'Raw public key must be 32 bytes (64 hex characters)');

  const testPayload = new TextEncoder().encode('SANDYA_OFFLINE_ROLE_PASS_TEST_2026');
  const signatureHex = await IsomorphicEd25519.sign(testPayload, keyPair.privateKeyHex);
  assert.strictEqual(signatureHex.length, 128, 'Ed25519 signature must be 64 bytes (128 hex chars)');

  const isValid = await IsomorphicEd25519.verify(testPayload, signatureHex, keyPair.publicKeyHex);
  assert.strictEqual(isValid, true, 'Valid signature must verify with SPKI public key');

  const isValidRaw = await IsomorphicEd25519.verify(testPayload, signatureHex, keyPair.rawPublicKeyHex);
  assert.strictEqual(isValidRaw, true, 'Valid signature must verify with Raw public key');

  const isTampered = await IsomorphicEd25519.verify(
  new TextEncoder().encode('TAMPERED_PAYLOAD'),
  signatureHex,
  keyPair.publicKeyHex
  );
  assert.strictEqual(isTampered, false, 'Tampered payload must fail verification');
  console.log('  [PASS] Isomorphic Ed25519 Key Generation & Sign/Verify Passed');

  // 2. 12-Word Seed Phrase Generator & Verifier
  console.log('Test 2: Emergency 12-Word Seed Phrase Generator & Validation');
  const seed = generate12WordSeed();
  assert.strictEqual(seed.length, 12, 'Must generate exactly 12 words');
  const isSeedValid = validateSeedPhrase(seed);
  assert.strictEqual(isSeedValid, true, 'Generated seed must pass validation');

  const invalidSeed = ['fakeWord1', 'fakeWord2'];
  assert.strictEqual(validateSeedPhrase(invalidSeed), false, 'Invalid seed must fail validation');
  console.log('  [PASS] Seed Phrase Generator & Validator Passed');

  // 3. Role Pass Issuance and Verification
  console.log('Test 3: Role Pass Issuance & Async Verification');
  const payload: RolePassPayload = {
  orgId: 'ORG-01',
  orgName: 'PMI Kabupaten Cianjur',
  missionId: 'MSN-01',
  missionName: 'Tanggap Darurat Gempa Cianjur',
  poskoId: 'POS-01',
  poskoName: 'Posko Lapangan RW 03 Cijedil',
  role: 'PETUGAS_MEDIS',
  userId: 'USR-DOC-01',
  userName: 'dr. Siti Rahmawati',
  issuedAt: Date.now(),
  expiresAt: Date.now() + 86400000 * 14,
  };

  const passString = await RolePassCodec.issuePassAsync(
  payload,
  keyPair.privateKeyHex,
  keyPair.rawPublicKeyHex
  );
  assert.ok(passString.startsWith('SANDYA_PASS_V1:'), 'Must start with SANDYA_PASS_V1: prefix');

  // Self-contained verification (without providing external pubkey)
  const decodedResult = await RolePassCodec.verifyAndDecodePass(passString);
  assert.strictEqual(decodedResult.ok, true, 'Self-contained pass must decode and verify successfully');
  assert.strictEqual(decodedResult.value.role, 'PETUGAS_MEDIS');
  assert.strictEqual(decodedResult.value.userName, 'dr. Siti Rahmawati');
  assert.strictEqual(decodedResult.value.poskoId, 'POS-01');

  // Verification with matching explicit pubkey
  const explicitResult = await RolePassCodec.verifyAndDecodePass(passString, keyPair.rawPublicKeyHex);
  assert.strictEqual(explicitResult.ok, true, 'Pass must verify with explicit public key');

  // Verification with forged/wrong pubkey
  const wrongKeyPair = await IsomorphicEd25519.generateKeyPair();
  const forgedResult = await RolePassCodec.verifyAndDecodePass(passString, wrongKeyPair.rawPublicKeyHex);
  assert.strictEqual(forgedResult.ok, false, 'Forged pass with wrong pubkey must fail');
  assert.strictEqual(forgedResult.error.code, 'FORGED_PASS');
  console.log('  [PASS] Role Pass Issuance & Forgery Protection Passed');

  // 4. Expired Pass Invariant
  console.log('Test 4: Expired Pass Invariant');
  const expiredPayload: RolePassPayload = {
  ...payload,
  issuedAt: Date.now() - 86400000 * 30,
  expiresAt: Date.now() - 86400000 * 1, // Expired yesterday
  };
  const expiredPassString = await RolePassCodec.issuePassAsync(
  expiredPayload,
  keyPair.privateKeyHex,
  keyPair.rawPublicKeyHex
  );
  const expiredResult = await RolePassCodec.verifyAndDecodePass(expiredPassString);
  assert.strictEqual(expiredResult.ok, false, 'Expired pass must be rejected');
  assert.strictEqual(expiredResult.error.code, 'EXPIRED_PASS');
  console.log('  [PASS] Expired Pass Invariant Passed');

  // 5. Manual Backup Code Fallback
  console.log('Test 5: Manual Code Generation & Fallback Decoder');
  const manualCode = RolePassCodec.generateManualCode(payload);
  assert.ok(manualCode.startsWith('SAN-MED-'), 'Manual code must reflect role prefix');

  const manualDecoded = await RolePassCodec.verifyAndDecodePass(manualCode);
  assert.strictEqual(manualDecoded.ok, true, 'Manual code must decode successfully');
  assert.strictEqual(manualDecoded.value.role, 'PETUGAS_MEDIS');
  console.log('  [PASS] Manual Backup Code Fallback Passed');

  console.log('\n ALL STEP 1 ROLE PASS & AUTH TESTS PASSED SUCCESSFULLY (100%)!');
}

runRolePassAuthTests().catch((err) => {
  console.error('[FAIL] Role Pass Auth Test Failed:', err);
  process.exit(1);
});
