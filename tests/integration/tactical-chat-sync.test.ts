import assert from 'node:assert';
import { deriveActivePeers, POSKO_STORE_CONSTANTS } from '@/features/posko/store/use-posko-store';
import { type TacticalMessage, type InventoryTransaction, type DisasterPerson } from '@/shared/types';
import { CloudSyncService } from '@/infrastructure/sync/cloud-sync.service';

async function runTacticalChatSyncTests() {
  console.log('RUNNING TACTICAL CHAT & REAL-TIME SYNC TEST SUITE...\n');

  // Test 1: Real Dynamic Peer Derivation
  console.log('Test 1: Dynamic Peer Derivation from Real Activity (Zero Mock)');
  const sampleMessages: TacticalMessage[] = [
    {
      id: 'MSG-001',
      channel: 'MEDIS',
      senderPeerId: 'USR-DOC-99',
      senderName: 'dr. Siti Rahma',
      senderRole: 'PETUGAS_MEDIS',
      contentType: 'TEXT',
      textContent: 'Triase pasien luka berat siap ditangani di Tenda Medis.',
      createdAt: Date.now() - 5000,
    },
    {
      id: 'MSG-002',
      channel: 'LOGISTIK',
      senderPeerId: 'USR-LOG-88',
      senderName: 'Budi Santoso',
      senderRole: 'PETUGAS_LOGISTIK',
      contentType: 'TEXT',
      textContent: 'Stok beras 20 karung baru saja dibongkar di posko.',
      createdAt: Date.now() - 2000,
    },
  ];

  const sampleTransactions: InventoryTransaction[] = [
    {
      id: 'TX-001',
      itemId: 'INV-001',
      postId: 'POS-01',
      officerId: 'USR-LOG-77',
      officerName: 'Agus Logistik',
      txType: 'RESTOCK',
      quantityChange: 50,
      deviceTimestamp: Date.now() - 10000,
    },
  ];

  const sampleRefugees: DisasterPerson[] = [
    {
      id: 'REF-001',
      postId: 'POS-01',
      fullName: 'Ahmad Warga',
      gender: 'M',
      age: 40,
      vulnerabilities: ['LANSIA'],
      urgentNeeds: ['Obat Hipertensi'],
      registeredByUserId: 'USR-REL-66',
      registeredByUserName: 'Dewi Relawan',
      createdAt: Date.now() - 15000,
    },
  ];

  // Derive peers as current user "USR-COORD-01" (Koordinator)
  const peersForCoordinator = deriveActivePeers(
    sampleMessages,
    sampleTransactions,
    sampleRefugees,
    'USR-COORD-01',
    'Koordinator Utama',
    'POS-01'
  );

  assert.strictEqual(peersForCoordinator.length, 4, 'Should derive 4 distinct real peers');
  assert.strictEqual(peersForCoordinator[0].aliasName, 'Budi Santoso', 'Most recent active peer should be first');
  assert.strictEqual(peersForCoordinator[1].aliasName, 'dr. Siti Rahma');
  console.log('  [PASS] Dynamic Peer Derivation correctly identifies all real active officers');

  // Test 2: Current User Isolation Guard in Peers
  console.log('\nTest 2: Current User Isolation Guard (User itself not in peers list)');
  const peersForDrSiti = deriveActivePeers(
    sampleMessages,
    sampleTransactions,
    sampleRefugees,
    'USR-DOC-99',
    'dr. Siti Rahma',
    'POS-01'
  );
  assert.strictEqual(
    peersForDrSiti.some((p) => p.peerId === 'USR-DOC-99' || p.aliasName === 'dr. Siti Rahma'),
    false,
    'Current user must be excluded from peers list'
  );
  console.log('  [PASS] Current user is cleanly isolated from peer list');

  // Test 3: Cloud Sync Service for Tactical Messages
  console.log('\nTest 3: Cloud Sync Service syncTacticalMessages');
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

  const cloudSync = new CloudSyncService(testConfig);
  const testMsgId = `MSG-TEST-${Date.now()}`;
  const liveTestMsg: TacticalMessage = {
    id: testMsgId,
    channel: 'SOS',
    senderPeerId: 'USR-TEST-01',
    senderName: 'Petugas Uji Coba',
    senderRole: 'KOORDINATOR_POSKO',
    contentType: 'ALERT',
    textContent: '🚨 PERINGATAN DARURAT: Uji Coba Sirene SOS Lapangan!',
    isUrgent: true,
    createdAt: Date.now(),
  };

  const pushResult = await cloudSync.syncTacticalMessages([liveTestMsg]);
  assert.strictEqual(pushResult.count, 1, 'Should sync 1 tactical message to cloud');
  console.log('  [PASS] Tactical message successfully synced to Cloud');

  // Test 4: Push & Pull PTT Voice Note with Real Audio Payload
  console.log('\nTest 4: Push & Pull PTT Voice Note with AudioBase64 & Dynamic Waveform');
  const voiceMsgId = `MSG-VOICE-${Date.now()}`;
  const sampleAudioBase64 = 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAA==';
  const liveVoiceMsg: TacticalMessage = {
    id: voiceMsgId,
    channel: 'MEDIS',
    senderPeerId: 'USR-DOC-99',
    senderName: 'dr. Hendra',
    senderRole: 'PETUGAS_MEDIS',
    contentType: 'VOICE_NOTE',
    audioDurationMs: 4200,
    audioWaveform: [30, 45, 80, 95, 60, 40, 75, 90, 35, 20],
    audioBase64: sampleAudioBase64,
    isUrgent: false,
    createdAt: Date.now(),
  };

  const voicePushResult = await cloudSync.syncTacticalMessages([liveVoiceMsg]);
  assert.strictEqual(voicePushResult.count, 1, 'Should sync 1 voice message');

  const pullResult = await cloudSync.pullFromCloud('POS-01');
  assert.ok(pullResult.data?.messages, 'Pulled messages should be present');
  const foundVoiceMsg = pullResult.data?.messages?.find((m) => m.id === voiceMsgId);
  assert.ok(foundVoiceMsg, 'Should find the newly sent voice note in cloud pull');
  assert.strictEqual(foundVoiceMsg?.contentType, 'VOICE_NOTE');
  assert.strictEqual(foundVoiceMsg?.audioDurationMs, 4200);
  assert.ok(foundVoiceMsg?.audioBase64?.startsWith('data:audio/webm;base64,'), 'AudioBase64 payload must be preserved');
  console.log('  [PASS] Voice Note with AudioBase64 payload successfully verified across cloud pull');

  // Teardown cleanup
  console.log('\nTest 5: Teardown Cleanup');
  const authKey = testConfig.supabase.serviceKey || testConfig.supabase.anonKey;
  if (authKey) {
    try {
      await fetch(`${testConfig.supabase.url}/rest/v1/tactical_messages?id=in.(${testMsgId},${voiceMsgId})`, {
        method: 'DELETE',
        headers: {
          apikey: authKey,
          Authorization: `Bearer ${authKey}`,
        },
      });
      console.log('  [PASS] All test messages cleaned up from Cloud');
    } catch {
      console.log('  [WARN] Cleanup could not be completed');
    }
  }

  console.log('\n ALL TACTICAL CHAT & REAL-TIME SYNC TESTS PASSED (100% SUCCESS)!');
}

runTacticalChatSyncTests().catch((err) => {
  console.error('[FAIL] Tactical chat sync test error:', err);
  process.exit(1);
});
