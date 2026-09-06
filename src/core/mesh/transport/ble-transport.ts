export type BleRadioState = 'UNAVAILABLE' | 'OFF' | 'IDLE' | 'SCANNING' | 'CONNECTED';

export const BLE_TRANSPORT_CONSTANTS = {
  MAX_MTU_BYTES: 469,
  DEFAULT_RSSI: -65,
} as const;

export type PacketReceivedListener = (
  rawBytes: Uint8Array,
  rssi: number,
  senderPeerId?: string
) => void;

export interface BleTransport {
  readonly nodeId: string;
  startScanning(): Promise<void>;
  stopScanning(): Promise<void>;
  broadcastPacket(packetBuffer: Uint8Array | Buffer): Promise<boolean>;
  onPacketReceived(callback: PacketReceivedListener): () => void;
  getRadioState(): BleRadioState;
}
