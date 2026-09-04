import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET as getRefugees, POST as postRefugees } from '@/app/api/v1/refugees/route';
import { GET as getTimeline } from '@/app/api/v1/refugees/[refugeeId]/timeline/route';
import { GET as getLogistics } from '@/app/api/v1/logistics/route';
import { POST as mutateStock } from '@/app/api/v1/logistics/mutate/route';
import { POST as ingestPacket } from '@/app/api/v1/sync/ingest-packet/route';
import { POST as vectorProbe } from '@/app/api/v1/sync/vector-probe/route';
import { GET as getAnalytics } from '@/app/api/v1/analytics/route';
import { GET as getTactical, POST as postTactical } from '@/app/api/v1/tactical/messages/route';
import { Ed25519Signer } from '@/core/crypto/ed25519-signer';
import { packManifestV4 } from '@/core/codecs/bitpacker-v4';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { asPoskoId } from '@/core/shared/branded-types';

async function runIntegrationTests() {
  console.log('🧪 RUNNING SANIDYA V2 BACKEND INTEGRATION & API TEST SUITE...\n');
  const poskoId = 'posko-demo-001';

  // 1. Test POST /api/v1/refugees (Fast Intake)
  console.log('Test 1: POST /api/v1/refugees (Fast Intake Endpoint)');
  const intakeReq = new NextRequest('http://localhost:3000/api/v1/refugees', {
    method: 'POST',
    body: JSON.stringify({
      posId: '550e8400-e29b-41d4-a716-446655440000',
      fullName: 'Ahmad Dahlan',
      gender: 'M',
      age: 42,
      domicileOrigin: 'Dusun Cijedil RW 03',
      shelterLocation: 'Tenda 01',
      missingKinName: 'Siti Rahmawati',
      urgentNeeds: [0x01, 0x91], // Beras & Selimut
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'volunteer-alpha',
    },
  });

  const intakeRes = await postRefugees(intakeReq);
  assert.strictEqual(intakeRes.status, 201, 'Fast Intake should return 201 Created');
  const intakeData = await intakeRes.json();
  assert.strictEqual(intakeData.success, true);
  const createdRefugeeId = intakeData.data.refugeeId;
  assert.ok(createdRefugeeId, 'Should return refugee ID');
  console.log('  ✅ Fast Intake 201 Created Verified');

  // 2. Test GET /api/v1/refugees
  console.log('Test 2: GET /api/v1/refugees (Roster List)');
  const listReq = new NextRequest(`http://localhost:3000/api/v1/refugees?poskoId=550e8400-e29b-41d4-a716-446655440000`);
  const listRes = await getRefugees(listReq);
  assert.strictEqual(listRes.status, 200);
  const listData = await listRes.json();
  assert.strictEqual(listData.success, true);
  assert.ok(listData.count >= 1, 'Should find newly registered refugee');
  console.log('  ✅ Refugee Roster Query 200 OK Verified');

  // 3. Test GET /api/v1/refugees/[refugeeId]/timeline
  console.log('Test 3: GET /api/v1/refugees/[refugeeId]/timeline (Event Sourcing Chronology)');
  const timelineReq = new NextRequest(`http://localhost:3000/api/v1/refugees/${createdRefugeeId}/timeline`);
  const timelineRes = await getTimeline(timelineReq, {
    params: Promise.resolve({ refugeeId: createdRefugeeId }),
  });
  assert.strictEqual(timelineRes.status, 200);
  const timelineData = await timelineRes.json();
  assert.strictEqual(timelineData.success, true);
  assert.ok(timelineData.eventCount >= 1, 'Initial intake event should be recorded');
  assert.strictEqual(timelineData.timeline[0].eventType, 'INTAKE');
  console.log('  ✅ Event Sourcing Timeline 200 OK Verified');

  // 4. Test GET /api/v1/logistics & POST /api/v1/logistics/mutate (Single-Writer)
  console.log('Test 4: Logistics Inventory & Single-Writer Mutation');
  const logisticsReq = new NextRequest(`http://localhost:3000/api/v1/logistics?poskoId=posko-demo-001`);
  const logisticsRes = await getLogistics(logisticsReq);
  assert.strictEqual(logisticsRes.status, 200);
  const logisticsData = await logisticsRes.json();
  assert.strictEqual(logisticsData.success, true);
  assert.ok(logisticsData.count >= 1);
  const targetItem = logisticsData.data[0];

  // Authorized mutation by LOGISTIK
  const mutateReq = new NextRequest('http://localhost:3000/api/v1/logistics/mutate', {
    method: 'POST',
    body: JSON.stringify({
      posId: '550e8400-e29b-41d4-a716-446655440000',
      itemId: targetItem.id,
      txType: 'DISTRIBUTION',
      quantityChange: -15,
      notes: 'Penyerahan sembako tenda 1',
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'LOGISTIK',
      'x-user-id': 'officer-001',
    },
  });
  const mutateRes = await mutateStock(mutateReq);
  assert.strictEqual(mutateRes.status, 200);
  const mutateData = await mutateRes.json();
  assert.strictEqual(mutateData.success, true);
  assert.strictEqual(mutateData.data.newQuantity, targetItem.currentQuantity - 15);

  // Unauthorized mutation by RELAWAN (must be 403 Forbidden)
  const unauthMutateReq = new NextRequest('http://localhost:3000/api/v1/logistics/mutate', {
    method: 'POST',
    body: JSON.stringify({
      posId: '550e8400-e29b-41d4-a716-446655440000',
      itemId: targetItem.id,
      txType: 'DISTRIBUTION',
      quantityChange: -5,
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'RELAWAN',
    },
  });
  const unauthMutateRes = await mutateStock(unauthMutateReq);
  assert.strictEqual(unauthMutateRes.status, 403, 'Relawan must be rejected from mutating stock');
  console.log('  ✅ Single-Writer Logistics Mutation & Protection Verified');

  // 5. Test POST /api/v1/sync/ingest-packet with Ed25519 Cryptography
  console.log('Test 5: POST /api/v1/sync/ingest-packet (Signed Ingestion)');
  const keypair = Ed25519Signer.generateKeyPair();
  const sampleManifest = {
    poskoName: 'Posko Tenda RW 02',
    defaultRegionCode: '320101',
    timestamp: Date.now(),
    persons: [
      {
        fullName: 'Budi Santoso',
        gender: 'M' as const,
        age: 38,
        vulnerabilities: 0,
        urgentNeeds: [0x01],
      },
      {
        fullName: 'Siti Rahmawati',
        gender: 'F' as const,
        age: 35,
        vulnerabilities: 0,
        urgentNeeds: [0x51],
      },
    ],
  };
  const packedBuf = packManifestV4(sampleManifest);
  const signatureHex = Ed25519Signer.signPayload(packedBuf, keypair.privateKeyHex);

  const ingestReq = new NextRequest('http://localhost:3000/api/v1/sync/ingest-packet', {
    method: 'POST',
    body: JSON.stringify({
      protocolVersion: 2,
      packetType: 0x11,
      originPosId: '550e8400-e29b-41d4-a716-446655440000',
      senderPeerId: 'peer-node-99',
      sequenceNumber: 42,
      payloadBase64: packedBuf.toString('base64'),
      signatureHex,
      timestamp: Date.now(),
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-origin-pubkey': keypair.publicKeyHex,
    },
  });
  const ingestRes = await ingestPacket(ingestReq);
  assert.strictEqual(ingestRes.status, 200);
  const ingestData = await ingestRes.json();
  assert.strictEqual(ingestData.success, true);
  assert.strictEqual(ingestData.data.ingestedCount, 2);
  console.log('  ✅ Ed25519 Cryptographic Ingestion 200 OK Verified');

  // 6. Test GET /api/v1/analytics
  console.log('Test 6: GET /api/v1/analytics (Disaster Heatmap & Burn-Rate Forecast)');
  const analyticsReq = new NextRequest('http://localhost:3000/api/v1/analytics?poskoId=550e8400-e29b-41d4-a716-446655440000');
  const analyticsRes = await getAnalytics(analyticsReq);
  assert.strictEqual(analyticsRes.status, 200);
  const analyticsData = await analyticsRes.json();
  assert.strictEqual(analyticsData.success, true);
  assert.ok(analyticsData.triageHeatmap.totalRefugees >= 1);
  assert.ok(analyticsData.burnRateForecast.length >= 0);
  console.log('  ✅ Disaster Analytics & KPI Telemetry 200 OK Verified');

  // 7. Test Tactical Chat & Radio Messages
  console.log('Test 7: POST & GET /api/v1/tactical/messages');
  const chatPostReq = new NextRequest('http://localhost:3000/api/v1/tactical/messages', {
    method: 'POST',
    body: JSON.stringify({
      channel: 'POSKO_ALL',
      contentType: 'TEXT',
      textContent: 'Koordinasi pergantian shift malam tenda darurat 01',
      isUrgent: false,
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-peer-id': 'peer-local-001',
      'x-user-name': 'Relawan Budi',
      'x-user-role': 'RELAWAN',
    },
  });
  const chatPostRes = await postTactical(chatPostReq);
  assert.strictEqual(chatPostRes.status, 201);
  const chatPostData = await chatPostRes.json();
  assert.strictEqual(chatPostData.success, true);
  assert.strictEqual(chatPostData.data.channel, 'POSKO_ALL');

  const chatGetReq = new NextRequest('http://localhost:3000/api/v1/tactical/messages?channel=POSKO_ALL');
  const chatGetRes = await getTactical(chatGetReq);
  assert.strictEqual(chatGetRes.status, 200);
  const chatGetData = await chatGetRes.json();
  assert.strictEqual(chatGetData.success, true);
  assert.ok(chatGetData.messages.length >= 1);
  console.log('  ✅ Tactical Message Broadcast & History 201/200 OK Verified');

  console.log('\n🎉 ALL BACKEND API INTEGRATION TESTS PASSED (100% SUCCESS)!');
}

runIntegrationTests().catch((err) => {
  console.error('❌ Integration Test Failed:', err);
  process.exit(1);
});
