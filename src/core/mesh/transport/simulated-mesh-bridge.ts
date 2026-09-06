import {
  BleTransport,
  BleRadioState,
  BLE_TRANSPORT_CONSTANTS,
  PacketReceivedListener,
} from "./ble-transport";

export interface SimulatedBridgeOptions {
  latencyMs?: number;
  defaultRssi?: number;
}

export class SimulatedMeshNode implements BleTransport {
  private radioState: BleRadioState = "IDLE";
  private listeners: Set<PacketReceivedListener> = new Set();

  constructor(
    public readonly nodeId: string,
    private readonly bridge: SimulatedMeshBridge
  ) {}

  public async startScanning(): Promise<void> {
    this.radioState = "SCANNING";
  }

  public async stopScanning(): Promise<void> {
    this.radioState = "IDLE";
  }

  public async broadcastPacket(packetBuffer: Uint8Array | Buffer): Promise<boolean> {
    if (packetBuffer.length > BLE_TRANSPORT_CONSTANTS.MAX_MTU_BYTES) {
      throw new Error(
        `[BLE] Paket melebihi batas MTU ${BLE_TRANSPORT_CONSTANTS.MAX_MTU_BYTES}B (aktual: ${packetBuffer.length}B)`
      );
    }

    return this.bridge.relayBroadcast(this.nodeId, packetBuffer);
  }

  public onPacketReceived(callback: PacketReceivedListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getRadioState(): BleRadioState {
    return this.radioState;
  }

  /**
   * Internal injection point called by SimulatedMeshBridge
   */
  public receiveInbound(data: Uint8Array, rssi: number, senderNodeId: string): void {
    if (this.radioState === "IDLE" || this.radioState === "OFF" || this.radioState === "UNAVAILABLE") {
      return;
    }

    for (const listener of this.listeners) {
      try {
        listener(data, rssi, senderNodeId);
      } catch (err) {
        console.error(`[SimulatedNode ${this.nodeId}] Listener error:`, err);
      }
    }
  }
}

export class SimulatedMeshBridge {
  private nodes = new Map<string, SimulatedMeshNode>();
  private latencyMs: number;
  private defaultRssi: number;

  constructor(options?: SimulatedBridgeOptions) {
    this.latencyMs = options?.latencyMs ?? 10;
    this.defaultRssi = options?.defaultRssi ?? BLE_TRANSPORT_CONSTANTS.DEFAULT_RSSI;
  }

  public createNode(nodeId: string): SimulatedMeshNode {
    const node = new SimulatedMeshNode(nodeId, this);
    this.nodes.set(nodeId, node);
    return node;
  }

  public getNode(nodeId: string): SimulatedMeshNode | undefined {
    return this.nodes.get(nodeId);
  }

  public removeNode(nodeId: string): boolean {
    return this.nodes.delete(nodeId);
  }

  public nodeCount(): number {
    return this.nodes.size;
  }

  public clear(): void {
    this.nodes.clear();
  }

  /**
   * Relay broadcast packet to all other registered nodes except sender
   */
  public async relayBroadcast(
    senderNodeId: string,
    data: Uint8Array | Buffer
  ): Promise<boolean> {
    const payloadCopy = new Uint8Array(data);

    setTimeout(() => {
      for (const [id, node] of this.nodes.entries()) {
        if (id === senderNodeId) continue; // Anti-loopback self exclusion
        node.receiveInbound(payloadCopy, this.defaultRssi, senderNodeId);
      }
    }, this.latencyMs);

    return true;
  }
}
