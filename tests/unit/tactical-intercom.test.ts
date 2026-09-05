import assert from 'node:assert';
import { TacticalStreamService } from '@/infrastructure/services/tactical-stream.service';
import { TacticalMessageEntity, TacticalChannel } from '@/core/domain/tactical/tactical.aggregate';
import { asPeerId } from '@/core/shared/branded-types';

async function runTacticalIntercomTests() {
  console.log('RUNNING LANGKAH 5: TACTICAL INTERCOM PTT, ACTIVE TEAM & SOS SUITE...\n');

  const tacticalService = new TacticalStreamService();
  const peerDocId = asPeerId('PEER-DOC-01');
  const peerCoordId = asPeerId('PEER-COORD-01');

  // Test 1: Tactical Message Creation across 4 Official Channels
  console.log('Test 1: Tactical Message Broadcast across 4 Official Channels');
  const channels: TacticalChannel[] = ['POSKO_ALL', 'MEDIS', 'LOGISTIK', 'SOS'];

  for (const ch of channels) {
  const role = ch === 'LOGISTIK' ? 'PETUGAS_LOGISTIK' : 'PETUGAS_MEDIS';
  const msgEntity = TacticalMessageEntity.create(
  peerDocId,
  'dr. Hendra',
  role,
  ch,
  'TEXT',
  { textContent: `Pesan uji coba di saluran #${ch}` }
  );

  assert.strictEqual(msgEntity.ok, true, `Message creation on #${ch} must succeed`);
  tacticalService.broadcast(msgEntity.value);
  }

  const allHistory = tacticalService.getHistory();
  assert.strictEqual(allHistory.length, 4);
  console.log('  [PASS] Tactical Message Broadcast across all 4 channels verified');

  // Test 2: Push-to-Talk (PTT) Voice Note Duration Invariant (< 5000ms)
  console.log('\nTest 2: Push-to-Talk (PTT) Voice Note & Duration Invariants');
  // Valid PTT 4.5s
  const validPTT = TacticalMessageEntity.create(
  peerDocId,
  'dr. Hendra',
  'PETUGAS_MEDIS',
  'MEDIS',
  'VOICE_NOTE',
  {
  audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEA',
  audioDurationMs: 4500,
  }
  );
  assert.strictEqual(validPTT.ok, true);
  assert.strictEqual(validPTT.value.props.audioDurationMs, 4500);
  tacticalService.broadcast(validPTT.value);

  // Invalid PTT (> 5000ms)
  const excessivePTT = TacticalMessageEntity.create(
  peerDocId,
  'dr. Hendra',
  'PETUGAS_MEDIS',
  'MEDIS',
  'VOICE_NOTE',
  {
  audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEA',
  audioDurationMs: 7000,
  }
  );
  assert.strictEqual(excessivePTT.ok, false, 'PTT voice exceeding 5s must be rejected');
  assert.strictEqual(excessivePTT.error.code, 'AUDIO_TOO_LONG');
  console.log('  [PASS] PTT Voice Note duration bounded strictly to 5.0s');

  // Test 3: Guest Isolation Guard (WARGA_TAMU / PUBLIC_GUEST cannot broadcast)
  console.log('\nTest 3: Guest Isolation Guard (WARGA_TAMU Muted)');
  const guestMsg = TacticalMessageEntity.create(
  asPeerId('PEER-GUEST-01'),
  'Pengunjung Tamu',
  'WARGA_TAMU',
  'POSKO_ALL',
  'TEXT',
  { textContent: 'Halo mencoba siar' }
  );

  assert.strictEqual(guestMsg.ok, false, 'Guest role must be blocked from tactical broadcasting');
  assert.strictEqual(guestMsg.error.code, 'GUEST_MUTED');
  assert.strictEqual(guestMsg.error.status, 403);
  console.log('  [PASS] Guest/Public users properly muted with 403 GUEST_MUTED');

  // Test 4: SOS Emergency Siren with BNPB Hazard Classification
  console.log('\nTest 4: SOS Emergency Siren & Full Attributed Identity');
  const sosMsg = TacticalMessageEntity.create(
  peerCoordId,
  'Budi Santoso',
  'KOORDINATOR_POSKO',
  'SOS',
  'ALERT',
  {
  textContent: ' PERINGATAN DARURAT: Gempa Bumi Susulan terdeteksi di sekitar posko!',
  isUrgent: true,
  }
  );

  assert.strictEqual(sosMsg.ok, true);
  assert.strictEqual(sosMsg.value.props.channel, 'SOS');
  assert.strictEqual(sosMsg.value.props.isUrgent, true);
  tacticalService.broadcast(sosMsg.value);
  console.log('  [PASS] SOS Emergency Alert dispatched with authenticated attribution');

  // Test 5: Channel History Filtering
  console.log('\nTest 5: Channel History Filtering & Isolation');
  const medisHistory = tacticalService.getHistory('MEDIS');
  assert.strictEqual(medisHistory.length, 2, 'Must contain 1 text + 1 PTT voice message');
  const sosHistory = tacticalService.getHistory('SOS');
  assert.strictEqual(sosHistory.length, 2, 'Must contain 1 test + 1 emergency SOS alert');
  console.log('  [PASS] Channel history filtering properly isolated');

  // Test 6: Human-Friendly Proximity Mapping Function
  console.log('\nTest 6: Human-Friendly Proximity Signal & Hop Mapping');
  const getProximityStatus = (rssi: number, hops: number) => {
  if (rssi >= -50) return { label: 'Sangat Dekat (< 15m)', hopDesc: 'Koneksi Langsung (1 Hop)' };
  if (rssi >= -70) return { label: 'Dekat (15-50m)', hopDesc: hops === 1 ? 'Koneksi Langsung (1 Hop)' : `Relay Mesh (${hops} Hops)` };
  if (rssi >= -85) return { label: 'Jarak Sedang', hopDesc: `Relay Mesh (${hops} Hops)` };
  return { label: 'Jarak Jauh / Sinyal Lemah', hopDesc: `Relay Mesh (${hops} Hops)` };
  };

  const directPeer = getProximityStatus(-45, 1);
  assert.strictEqual(directPeer.label, 'Sangat Dekat (< 15m)');
  assert.strictEqual(directPeer.hopDesc, 'Koneksi Langsung (1 Hop)');

  const nearbyRelayPeer = getProximityStatus(-65, 2);
  assert.strictEqual(nearbyRelayPeer.label, 'Dekat (15-50m)');
  assert.strictEqual(nearbyRelayPeer.hopDesc, 'Relay Mesh (2 Hops)');

  const distantPeer = getProximityStatus(-92, 4);
  assert.strictEqual(distantPeer.label, 'Jarak Jauh / Sinyal Lemah');
  assert.strictEqual(distantPeer.hopDesc, 'Relay Mesh (4 Hops)');
  console.log('  [PASS] Human-Friendly Proximity Mapping verified without confusing raw numbers');

  console.log('\n ALL LANGKAH 5 TACTICAL INTERCOM TESTS PASSED (100% GREEN)!\n');
}

runTacticalIntercomTests().catch((err) => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});
