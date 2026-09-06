import assert from "node:assert";
import { SimulatedMeshBridge } from "@/core/mesh/transport/simulated-mesh-bridge";
import { BleMeshEngine } from "@/core/mesh/ble-mesh-engine";
import { Ed25519Signer } from "@/core/crypto/ed25519-signer";
import { TacticalIntercomService } from "@/core/mesh/tactical-intercom-service";
import { VectorClockGossipService } from "@/core/mesh/vector-clock-gossip-service";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { WebBleTransport } from "@/core/mesh/transport/web-ble-transport";

async function runTicket05UiIntegrationTests() {
  console.log("RUNNING TICKET 05: UI INTEGRATION, RADAR & RADIO FALLBACK TESTS...\n");

  // Setup: Reset store to clean state
  usePoskoStore.getState().resetLocalData();
  usePoskoStore.getState().setSessionPosko("POS-01", "Posko Lapangan Mandiri");
  usePoskoStore.getState().setSessionUser("usr-relawan-1", "Budi Santoso");
  usePoskoStore.getState().setSessionRole("PETUGAS_LOGISTIK");

  // Test 1: Dynamic Peer Discovery without any hardcoded/mock data
  console.log("Test 1: Zero Dummy dynamic peer discovery into usePoskoStore");
  assert.strictEqual(usePoskoStore.getState().peers.length, 0, "Store starts with zero peers");

  const bridge = new SimulatedMeshBridge({ latencyMs: 5 });
  const keypair1 = Ed25519Signer.generateKeyPair();
  const keypair2 = Ed25519Signer.generateKeyPair();

  const node1 = bridge.createNode("1111111111111111");
  const node2 = bridge.createNode("2222222222222222");

  const engine1 = new BleMeshEngine(
    {
      peerId: "1111111111111111",
      aliasName: "dr. Siti Rahma",
      role: "PETUGAS_MEDIS",
      poskoId: "POS-01",
      keypair: keypair1,
    },
    node1
  );

  const engine2 = new BleMeshEngine(
    {
      peerId: "2222222222222222",
      aliasName: "Ahmad Fauzi (Tenda B)",
      role: "RELAWAN_LAPANGAN",
      poskoId: "POS-01",
      keypair: keypair2,
    },
    node2
  );

  await engine1.start();
  await engine2.start();

  // Engine 1 listens and pipes peers to store
  engine1.onPeersUpdated((peers) => {
    usePoskoStore.getState().setPeers(peers);
  });

  // Engine 2 announces
  await engine2.broadcastAnnounce();
  await new Promise((r) => setTimeout(r, 40));

  const livePeers = usePoskoStore.getState().peers;
  assert.strictEqual(livePeers.length, 1, "Exactly 1 genuine peer discovered");
  assert.strictEqual(livePeers[0].aliasName, "Ahmad Fauzi (Tenda B)");
  assert.strictEqual(livePeers[0].role, "RELAWAN_LAPANGAN");
  assert.strictEqual(livePeers[0].rssi, -65);
  assert.strictEqual(livePeers[0].hops, 1);
  console.log("  [PASS] Zero Dummy peer populated reactively into Zustand store");

  // Test 2: Inbound PTT Audio and Intercom messaging into usePoskoStore
  console.log("Test 2: Inbound Tactical Intercom text & PTT audio updates usePoskoStore");
  const intercom1 = new TacticalIntercomService(engine1);
  const intercom2 = new TacticalIntercomService(engine2);

  intercom1.onMessageReceived((msg) => {
    usePoskoStore.getState().addIncomingMessage(msg);
  });

  // Peer 2 sends urgent message on MEDIS channel
  await intercom2.sendTextMessage("MEDIS", "Pasien butuh infus Ringer Laktat segera di Tenda B", true);
  await new Promise((r) => setTimeout(r, 30));

  let messagesInStore = usePoskoStore.getState().messages;
  assert.strictEqual(messagesInStore.length, 1, "Received 1 tactical message in store");
  assert.strictEqual(messagesInStore[0].channel, "MEDIS");
  assert.strictEqual(messagesInStore[0].senderName, "Ahmad Fauzi (Tenda B)");
  assert.strictEqual(messagesInStore[0].isUrgent, true);
  console.log("  [PASS] Inbound text message verified in Zustand store");

  // Peer 2 sends PTT voice note with waveform
  const mockPcm = Buffer.alloc(200, 150); // 200B PCM
  await intercom2.sendVoiceNote("MEDIS", 3500, mockPcm);
  await new Promise((r) => setTimeout(r, 40));

  messagesInStore = usePoskoStore.getState().messages;
  assert.strictEqual(messagesInStore.length, 2, "Received voice note message in store");
  const voiceMsg = messagesInStore[1];
  assert.strictEqual(voiceMsg.contentType, "VOICE_NOTE");
  assert.strictEqual(voiceMsg.audioDurationMs, 3500);
  assert.ok(voiceMsg.audioWaveform && voiceMsg.audioWaveform.length === 10, "10-bar waveform preserved");
  console.log("  [PASS] Inbound 10-bar PTT audio note reassembled and stored");

  // Test 3: Radio Fallback transitions (WebBleTransport & UNAVAILABLE / RADIO_OFF)
  console.log("Test 3: Radio Fallback state handling");
  const webTransport = new WebBleTransport("test-node-12345");
  assert.strictEqual(webTransport.getRadioState(), "IDLE");

  // Turn radio OFF
  webTransport.setRadioState("OFF");
  assert.strictEqual(webTransport.getRadioState(), "OFF");

  const sendResult = await webTransport.broadcastPacket(Buffer.from("test"));
  assert.strictEqual(sendResult, false, "Packet broadcast rejected when radio is OFF");

  // Start scanning when OFF does not change state
  await webTransport.startScanning();
  assert.strictEqual(webTransport.getRadioState(), "OFF", "Radio remains OFF");

  // Set to UNAVAILABLE
  webTransport.setRadioState("UNAVAILABLE");
  assert.strictEqual(webTransport.getRadioState(), "UNAVAILABLE");
  console.log("  [PASS] Radio fallback state correctly transitions and blocks transmissions");

  // Cleanup
  await engine1.stop();
  await engine2.stop();

  console.log("\nALL TICKET 05 UI INTEGRATION & RADIO FALLBACK TESTS PASSED SUCCESSFULLY!\n");
}

runTicket05UiIntegrationTests().catch((err) => {
  console.error("\nFAILED TICKET 05 TEST:", err);
  process.exit(1);
});
