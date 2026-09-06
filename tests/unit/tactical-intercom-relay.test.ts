import assert from "node:assert";
import { BleMeshEngine, BleMeshEngineConfig } from "@/core/mesh/ble-mesh-engine";
import { SimulatedMeshBridge } from "@/core/mesh/transport/simulated-mesh-bridge";
import { Ed25519Signer } from "@/core/crypto/ed25519-signer";
import { TacticalIntercomService } from "@/core/mesh/tactical-intercom-service";
import { PttVoiceCodec } from "@/core/audio/ptt-codec";
import { TacticalMessage } from "@/shared/types";

async function runTacticalIntercomRelayTests() {
  console.log("RUNNING TICKET 03: TACTICAL INTERCOM CHAT & PTT AUDIO RELAY TESTS...\n");

  const bridge = new SimulatedMeshBridge({ latencyMs: 5, defaultRssi: -60 });
  const keypairMed = Ed25519Signer.generateKeyPair();
  const keypairLog = Ed25519Signer.generateKeyPair();
  const keypairRel = Ed25519Signer.generateKeyPair();

  const configMed: BleMeshEngineConfig = {
    peerId: "1111111111111111",
    aliasName: "dr. Hasan Medis",
    role: "PETUGAS_MEDIS",
    poskoId: "POS-01",
    keypair: keypairMed,
  };

  const configLog: BleMeshEngineConfig = {
    peerId: "2222222222222222",
    aliasName: "Pak Wahyu Logistik",
    role: "PETUGAS_LOGISTIK",
    poskoId: "POS-01",
    keypair: keypairLog,
  };

  const configGuest: BleMeshEngineConfig = {
    peerId: "3333333333333333",
    aliasName: "Warga Tamu",
    role: "WARGA_TAMU",
    poskoId: "POS-01",
    keypair: keypairRel,
  };

  const engineMed = new BleMeshEngine(configMed, bridge.createNode(configMed.peerId));
  const engineLog = new BleMeshEngine(configLog, bridge.createNode(configLog.peerId));
  const engineGuest = new BleMeshEngine(configGuest, bridge.createNode(configGuest.peerId));

  await engineMed.start();
  await engineLog.start();
  await engineGuest.start();

  const serviceMed = new TacticalIntercomService(engineMed);
  const serviceLog = new TacticalIntercomService(engineLog);
  const serviceGuest = new TacticalIntercomService(engineGuest);

  // Test 1: Send Text Message on #MEDIS channel
  console.log("Test 1: Broadcast tactical text message on specific channel");
  const receivedMessagesAtLog: TacticalMessage[] = [];
  serviceLog.onMessageReceived((msg) => {
    receivedMessagesAtLog.push(msg);
  });

  const textSent = await serviceMed.sendTextMessage(
    "MEDIS",
    "Permintaan 20 ampul Epinefrin ke Posko 01 segera.",
    false
  );
  assert.strictEqual(textSent, true, "Text broadcast must succeed");

  await new Promise((r) => setTimeout(r, 40));

  assert.strictEqual(receivedMessagesAtLog.length, 1, "Logistics must receive 1 message");
  assert.strictEqual(receivedMessagesAtLog[0].channel, "MEDIS");
  assert.strictEqual(receivedMessagesAtLog[0].senderName, "dr. Hasan Medis");
  assert.strictEqual(receivedMessagesAtLog[0].senderRole, "PETUGAS_MEDIS");
  assert.strictEqual(receivedMessagesAtLog[0].textContent, "Permintaan 20 ampul Epinefrin ke Posko 01 segera.");
  console.log("  [PASS] Tactical text message verified with authentic attribution");

  // Test 2: High-priority SOS Siren Broadcast
  console.log("Test 2: High-priority SOS hazard siren broadcast");
  const sosSent = await serviceMed.triggerSOS("Gempa Susulan M 5.2 Terdeteksi");
  assert.strictEqual(sosSent, true, "SOS alert broadcast must succeed");

  await new Promise((r) => setTimeout(r, 40));

  assert.strictEqual(receivedMessagesAtLog.length, 2, "Logistics must receive SOS message");
  const sosMsg = receivedMessagesAtLog[1];
  assert.strictEqual(sosMsg.channel, "SOS");
  assert.strictEqual(sosMsg.contentType, "ALERT");
  assert.strictEqual(sosMsg.isUrgent, true);
  assert.ok(sosMsg.textContent?.includes("Gempa Susulan"));
  console.log("  [PASS] High-priority SOS alert broadcast verified");

  // Test 3: PTT Micro-Audio 5s Recording & Reassembly
  console.log("Test 3: PTT Audio Frame Splitting, Multi-Frame Relay & Reassembly");
  const receivedVoiceNotesAtMed: TacticalMessage[] = [];
  serviceMed.onMessageReceived((msg) => {
    if (msg.contentType === "VOICE_NOTE") {
      receivedVoiceNotesAtMed.push(msg);
    }
  });

  // Generate 800 bytes of dummy PCM-8 audio (> 380B, requires 3 BLE frames)
  const simulatedAudio = Buffer.alloc(800, 140);
  const voiceSent = await serviceLog.sendVoiceNote("POSKO_ALL", 4200, simulatedAudio);
  assert.strictEqual(voiceSent, true, "Voice broadcast must succeed");

  await new Promise((r) => setTimeout(r, 80));

  assert.strictEqual(receivedVoiceNotesAtMed.length, 1, "Doctor must receive reassembled voice note");
  const voiceMsg = receivedVoiceNotesAtMed[0];
  assert.strictEqual(voiceMsg.channel, "POSKO_ALL");
  assert.strictEqual(voiceMsg.senderRole, "PETUGAS_LOGISTIK");
  assert.strictEqual(voiceMsg.audioDurationMs, 4200);
  assert.ok(voiceMsg.audioWaveform && voiceMsg.audioWaveform.length === 10, "Must have 10-bar waveform");
  console.log("  [PASS] PTT Voice audio splitting and reassembly verified");

  // Test 4: Role Isolation Guard (Guest muted)
  console.log("Test 4: RBAC Guard - Public Guest muted from tactical broadcast");
  let guestBlocked = false;
  try {
    await serviceGuest.sendTextMessage("POSKO_ALL", "Halo saya warga mau chat.", false);
  } catch (err: any) {
    if (err.message.includes("GUEST_MUTED")) {
      guestBlocked = true;
    }
  }
  assert.strictEqual(guestBlocked, true, "PUBLIC_GUEST must be blocked with GUEST_MUTED");
  console.log("  [PASS] Role isolation guard verified");

  // Cleanup
  await engineMed.stop();
  await engineLog.stop();
  await engineGuest.stop();

  console.log("\nALL TICKET 03 TACTICAL INTERCOM TESTS PASSED SUCCESSFULLY!\n");
}

runTacticalIntercomRelayTests().catch((err) => {
  console.error("\nFAILED TICKET 03 TEST:", err);
  process.exit(1);
});
