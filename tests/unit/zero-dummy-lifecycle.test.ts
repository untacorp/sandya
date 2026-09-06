import assert from 'node:assert';
import { usePoskoStore } from '@/features/posko/store/use-posko-store';
import { MESH_SYNC_CONSTANTS } from '@/features/posko/hooks/use-mesh-sync';

async function runZeroDummyPristineTests() {
  console.log('RUNNING SEAM 1: ZERO DUMMY PRISTINE STATE & LIFECYCLE TESTS...\n');

  // 1. Pristine Initial State (Zero Dummy Data)
  console.log('Test 1: Store starts in 100% pristine zero-dummy state');
  const state = usePoskoStore.getState();

  assert.strictEqual(state.organizations.length, 0, 'Organizations must start empty (zero dummy)');
  assert.strictEqual(state.missions.length, 0, 'Missions must start empty (zero dummy)');
  assert.strictEqual(state.poskos.length, 0, 'Poskos must start empty (zero dummy)');
  assert.strictEqual(state.refugees.length, 0, 'Refugees must start empty (zero dummy)');
  assert.strictEqual(state.inventory.length, 0, 'Inventory items must start empty (zero dummy)');
  assert.strictEqual(state.needsTickets.length, 0, 'Needs tickets must start empty (zero dummy)');
  assert.strictEqual(state.messages.length, 0, 'Tactical messages must start empty (zero dummy)');
  assert.strictEqual(state.peers.length, 0, 'Mesh peers must start empty (zero dummy)');
  assert.strictEqual(state.pendingOutboxCount, 0, 'Pending outbox must be 0');
  console.log('  [PASS] Pristine store verification passed');

  // 2. MESH_SYNC_CONSTANTS should not contain hardcoded simulated peers
  console.log('Test 2: Verification of zero dummy simulated peers');
  // @ts-expect-error Checking if SIMULATED_PEERS is removed or empty
  const simulatedPeers = MESH_SYNC_CONSTANTS.SIMULATED_PEERS;
  assert.ok(
    simulatedPeers === undefined || (Array.isArray(simulatedPeers) && simulatedPeers.length === 0),
    'SIMULATED_PEERS must be completely removed or empty so UI does not show fake personnel'
  );
  console.log('  [PASS] Zero dummy simulated peers verified');

  // 3. User Journey: Creation of Real Organization, Mission, and Posko
  console.log('Test 3: Creating real organization, mission, and posko');
  const org = state.addOrganization({
    name: 'BPBD Kabupaten Majalengka',
    category: 'BPBD_PEMERINTAH',
    masterPubkey: 'did:sandya:org_ed25519_test_pubkey',
  });
  assert.ok(org.id.startsWith('ORG-'), 'Real org must have generated ID');
  assert.strictEqual(org.name, 'BPBD Kabupaten Majalengka');

  const mission = state.addMission({
    orgId: org.id,
    name: 'Tanggap Bencana Banjir Bandang 2026',
    disasterType: 'BANJIR_BANDANG',
    status: 'ACTIVE_EMERGENCY',
    targetDays: 10,
    location: 'Kecamatan Kertajati',
  });
  assert.ok(mission.id.startsWith('MSN-'), 'Real mission must have generated ID');
  assert.strictEqual(mission.orgId, org.id);

  const posko = state.addPosko({
    orgId: org.id,
    missionId: mission.id,
    name: 'Posko Pengungsian Balai Desa Kertajati',
    postType: 'FIELD_SHELTER',
    status: 'OPERATIONAL_NORMAL',
    capacity: 250,
    locationName: 'Balai Desa Kertajati',
  });
  assert.ok(posko.id.startsWith('POS-'), 'Real posko must have generated ID');
  assert.strictEqual(posko.missionId, mission.id);

  // 4. Real Refugee Fast Intake
  console.log('Test 4: Register real refugee via Fast Intake');
  state.addRefugee({
    postId: posko.id,
    fullName: 'Bapak Suryana',
    age: 48,
    gender: 'M',
    originAddress: 'Dusun Sukamaju RT 02 RW 01',
    shelterLocation: 'Tenda A-3',
    triageStatus: 'YELLOW',
    vulnerabilities: ['LANSIA'],
    urgentNeeds: ['Obat Hipertensi', 'Selimut'],
    registeredByUserId: 'USR-PETUGAS',
    registeredByUserName: 'Petugas Lapangan',
  });

  const updatedState = usePoskoStore.getState();
  assert.strictEqual(updatedState.refugees.length, 1, 'Must contain exactly 1 registered refugee');
  assert.strictEqual(updatedState.refugees[0].fullName, 'Bapak Suryana');
  assert.strictEqual(updatedState.refugees[0].triageStatus, 'YELLOW');
  assert.ok(updatedState.pendingOutboxCount > 0, 'Registering refugee must queue outbox event');
  console.log('  [PASS] Real refugee fast intake verified');

  // 5. Test setPeers and resetLocalData
  console.log('Test 5: Testing ephemeral peers and resetLocalData');
  state.setPeers([
    {
      peerId: 'TEST-PEER-01',
      noisePubkey: 'noise_key',
      signingPubkey: 'sig_key',
      aliasName: 'Petugas Test',
      role: 'PETUGAS_MEDIS',
      rssi: -60,
      hops: 1,
      lastSeen: Date.now(),
    },
  ]);
  assert.strictEqual(usePoskoStore.getState().peers.length, 1);

  state.resetLocalData();
  const resetState = usePoskoStore.getState();
  assert.strictEqual(resetState.organizations.length, 0);
  assert.strictEqual(resetState.missions.length, 0);
  assert.strictEqual(resetState.poskos.length, 0);
  assert.strictEqual(resetState.refugees.length, 0);
  assert.strictEqual(resetState.inventory.length, 0);
  assert.strictEqual(resetState.peers.length, 0);
  console.log('  [PASS] Ephemeral peers and resetLocalData verified');

  console.log('\nALL SEAM 1 TESTS COMPLETED SUCCESSFULLY!\n');
}

runZeroDummyPristineTests().catch((err) => {
  console.error('\nFAILED SEAM 1 TEST:', err);
  process.exit(1);
});
