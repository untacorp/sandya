import {
  BleTransport,
  BleRadioState,
  BLE_TRANSPORT_CONSTANTS,
  PacketReceivedListener,
} from "./ble-transport";

export class WebBleTransport implements BleTransport {
  private radioState: BleRadioState = "IDLE";
  private listeners = new Set<PacketReceivedListener>();
  private simulatedBroadcastHandler?: (data: Uint8Array) => void;

  constructor(public readonly nodeId: string) {
    if (typeof window === "undefined") {
      this.radioState = "IDLE";
      return;
    }

    // Check navigator.bluetooth presence
    const nav = window.navigator as { bluetooth?: { getAvailability?: () => Promise<boolean> } };
    if (!nav?.bluetooth) {
      this.radioState = "UNAVAILABLE";
    }
  }

  public async startScanning(): Promise<void> {
    if (this.radioState === "UNAVAILABLE" || this.radioState === "OFF") {
      return;
    }
    this.radioState = "SCANNING";
  }

  public async stopScanning(): Promise<void> {
    if (this.radioState === "UNAVAILABLE" || this.radioState === "OFF") {
      return;
    }
    this.radioState = "IDLE";
  }

  public setRadioState(state: BleRadioState): void {
    this.radioState = state;
  }

  public setSimulatedBroadcastHandler(handler: (data: Uint8Array) => void): void {
    this.simulatedBroadcastHandler = handler;
  }

  public async broadcastPacket(packetBuffer: Uint8Array | Buffer): Promise<boolean> {
    if (this.radioState === "UNAVAILABLE" || this.radioState === "OFF") {
      return false;
    }

    if (packetBuffer.length > BLE_TRANSPORT_CONSTANTS.MAX_MTU_BYTES) {
      throw new Error(`[WebBleTransport] Packet exceeds MTU ${BLE_TRANSPORT_CONSTANTS.MAX_MTU_BYTES}B`);
    }

    const payloadCopy = new Uint8Array(packetBuffer);
    if (this.simulatedBroadcastHandler) {
      this.simulatedBroadcastHandler(payloadCopy);
    }
    return true;
  }

  public onPacketReceived(callback: PacketReceivedListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public injectInboundPacket(data: Uint8Array, rssi: number, senderPeerId?: string): void {
    if (this.radioState === "OFF" || this.radioState === "UNAVAILABLE") {
      return;
    }

    for (const listener of this.listeners) {
      try {
        listener(data, rssi, senderPeerId);
      } catch (err) {
        console.error("[WebBleTransport] Listener error:", err);
      }
    }
  }

  public getRadioState(): BleRadioState {
    return this.radioState;
  }
}
