import assert from 'node:assert';
import { IngestMeshPacketUseCase } from '@/core/use-cases/sync/ingest-mesh-packet.usecase';
import { LruSeenCache } from '@/core/mesh/seen-cache';
import { VectorClockTracker } from '@/core/mesh/vector-clock';
import { SmpPacketCodec, SmpPacketType, SmpPacket } from '@/core/mesh/smp-packet';
import { packManifestV4 } from '@/core/codecs/bitpacker-v4';
import { PttVoiceCodec } from '@/core/audio/ptt-codec';
import { Ed25519Signer } from '@/core/crypto/ed25519-signer';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { RefugeeAggregate, RefugeeEventProps } from '@/core/domain/refugees/refugee.aggregate';
import { Ok, Result } from '@/core/shared/result';
import { RefugeeId, PoskoId } from '@/core/shared/branded-types';

class MockRefugeeRepository implements IRefugeeRepository {
  public savedAggregates: RefugeeAggregate[] = [];

  async findById(_id: RefugeeId): Promise<Result<RefugeeAggregate | null>> {
    return Ok(null);
  }
  async findByPoskoId(_poskoId: PoskoId): Promise<Result<RefugeeAggregate[]>> {
    return Ok(this.savedAggregates);
  }
  async save(refugee: RefugeeAggregate): Promise<Result<void>> {
    this.savedAggregates.push(refugee);
    return Ok(undefined);
  }
  async saveBatch(refugees: RefugeeAggregate[]): Promise<Result<number>> {
    this.savedAggregates.push(...refugees);
    return Ok(refugees.length);
  }
  async getEventsByRefugeeId(_refugeeId: RefugeeId): Promise<Result<RefugeeEventProps[]>> {
    return Ok([]);
  }
  async findMissingKinMatches(_poskoId: PoskoId, _missingName: string): Promise<Result<RefugeeAggregate[]>> {
    return Ok([]);
  }
  async saveRawEvents(_events: RefugeeEventProps[]): Promise<Result<void>> {
    return Ok(undefined);
  }
  async getAllEvents(): Promise<Result<RefugeeEventProps[]>> {
    return Ok([]);
  }
}

