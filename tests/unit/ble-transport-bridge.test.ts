import assert from 'node:assert';
import { BleTransport, BleRadioState } from '@/core/mesh/transport/ble-transport';
import { SimulatedMeshBridge, SimulatedMeshNode } from '@/core/mesh/transport/simulated-mesh-bridge';

async function runBleTransportBridgeTests() {
  console.log('RUNNING TICKET 01: BLE TRANSPORT ABSTRACTION & IN-MEMORY BRIDGE TESTS...\n');

  // Test 1: Instantiation of in-memory virtual mesh bridge
  console.log('Test 1: Create isolated simulated mesh bridge');
  const bridge = new SimulatedMeshBridge({ latencyMs: 10, defaultRssi: -65 });
  assert.strictEqual(bridge.nodeCount(), 0, 'Bridge starts with 0 nodes');
  console.log('  [PASS] Bridge initialization passed');

  // Test 2: Register nodes and verify radio state
  console.log('Test 2: Register Node A, Node B, and Node C');
  const nodeA = bridge.createNode('node-a');
  const nodeB = bridge.createNode('node-b');
  const nodeC = bridge.createNode('node-c');

  assert.strictEqual(bridge.nodeCount(), 3, 'Bridge has 3 registered nodes');
  assert.strictEqual(nodeA.getRadioState(), 'IDLE');

  await nodeA.startScanning();
  await nodeB.startScanning();
  await nodeC.startScanning();

  assert.strictEqual(nodeA.getRadioState(), 'SCANNING');
  assert.strictEqual(nodeB.getRadioState(), 'SCANNING');
  console.log('  [PASS] Radio state transitions passed');

  // Test 3: Broadcast packet from Node A -> received by Node B and Node C
  console.log('Test 3: Broadcast packet transmission from Node A to vicinity');
  const receivedAtB: { data: Uint8Array; rssi: number; senderNodeId: string }[] = [];
  const receivedAtC: { data: Uint8Array; rssi: number; senderNodeId: string }[] = [];

  nodeB.onPacketReceived((data, rssi, senderId) => {
    receivedAtB.push({ data, rssi, senderNodeId: senderId });
  });

  nodeC.onPacketReceived((data, rssi, senderId) => {
    receivedAtC.push({ data, rssi, senderNodeId: senderId });
  });

  const testPayload = Buffer.from('SANDYA_SMP_TEST_PACKET_PAYLOAD', 'utf8');
  const sent = await nodeA.broadcastPacket(testPayload);
  assert.strictEqual(sent, true, 'Broadcast must succeed');

  // Allow async in-memory delivery
  await new Promise((r) => setTimeout(r, 40));

  assert.strictEqual(receivedAtB.length, 1, 'Node B must receive 1 packet');
  assert.strictEqual(Buffer.from(receivedAtB[0].data).toString('utf8'), 'SANDYA_SMP_TEST_PACKET_PAYLOAD');
  assert.strictEqual(receivedAtB[0].senderNodeId, 'node-a');
  assert.ok(receivedAtB[0].rssi <= -50, 'RSSI must reflect realistic radio distance');

  assert.strictEqual(receivedAtC.length, 1, 'Node C must receive 1 packet');
  assert.strictEqual(receivedAtC[0].senderNodeId, 'node-a');
  console.log('  [PASS] In-memory multi-node broadcast verified');

  // Test 4: Node self-exclusion (Node A does not receive its own broadcast)
  console.log('Test 4: Node does not loop back its own broadcast');
  const receivedAtA: unknown[] = [];
  nodeA.onPacketReceived((d) => receivedAtA.push(d));

  await nodeA.broadcastPacket(Buffer.from('SELF_CHECK', 'utf8'));
  await new Promise((r) => setTimeout(r, 30));

  assert.strictEqual(receivedAtA.length, 0, 'Node must never receive its own raw transmission');
  console.log('  [PASS] Anti-loopback self exclusion passed');

  // Test 5: MTU enforcement (packet exceeding 469 bytes rejected)
  console.log('Test 5: BLE MTU enforcement');
  const oversizedPayload = Buffer.alloc(500, 0xff);
  let oversizedError = false;
  try {
    await nodeA.broadcastPacket(oversizedPayload);
  } catch {
    oversizedError = true;
  }
  assert.strictEqual(oversizedError, true, 'Packets exceeding BLE MTU 469B must be rejected');
  console.log('  [PASS] BLE MTU enforcement passed');

  // Cleanup
  await nodeA.stopScanning();
  await nodeB.stopScanning();
  await nodeC.stopScanning();
  assert.strictEqual(nodeA.getRadioState(), 'IDLE');

  console.log('\nALL TICKET 01 BLE TRANSPORT TESTS PASSED SUCCESSFULLY!\n');
}

runBleTransportBridgeTests().catch((err) => {
  console.error('\nFAILED TICKET 01 TEST:', err);
  process.exit(1);
});
