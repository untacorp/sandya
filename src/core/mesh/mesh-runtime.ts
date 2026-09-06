import { BleMeshEngine } from "./ble-mesh-engine";
import { TacticalIntercomService } from "./tactical-intercom-service";
import { VectorClockGossipService } from "./vector-clock-gossip-service";
import { BleTransport, BleRadioState } from "./transport/ble-transport";
import { WebBleTransport } from "./transport/web-ble-transport";
import { SimulatedMeshBridge } from "./transport/simulated-mesh-bridge";
import { Ed25519Signer } from "@/core/crypto/ed25519-signer";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { TacticalMessage, TacticalChannel } from "@/shared/types";

export interface MeshRuntimeOptions {
  transport?: BleTransport;
  simulatedBridge?: SimulatedMeshBridge;
}

class MeshRuntime {
  private static instance: MeshRuntime | null = null;
  private engine: BleMeshEngine | null = null;
  private intercom: TacticalIntercomService | null = null;
  private gossip: VectorClockGossipService | null = null;
  private transport: BleTransport | null = null;
  private isInitialized = false;
  private radioState: BleRadioState = "IDLE";
  private stateListeners = new Set<(state: BleRadioState) => void>();

  public static getInstance(): MeshRuntime {
    if (!MeshRuntime.instance) {
      MeshRuntime.instance = new MeshRuntime();
    }
    return MeshRuntime.instance;
  }

  public async initialize(options?: MeshRuntimeOptions): Promise<void> {
    if (this.isInitialized && this.engine) {
      return;
    }

    const session = usePoskoStore.getState().session;
    const cleanUserId = (session.userId || "usr-anon").replace(/[^a-zA-Z0-9]/g, "");
    const peerId = cleanUserId.padEnd(16, "0").slice(0, 16);

    const keypair = Ed25519Signer.generateKeyPair();

    if (options?.transport) {
      this.transport = options.transport;
    } else if (options?.simulatedBridge) {
      this.transport = options.simulatedBridge.createNode(peerId);
    } else {
      this.transport = new WebBleTransport(peerId);
    }

    this.engine = new BleMeshEngine(
      {
        peerId,
        aliasName: session.userName || "Relawan Sandya",
        role: session.userRole,
        poskoId: session.poskoId,
        keypair,
      },
      this.transport
    );

    this.intercom = new TacticalIntercomService(this.engine);
    this.gossip = new VectorClockGossipService(this.engine, session.poskoId || "POS-01");

    // Connect peers update directly to zustand store
    this.engine.onPeersUpdated((peers) => {
      usePoskoStore.getState().setPeers(peers);
    });

    // Connect incoming messages from intercom to zustand store
    this.intercom.onMessageReceived((msg: TacticalMessage) => {
      usePoskoStore.getState().addIncomingMessage(msg);
    });

    await this.engine.start();
    this.radioState = this.transport.getRadioState();
    this.isInitialized = true;
  }

  public getRadioState(): BleRadioState {
    return this.transport ? this.transport.getRadioState() : this.radioState;
  }

  public setRadioState(state: BleRadioState): void {
    this.radioState = state;
    if (this.transport instanceof WebBleTransport) {
      this.transport.setRadioState(state);
    }
    for (const listener of this.stateListeners) {
      try {
        listener(state);
      } catch (err) {
        console.error("[MeshRuntime] State listener error:", err);
      }
    }
  }

  public onRadioStateChanged(listener: (state: BleRadioState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public async sendTextMessage(channel: TacticalChannel, text: string, isUrgent: boolean = false): Promise<boolean> {
    if (!this.intercom) {
      throw new Error("MeshRuntime not initialized");
    }
    return this.intercom.sendTextMessage(channel, text, isUrgent);
  }

  public async triggerSOS(hazardType: string): Promise<boolean> {
    if (!this.intercom) {
      throw new Error("MeshRuntime not initialized");
    }
    return this.intercom.triggerSOS(hazardType);
  }

  public async sendVoiceNote(channel: TacticalChannel, durationMs: number, audioBytes: Buffer): Promise<boolean> {
    if (!this.intercom) {
      throw new Error("MeshRuntime not initialized");
    }
    return this.intercom.sendVoiceNote(channel, durationMs, audioBytes);
  }

  public async broadcastVectorProbe(): Promise<void> {
    if (this.gossip) {
      await this.gossip.broadcastVectorProbe();
    }
  }

  public async stop(): Promise<void> {
    if (this.engine) {
      await this.engine.stop();
      this.engine = null;
      this.intercom = null;
      this.gossip = null;
      this.transport = null;
      this.isInitialized = false;
      this.radioState = "IDLE";
    }
  }

  public getEngine(): BleMeshEngine | null {
    return this.engine;
  }

  public getIntercom(): TacticalIntercomService | null {
    return this.intercom;
  }

  public getGossip(): VectorClockGossipService | null {
    return this.gossip;
  }
}

export const meshRuntime = MeshRuntime.getInstance();