async function runMeshIngestionTests() {
  console.log('RUNNING SANDYA MESH INGESTION PIPELINE SUITE...\n');

  const seenCache = new LruSeenCache(100);
  const vectorTracker = new VectorClockTracker({ 'POS-01': 10 });
  const mockRepo = new MockRefugeeRepository();
  const useCase = new IngestMeshPacketUseCase(seenCache, vectorTracker, mockRepo);

  // Test 1: Ingest Compact Presence Beacon (16 Bytes)
  console.log('Test 1: Ingest Compact Presence Beacon (16 Bytes)');
  const beaconBuf = SmpPacketCodec.encodeBeacon({
    version: 0x02,
    packetType: SmpPacketType.PRESENCE_BEACON,
    sequence: 1,
    timestamp: Math.floor(Date.now() / 1000),
    senderPeerId: '1122334455667788',
  });

  const beaconResult = await useCase.execute({ rawBuffer: beaconBuf, senderRssi: -62 });
  assert.strictEqual(beaconResult.ok, true, 'Beacon ingestion must succeed');
  assert.strictEqual(beaconResult.value.status, 'BEACON_RECORDED');
  assert.strictEqual(beaconResult.value.discoveredPeer?.peerId, '1122334455667788');
  assert.strictEqual(beaconResult.value.discoveredPeer?.rssi, -62);
  console.log('  [PASS] Compact Presence Beacon Ingestion Passed');

  // Test 2: Anti-Broadcast Storm (Duplicate Packet Dropping)
  console.log('Test 2: Anti-Broadcast Storm Duplicate Packet Dropping');
  const duplicateResult = await useCase.execute({ rawBuffer: beaconBuf });
  assert.strictEqual(duplicateResult.ok, true);
  assert.strictEqual(duplicateResult.value.status, 'DUPLICATE_DROPPED');
  assert.strictEqual(duplicateResult.value.isDuplicate, true);
  console.log('  [PASS] Duplicate Packet Dropped in O(1)');

  // Test 3: Ingest SYNC_DELTA_BATCH with Bitpacking v4
  console.log('Test 3: Ingest SYNC_DELTA_BATCH with Bitpacked Manifest into Repository');
  const manifestBuf = packManifestV4({
    poskoName: 'POS-02',
    timestamp: Math.floor(Date.now() / 1000),
    persons: [
      {
        fullName: 'Budi Santoso',
        gender: 'M',
        age: 38,
        nationalId: '3201123456780001',
        domicileOrigin: 'Desa Sukamaju',
        shelterLocation: 'Tenda A1',
        urgentNeeds: [],
        vulnerabilities: [],
      },
      {
        fullName: 'Siti Aminah',
        gender: 'F',
        age: 34,
        domicileOrigin: 'Desa Sukamaju',
        shelterLocation: 'Tenda A1',
        urgentNeeds: [],
        vulnerabilities: [],
      },
    ],
  });

  const deltaPacket: SmpPacket = {
    version: 0x02,
    packetType: SmpPacketType.SYNC_DELTA_BATCH,
    ttl: 7,
    flags: 0,
    timestamp: Math.floor(Date.now() / 1000),
    senderPeerId: 'aabbccddeeff0011',
    recipientPeerId: '0000000000000000',
    sequence: 15,
    payload: manifestBuf,
  };

  const deltaPacketBuf = SmpPacketCodec.encode(deltaPacket);
  const deltaResult = await useCase.execute({ rawBuffer: deltaPacketBuf });
  assert.strictEqual(deltaResult.ok, true);
  assert.strictEqual(deltaResult.value.status, 'PROCESSED');
  assert.strictEqual(deltaResult.value.ingestedRefugeesCount, 2);
  assert.strictEqual(mockRepo.savedAggregates.length, 2);
  assert.strictEqual(mockRepo.savedAggregates[0]?.fullName, 'Budi Santoso');
  assert.strictEqual(vectorTracker.getClock('aabbccddeeff0011'), 15);
  console.log('  [PASS] SYNC_DELTA_BATCH Ingested & Saved to Repository');

  // Test 4: Ingest SYNC_VECTOR_PROBE
  console.log('Test 4: Ingest SYNC_VECTOR_PROBE & Compute Delta Requests');
  const probePayload = Buffer.from(
    JSON.stringify({
      'POS-01': 15, // Remote is ahead
      'POS-02': 20, // New posko
    }),
    'utf8'
  );

  const probePacket: SmpPacket = {
    version: 0x02,
    packetType: SmpPacketType.SYNC_VECTOR_PROBE,
    ttl: 7,
    flags: 0,
    timestamp: Math.floor(Date.now() / 1000),
    senderPeerId: 'ccddeeff00112233',
    recipientPeerId: '0000000000000000',
    sequence: 2,
    payload: probePayload,
  };

  const probeResult = await useCase.execute({ rawBuffer: SmpPacketCodec.encode(probePacket) });
  assert.strictEqual(probeResult.ok, true);
  assert.strictEqual(probeResult.value.deltaRequests?.length, 2);
  const req1 = probeResult.value.deltaRequests?.find((d) => d.poskoId === 'POS-01');
  assert.strictEqual(req1?.fromSeq, 11);
  assert.strictEqual(req1?.toSeq, 15);
  console.log('  [PASS] SYNC_VECTOR_PROBE Delta Computation Passed');

  // Test 5: Ingest TACTICAL_BROADCAST message
  console.log('Test 5: Ingest TACTICAL_BROADCAST Message');
  const chatPacket: SmpPacket = {
    version: 0x02,
    packetType: SmpPacketType.TACTICAL_BROADCAST,
    ttl: 7,
    flags: 0,
    timestamp: Math.floor(Date.now() / 1000),
    senderPeerId: 'ffee112233445566',
    recipientPeerId: '0000000000000000',
    sequence: 3,
    payload: Buffer.from(
      JSON.stringify({
        senderName: 'Kapten SAR',
        channel: 'LOGISTIK_INDUK',
        content: 'Bantuan helikopter mendarat di helipad barat.',
      }),
      'utf8'
    ),
  };

  const chatResult = await useCase.execute({ rawBuffer: SmpPacketCodec.encode(chatPacket) });
  assert.strictEqual(chatResult.ok, true);
  assert.strictEqual(chatResult.value.tacticalMessage?.senderName, 'Kapten SAR');
  assert.strictEqual(chatResult.value.tacticalMessage?.channel, 'LOGISTIK_INDUK');
  assert.strictEqual(chatResult.value.tacticalMessage?.isUrgent, true);
  console.log('  [PASS] TACTICAL_BROADCAST Ingestion Passed');

  // Test 6: Ingest VOICE_NOTE_FRAME
  console.log('Test 6: Ingest VOICE_NOTE_FRAME Audio Frame');
  const dummyPcm = Buffer.alloc(400, 100);
  const voiceFrames = PttVoiceCodec.splitPttToBleFrames('MEDIS', 2500, dummyPcm);
  assert.ok(voiceFrames.length > 0);

  const voicePacket: SmpPacket = {
    version: 0x02,
    packetType: SmpPacketType.VOICE_NOTE_FRAME,
    ttl: 7,
    flags: 0,
    timestamp: Math.floor(Date.now() / 1000),
    senderPeerId: '1234567890abcdef',
    recipientPeerId: '0000000000000000',
    sequence: 4,
    payload: PttVoiceCodec.encodeFrame(voiceFrames[0]!),
  };

  const voiceResult = await useCase.execute({ rawBuffer: SmpPacketCodec.encode(voicePacket) });
  assert.strictEqual(voiceResult.ok, true);
  assert.strictEqual(voiceResult.value.voiceFrame?.channel, 'MEDIS');
  assert.strictEqual(voiceResult.value.voiceFrame?.durationMs, 2500);
  console.log('  [PASS] VOICE_NOTE_FRAME Ingestion Passed');

  console.log('\n ALL MESH INGESTION PIPELINE TESTS PASSED (100% SUCCESS)!');
}

runMeshIngestionTests().catch((err) => {
  console.error('[FAIL] Mesh Ingestion Test Failed:', err);
  process.exit(1);
});
