import assert from 'node:assert';
import { CloudSyncService } from '@/infrastructure/sync/cloud-sync.service';
import { InMemorySqliteConnection } from '@/infrastructure/db/sqlite/sqlite-connection';
import { SqliteRefugeeRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-refugee.repository';
import { SqliteInventoryRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-inventory.repository';
import { SqliteOutboxRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-outbox.repository';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { asPoskoId } from '@/core/shared/branded-types';
import { type Organization, type DisasterMission, type Posko } from '@/shared/types';

async function runLiveSupabaseCloudSyncTests() {
  if (process.env.RUN_LIVE_SUPABASE_TESTS !== 'true') {
    console.log('Skipping live Supabase test suite (RUN_LIVE_SUPABASE_TESTS!=true). Use "pnpm test:live-sync" for live network verification.\n');
    return;
  }

  console.log('RUNNING LIVE SUPABASE CLOUD SYNC & ORG UPDATE TEST SUITE...\n');

  const db = new InMemorySqliteConnection();
  const refugeeRepo = new SqliteRefugeeRepository(db);
  const inventoryRepo = new SqliteInventoryRepository(db);
  const outboxRepo = new SqliteOutboxRepository(db);

  const container = {
    db,
    refugeeRepo,
    inventoryRepo,
    outboxRepo,
  } as unknown as ServiceContainer;

  const testConfig = {
    driver: 'SUPABASE' as const,
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgvcmokqhaowfwqitusq.supabase.co',
      anonKey:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndmNtb2txaGFvd2Z3cWl0dXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NTcwNTYsImV4cCI6MjEwNDIzMzA1Nn0.ZAxfQoR_ByvBZCQ3nMTXbQJvQMmWRDBfSDe79yG-ZZ0',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    postgresVps: {
      endpoint: 'https://vps.bpbd.go.id/api/v1/sync',
      ssl: false,
    },
    syncOptions: {
      batchSize: 50,
      autoSyncIntervalMs: 30000,
      maxRetryAttempts: 3,
      retryBackoffBaseMs: 1000,
      timeoutMs: 10000,
    },
  };

  const cloudSync = new CloudSyncService(testConfig, container);

  // Test 1: Sync Organization to Supabase
  console.log('Test 1: Sync Organization Update to Supabase');
  const testOrgId = `ORG-TEST-${Date.now()}`;
  const sampleOrg: Organization = {
    id: testOrgId,
    name: 'BPBD Kabupaten Test Cianjur',
    category: 'BPBD_PEMERINTAH',
    masterPubkey: `did:sandya:org_${testOrgId}`,
    contactNumber: '+62 812 3456 7890',
    headquartersAddress: 'Jl. Raya Cipanas No. 45, Cianjur',
    createdAt: Date.now(),
  };

  const orgSyncRes = await cloudSync.syncOrganizations([sampleOrg]);
  assert.strictEqual(orgSyncRes.count, 1, 'Should sync 1 organization to Supabase');
  console.log('  [PASS] Organization successfully synced to Supabase REST API');

  // Test 2: Sync Disaster Mission & Posko
  console.log('Test 2: Sync Disaster Mission & Posko to Supabase');
  const testMissionId = `MSN-TEST-${Date.now()}`;
  const sampleMission: DisasterMission = {
    id: testMissionId,
    orgId: testOrgId,
    name: 'Operasi Siaga Bencana Gempa 2026',
    disasterType: 'GEMPA_BUMI',
    status: 'ACTIVE_EMERGENCY',
    targetDays: 14,
    location: 'Kecamatan Cugenang',
    createdAt: Date.now(),
  };

  const missionSyncRes = await cloudSync.syncMissions([sampleMission]);
  assert.strictEqual(missionSyncRes.count, 1, 'Should sync 1 mission');

  const testPoskoId = `POS-TEST-${Date.now()}`;
  const samplePosko: Posko = {
    id: testPoskoId,
    orgId: testOrgId,
    missionId: testMissionId,
    name: 'Posko Lapangan Tenda 01',
    postType: 'FIELD_SHELTER',
    status: 'OPERATIONAL_NORMAL',
    capacity: 350,
    currentRefugees: 1,
    locationName: 'Lapangan Cijedil',
    createdAt: Date.now(),
  };

  const poskoSyncRes = await cloudSync.syncPoskos([samplePosko]);
  assert.strictEqual(poskoSyncRes.count, 1, 'Should sync 1 posko');
  console.log('  [PASS] Disaster Mission & Posko successfully synced to Supabase');

  // Test 3: Sync Refugee & Refugee Events (Timeline Event-Sourcing)
  console.log('Test 3: Sync Refugee & Refugee Events to Supabase');
  const testRefugeeId = `REF-TEST-${Date.now()}`;
  const sampleRefugee = {
    id: testRefugeeId,
    postId: testPoskoId,
    fullName: 'Siti Aminah Test',
    nik: '3203011234567899',
    gender: 'F' as const,
    age: 29,
    domicileOrigin: 'Kampung Cicariang RT 02',
    shelterLocation: 'Tenda A-1',
    vulnerabilities: ['IBU_HAMIL' as const],
    urgentNeeds: ['Susu Hamil', 'Vitamin'],
    registeredByUserId: 'USR-TEST-01',
    registeredByUserName: 'Petugas Test',
    triageStatus: 'GREEN' as const,
    createdAt: Date.now(),
  };

  const refugeeSyncRes = await cloudSync.syncRefugees([sampleRefugee]);
  assert.strictEqual(refugeeSyncRes.count, 1, 'Should sync 1 refugee to Supabase');

  const sampleEvent = {
    id: `EVT-TEST-${Date.now()}`,
    refugeeId: testRefugeeId,
    authorId: 'USR-TEST-01',
    authorName: 'Petugas Test',
    authorRole: 'PETUGAS_REGISTRASI' as const,
    eventType: 'INTAKE' as const,
    eventPayload: { intakeNote: 'Registrasi awal posko' },
    deviceTimestamp: Date.now(),
    logicalSeq: 1,
  };

  const eventSyncRes = await cloudSync.syncRefugeeEvents([sampleEvent]);
  assert.strictEqual(eventSyncRes.count, 1, 'Should sync 1 refugee event to Supabase');
  console.log('  [PASS] Refugee & Event Timeline successfully synced to Supabase');

  // Test 4: Push Outbox Event to Supabase events_outbox
  console.log('Test 4: Push SQLite Outbox Events to Supabase');
  await outboxRepo.enqueue({
    poskoId: asPoskoId(testPoskoId),
    topic: 'REFUGEE_INTAKE',
    payload: JSON.stringify({
      fullName: 'Ahmad Fauzan',
      gender: 'M',
      age: 34,
      shelterLocation: 'Tenda B-02',
    }),
  });

  const pushRes = await cloudSync.pushOutboxToCloud();
  assert.strictEqual(pushRes.pushedCount, 1, 'Should push 1 outbox event to Supabase');

  const pendingAfterPush = await outboxRepo.getPendingBatch(10);
  assert.strictEqual(pendingAfterPush.ok, true);
  assert.strictEqual(pendingAfterPush.value.length, 0, 'Outbox queue should now be acknowledged');
  console.log('  [PASS] Outbox event pushed to Supabase & marked ACKNOWLEDGED in SQLite');

  // Test 5: Pull from Cloud to Local
  console.log('Test 5: Pull entities from Supabase to Local');
  const pullRes = await cloudSync.pullFromCloud(testPoskoId);
  assert.strictEqual(typeof pullRes.pulledCount, 'number');
  assert.ok(pullRes.data, 'Pull data should exist');
  console.log(`  [PASS] Successfully pulled ${pullRes.pulledCount} non-test records from Supabase`);

  // Test 6: Archive test records so they are ignored by clients
  console.log('Test 6: Archive temporary test records');
  try {
    const authHeaders = {
      apikey: testConfig.supabase.anonKey,
      Authorization: `Bearer ${testConfig.supabase.anonKey}`,
      'Content-Type': 'application/json',
    };
    await fetch(`${testConfig.supabase.url}/rest/v1/disaster_missions?id=eq.${testMissionId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'CLOSED_ARCHIVED' }),
    });
    await fetch(`${testConfig.supabase.url}/rest/v1/posts?id=eq.${testPoskoId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'STANDBY', current_refugees: 0 }),
    });
    console.log('  [PASS] Successfully archived temporary test mission & post');
  } catch {
    console.log('  [WARN] Could not archive temporary test records');
  }

  // Test 7: Offline mode fallback check
  console.log('Test 7: Offline mode check');
  const offlineSync = new CloudSyncService({
    ...testConfig,
    driver: 'LOCAL_FIRST_OFFLINE',
  });
  const offlineRes = await offlineSync.syncAll();
  assert.strictEqual(offlineRes.success, true);
  assert.strictEqual(offlineRes.pushedCount, 0);
  assert.strictEqual(offlineRes.pulledCount, 0);
  console.log('  [PASS] LOCAL_FIRST_OFFLINE driver safely handles disconnected state');

  console.log('\n ALL LIVE SUPABASE CLOUD SYNC & ORG TESTS PASSED (100% SUCCESS)!');
}

runLiveSupabaseCloudSyncTests().catch((err) => {
  console.error('[FAIL] Supabase live test error:', err);
  process.exit(1);
});
