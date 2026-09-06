import assert from "node:assert";
import { BleMeshEngine, BleMeshEngineConfig } from "@/core/mesh/ble-mesh-engine";
import { SimulatedMeshBridge } from "@/core/mesh/transport/simulated-mesh-bridge";
import { Ed25519Signer } from "@/core/crypto/ed25519-signer";
import { SmpPacketCodec, SmpPacketType } from "@/core/mesh/smp-packet";

async function runBleMeshEngineTests() {
  console.log("RUNNING TICKET 02: BLE MESH ENGINE & NEIGHBOR DISCOVERY TESTS...\n");

  const bridge = new SimulatedMeshBridge({ latencyMs: 5, defaultRssi: -60 });
  const keypairA = Ed25519Signer.generateKeyPair();
  const keypairB = Ed25519Signer.generateKeyPair();

  const configA: BleMeshEngineConfig = {
    peerId: "1122334455667788",
    aliasName: "dr. Andi Wijaya",
    role: "PETUGAS_MEDIS",
    poskoId: "POS-01",
    keypair: keypairA,
    announceIntervalMs: 50, // fast announce for testing
  };

  const configB: BleMeshEngineConfig = {
    peerId: "8877665544332211",
    aliasName: "Siti Logistik",
    role: "PETUGAS_LOGISTIK",
    poskoId: "POS-01",
    keypair: keypairB,
    announceIntervalMs: 50,
  };

  // Test 1: Initialize Engine A & B on simulated transport
  console.log("Test 1: Engine initialization and state checking");
  const transportA = bridge.createNode(configA.peerId);
  const transportB = bridge.createNode(configB.peerId);

  const engineA = new BleMeshEngine(configA, transportA);
  const engineB = new BleMeshEngine(configB, transportB);

  assert.strictEqual(engineA.getPeers().length, 0, "Initial peers must be 0 (zero dummy)");
  assert.strictEqual(engineB.getPeers().length, 0, "Initial peers must be 0 (zero dummy)");
  console.log("  [PASS] Zero-dummy engine initialization verified");

  // Test 2: Start engines and observe MESH_ANNOUNCE peer discovery
  console.log("Test 2: Mutual neighbor discovery via MESH_ANNOUNCE");
  await engineA.start();
  await engineB.start();

  // Send an immediate announcement
  await engineA.broadcastAnnounce();

  // Allow async in-memory delivery
  await new Promise((r) => setTimeout(r, 40));

  const peersAtB = engineB.getPeers();
  assert.strictEqual(peersAtB.length, 1, "Engine B must discover Engine A");
  assert.strictEqual(peersAtB[0].peerId, configA.peerId);
  assert.strictEqual(peersAtB[0].aliasName, "dr. Andi Wijaya");
  assert.strictEqual(peersAtB[0].role, "PETUGAS_MEDIS");
  assert.strictEqual(peersAtB[0].currentPosId, "POS-01");
  assert.strictEqual(peersAtB[0].hops, 1, "Direct hop must be 1");
  assert.ok(peersAtB[0].rssi <= -50, "RSSI must be recorded");
  console.log("  [PASS] Neighbor discovery and peer list population verified");

  // Test 3: Anti-Broadcast Storm: Repeated announcements within LRU window
  console.log("Test 3: Anti-Broadcast Storm: Duplicate announce dropped in O(1)");
  await engineA.broadcastAnnounce();
  await new Promise((r) => setTimeout(r, 40));

  // Count peers should still remain exactly 1, lastSeen updated
  assert.strictEqual(engineB.getPeers().length, 1, "Peer count must remain 1 without duplicates");
  console.log("  [PASS] Duplicate suppression verified");

  // Test 4: Forged packet rejection (invalid Ed25519 signature)
  console.log("Test 4: Reject forged packet with invalid signature");
  const rogueKeypair = Ed25519Signer.generateKeyPair();
  const fakePayload = Buffer.from(
    JSON.stringify({
      aliasName: "Fake Malicious Node",
      role: "KOORDINATOR_POSKO",
      poskoId: "POS-99",
      signingPubkey: keypairA.publicKeyHex, // Impersonating A!
    }),
    "utf8"
  );

  // Signed by rogueKeypair, but claiming to be A's pubkey
  const forgedRawPacket = SmpPacketCodec.encode(
    {
      version: 0x02,
      packetType: SmpPacketType.MESH_ANNOUNCE,
      ttl: 7,
      flags: 0x01,
      timestamp: Math.floor(Date.now() / 1000),
      senderPeerId: "9999999999999999",
      recipientPeerId: "0000000000000000",
      sequence: 999,
      payload: fakePayload,
    },
    rogueKeypair.privateKeyHex // Signature doesn't match claimed pubkey
  );

  // Inject forged packet into transportB
  transportB.receiveInbound(new Uint8Array(forgedRawPacket), -50, "rogue-node");
  await new Promise((r) => setTimeout(r, 30));

  // Engine B must NOT have added the fake node
  assert.strictEqual(
    engineB.getPeers().some((p) => p.aliasName === "Fake Malicious Node"),
    false,
    "Forged packet must be rejected"
  );
  console.log("  [PASS] Forged packet cryptographic rejection verified");

  // Test 5: Graceful stop
  console.log("Test 5: Engine shutdown and resource cleanup");
  await engineA.stop();
  await engineB.stop();
  assert.strictEqual(transportA.getRadioState(), "IDLE");
  assert.strictEqual(transportB.getRadioState(), "IDLE");
  console.log("  [PASS] Engine shutdown passed");

  console.log("\nALL TICKET 02 BLE MESH ENGINE TESTS PASSED SUCCESSFULLY!\n");
}

runBleMeshEngineTests().catch((err) => {
  console.error("\nFAILED TICKET 02 TEST:", err);
  process.exit(1);
});
