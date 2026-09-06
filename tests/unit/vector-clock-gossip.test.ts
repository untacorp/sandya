import assert from "node:assert";
import { BleMeshEngine, BleMeshEngineConfig } from "@/core/mesh/ble-mesh-engine";
import { SimulatedMeshBridge } from "@/core/mesh/transport/simulated-mesh-bridge";
import { Ed25519Signer } from "@/core/crypto/ed25519-signer";
import { VectorClockGossipService, GossipEventRecord } from "@/core/mesh/vector-clock-gossip-service";

async function runVectorClockGossipTests() {
  console.log("RUNNING TICKET 04: VECTOR CLOCK GOSSIP & DATA MULE TESTS...\n");

  const bridge = new SimulatedMeshBridge({ latencyMs: 5, defaultRssi: -60 });
  const keypairA = Ed25519Signer.generateKeyPair();
  const keypairMule = Ed25519Signer.generateKeyPair();
  const keypairB = Ed25519Signer.generateKeyPair();

  const configA: BleMeshEngineConfig = {
    peerId: "AAAAAAAAAAAAAAA1",
    aliasName: "Posko 01 Kertajati",
    role: "KOORDINATOR_POSKO",
    poskoId: "POS-01",
    keypair: keypairA,
  };

  const configMule: BleMeshEngineConfig = {
    peerId: "MMMMMMMMMMMMMMM2",
    aliasName: "Relawan Runner (Mule)",
    role: "RELAWAN_LAPANGAN",
    poskoId: "POS-RUNNER",
    keypair: keypairMule,
  };

  const configB: BleMeshEngineConfig = {
    peerId: "BBBBBBBBBBBBBBB3",
    aliasName: "Posko 02 Sukamaju",
    role: "KOORDINATOR_POSKO",
    poskoId: "POS-02",
    keypair: keypairB,
  };

  // Node A and Mule are initially in vicinity
  const nodeA = bridge.createNode(configA.peerId);
  const nodeMule = bridge.createNode(configMule.peerId);

  const engineA = new BleMeshEngine(configA, nodeA);
  const engineMule = new BleMeshEngine(configMule, nodeMule);

  await engineA.start();
  await engineMule.start();

  const serviceA = new VectorClockGossipService(engineA, "POS-01");
  const serviceMule = new VectorClockGossipService(engineMule, "POS-RUNNER");

  // Test 1: Stage local outbox events at Posko 01
  console.log("Test 1: Stage local event-sourcing events at Posko 01");
  const event1: GossipEventRecord = {
    eventId: "EVT-01-REF-001",
    poskoId: "POS-01",
    logicalSeq: 1,
    topic: "REFUGEE_REGISTERED",
    payload: { fullName: "Bapak Sutrisno", age: 52 },
    timestamp: Date.now(),
  };

  const event2: GossipEventRecord = {
    eventId: "EVT-01-TRG-002",
    poskoId: "POS-01",
    logicalSeq: 2,
    topic: "TRIAGE_EXAM",
    payload: { triageStatus: "YELLOW", complaint: "Cedera Kaki" },
    timestamp: Date.now(),
  };

  serviceA.appendLocalEvent(event1);
  serviceA.appendLocalEvent(event2);

  assert.strictEqual(serviceA.getClockSnapshot()["POS-01"], 2, "Posko 01 clock sequence must be 2");
  console.log("  [PASS] Local outbox events staged with monotonic sequence");

  // Test 2: Synchronize Posko 01 -> Data Mule
  console.log("Test 2: Probe exchange and Delta sync between Posko 01 and Data Mule");
  await serviceMule.broadcastVectorProbe();

  // Allow async in-memory probe & delta exchange
  await new Promise((r) => setTimeout(r, 60));

  assert.strictEqual(
    serviceMule.getClockSnapshot()["POS-01"],
    2,
    "Data Mule must now have Posko 01 clock updated to 2"
  );
  assert.strictEqual(
    serviceMule.getAllEvents().length,
    2,
    "Data Mule must carry both events"
  );
  console.log("  [PASS] Data Mule successfully ingested delta events from Posko 01");

  // Test 3: Data Mule travels to isolated Posko 02 (disconnect from A, connect to B)
  console.log("Test 3: Data Mule physically walks to Posko 02 (Mesh Relay)");
  await engineA.stop(); // Posko 01 is now out of radio range

  const nodeB = bridge.createNode(configB.peerId);
  const engineB = new BleMeshEngine(configB, nodeB);
  await engineB.start();

  const serviceB = new VectorClockGossipService(engineB, "POS-02");
  assert.strictEqual(serviceB.getClockSnapshot()["POS-01"] || 0, 0, "Posko 02 initially has 0 events from Posko 01");

  const receivedAtB: GossipEventRecord[] = [];
  serviceB.onEventsApplied((events) => {
    receivedAtB.push(...events);
  });

  // Mule meets Posko 02 -> broadcasts probe
  await serviceMule.broadcastVectorProbe();
  await new Promise((r) => setTimeout(r, 60));

  assert.strictEqual(
    serviceB.getClockSnapshot()["POS-01"],
    2,
    "Posko 02 must have caught up to sequence 2 from Posko 01 via Data Mule"
  );
  assert.strictEqual(receivedAtB.length, 2, "Posko 02 must have received exactly 2 delta events");
  assert.strictEqual(receivedAtB[0].payload.fullName, "Bapak Sutrisno");
  assert.strictEqual(receivedAtB[1].payload.triageStatus, "YELLOW");
  console.log("  [PASS] Data Mule zero-touch offline mesh sync verified across isolated posts");

  // Test 4: Idempotency (repeated probe produces 0 duplicate application)
  console.log("Test 4: Idempotent gossip (no duplicate ingestion)");
  const currentCount = receivedAtB.length;
  await serviceMule.broadcastVectorProbe();
  await new Promise((r) => setTimeout(r, 40));

  assert.strictEqual(receivedAtB.length, currentCount, "No duplicate events should be applied");
  console.log("  [PASS] Idempotent delta sync verified");

  // Cleanup
  await engineMule.stop();
  await engineB.stop();

  console.log("\nALL TICKET 04 VECTOR CLOCK GOSSIP TESTS PASSED SUCCESSFULLY!\n");
}

runVectorClockGossipTests().catch((err) => {
  console.error("\nFAILED TICKET 04 TEST:", err);
  process.exit(1);
});
