import assert from 'node:assert';
import { SmpPacketCodec, SmpPacketType } from '@/core/mesh/smp-packet';
import { LruSeenCache } from '@/core/mesh/seen-cache';
import { VectorClockTracker } from '@/core/mesh/vector-clock';
import { PttVoiceCodec } from '@/core/audio/ptt-codec';
import { Ed25519Signer } from '@/core/crypto/ed25519-signer';

async function runBleMeshTests() {
  console.log('🧪 RUNNING SANIDYA V2 BLE MESH (SMP v1) TEST SUITE...\n');

  // 1. Test SMP v1 Framing & Ed25519 Digital Signing
  console.log('Test 1: SMP v1 Packet Framing & Ed25519 Signature Verification');
  const keypair = Ed25519Signer.generateKeyPair();
  const payloadData = Buffer.from('SOS_TACTICAL_EVAC_REQUIRED_TENDA_02', 'utf8');

  const rawPacket = SmpPacketCodec.encode(
    {
      version: 0x02,
      packetType: SmpPacketType.TACTICAL_BROADCAST,
      ttl: 7,
      flags: 0x01,
      timestamp: Math.floor(Date.now() / 1000),
      senderPeerId: '1122334455667788',
      recipientPeerId: '0000000000000000',
      sequence: 105,
      payload: payloadData,
    },
    keypair.privateKeyHex
  );

  const decodedResult = SmpPacketCodec.decode(rawPacket, keypair.publicKeyHex);
  assert.strictEqual(decodedResult.ok, true, 'SMP packet decode with valid signature must succeed');
  assert.strictEqual(decodedResult.value.sequence, 105);
  assert.strictEqual(decodedResult.value.packetType, SmpPacketType.TACTICAL_BROADCAST);
  assert.strictEqual(decodedResult.value.payload.toString('utf8'), payloadData.toString('utf8'));
  console.log('  ✅ SMP v1 Packet Framing & Signature Verification Passed');

  // 2. Test LRU Seen-Cache Deduplication (Anti-Broadcast Storm)
  console.log('Test 2: LRU Seen-Cache $O(1)$ Duplicate Drop');
  const seenCache = new LruSeenCache(10);
  const hash1 = LruSeenCache.computePacketHash('peer-01', 1, SmpPacketType.TACTICAL_BROADCAST);

  // First time seen -> not duplicate
  assert.strictEqual(seenCache.isDuplicate(hash1), false, 'First encounter must not be duplicate');
  // Second time seen (e.g. relayed from different neighbor) -> duplicate!
  assert.strictEqual(seenCache.isDuplicate(hash1), true, 'Second encounter must be flagged as duplicate');
  console.log('  ✅ LRU Seen-Cache Deduplication Passed');

  // 3. Test Vector Clock Multi-Posko Delta Detection
  console.log('Test 3: Multi-Posko Vector Clock Tracker & Delta Sync Requests');
  const tracker = new VectorClockTracker({
    'posko-01': 40,
    'posko-02': 100,
  });

  const remoteProbe = {
    'posko-01': 45, // Remote is ahead by 5 events
    'posko-02': 100, // Identical
    'posko-03': 12,  // New posko we don't have yet
  };

  const deltaRequests = tracker.computeDeltaRequirements(remoteProbe);
  assert.strictEqual(deltaRequests.length, 2, 'Should detect 2 poskos needing delta sync');

  const reqPosko1 = deltaRequests.find((d) => d.poskoId === 'posko-01');
  assert.strictEqual(reqPosko1?.fromSeq, 41);
  assert.strictEqual(reqPosko1?.toSeq, 45);

  const reqPosko3 = deltaRequests.find((d) => d.poskoId === 'posko-03');
  assert.strictEqual(reqPosko3?.fromSeq, 1);
  assert.strictEqual(reqPosko3?.toSeq, 12);
  console.log('  ✅ Vector Clock Delta Interval Detection Passed');

  // 4. Test PTT Voice Frame Splitter & Waveform Generator
  console.log('Test 4: PTT Voice Audio Frame Splitter & Waveform Calculation');
  const dummyVoicePcm = Buffer.alloc(1200, 150); // 1.2 KB dummy audio
  const pttFrames = PttVoiceCodec.splitPttToBleFrames('MEDIS', 3000, dummyVoicePcm);
  assert.ok(pttFrames.length >= 3, '1.2 KB should be split into multiple BLE frames');
  assert.strictEqual(pttFrames[0]!.waveform.length, 10, 'Should generate 10 waveform preview bars');
  console.log('  ✅ PTT Voice Codec Passed');

  console.log('\n🎉 ALL BLE MESH PROTOCOL TESTS PASSED SUCCESSFULLY (100% VERIFIED)!');
}

runBleMeshTests().catch((err) => {
  console.error('❌ BLE Mesh Test Failed:', err);
  process.exit(1);
});
