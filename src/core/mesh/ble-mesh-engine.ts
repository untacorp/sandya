import { BleTransport } from "./transport/ble-transport";
import { SmpPacketCodec, SmpPacketType, SmpPacket } from "./smp-packet";
import { LruSeenCache } from "./seen-cache";
import { Ed25519Signer, KeyPairResult } from "@/core/crypto/ed25519-signer";
import { MeshPeer, UserRole } from "@/shared/types";

export interface BleMeshEngineConfig {
  peerId: string; // 16 hex chars
  aliasName: string;
  role: UserRole;
  poskoId?: string;
  keypair: KeyPairResult;
  announceIntervalMs?: number;
  peerTtlMs?: number;
}

export interface AnnouncePayload {
  aliasName: string;
  role: UserRole;
  poskoId?: string;
  signingPubkey: string;
}

export type PeerUpdatedListener = (peers: MeshPeer[]) => void;
export type InboundPacketListener = (packet: SmpPacket, rssi: number) => void;

export class BleMeshEngine {
  private peers = new Map<string, MeshPeer>();
  private seenCache = new LruSeenCache(1024);
  private sequence = 1;
  private announceTimer: NodeJS.Timeout | null = null;
  private pruneTimer: NodeJS.Timeout | null = null;
  private unsubscribeTransport: (() => void) | null = null;
  private peerListeners = new Set<PeerUpdatedListener>();
  private packetListeners = new Set<InboundPacketListener>();

  constructor(
    public readonly config: BleMeshEngineConfig,
    public readonly transport: BleTransport
  ) {}

  public async start(): Promise<void> {
    await this.transport.startScanning();

    this.unsubscribeTransport = this.transport.onPacketReceived(
      (rawBytes, rssi) => {
        this.handleInboundRawPacket(rawBytes, rssi);
      }
    );

    const interval = this.config.announceIntervalMs ?? 15000;
    this.announceTimer = setInterval(() => {
      this.broadcastAnnounce().catch((err) => {
        console.error(`[BleMeshEngine ${this.config.peerId}] Announce error:`, err);
      });
    }, interval);

    const peerTtl = this.config.peerTtlMs ?? 60000;
    this.pruneTimer = setInterval(() => {
      this.pruneStalePeers(peerTtl);
    }, interval * 2);
  }

  public async stop(): Promise<void> {
    if (this.announceTimer) {
      clearInterval(this.announceTimer);
      this.announceTimer = null;
    }
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    if (this.unsubscribeTransport) {
      this.unsubscribeTransport();
      this.unsubscribeTransport = null;
    }
    await this.transport.stopScanning();
  }

  public getPeers(): MeshPeer[] {
    return Array.from(this.peers.values());
  }

  public onPeersUpdated(callback: PeerUpdatedListener): () => void {
    this.peerListeners.add(callback);
    return () => {
      this.peerListeners.delete(callback);
    };
  }

  public onPacket(callback: InboundPacketListener): () => void {
    this.packetListeners.add(callback);
    return () => {
      this.packetListeners.delete(callback);
    };
  }

  public async broadcastAnnounce(): Promise<boolean> {
    const payloadObj: AnnouncePayload = {
      aliasName: this.config.aliasName,
      role: this.config.role,
      poskoId: this.config.poskoId,
      signingPubkey: this.config.keypair.publicKeyHex,
    };

    const payloadBuf = Buffer.from(JSON.stringify(payloadObj), "utf8");
    return this.sendPacket(SmpPacketType.MESH_ANNOUNCE, payloadBuf);
  }

  public async sendPacket(
    packetType: SmpPacketType,
    payload: Buffer,
    recipientPeerId: string = SmpPacketCodec.BROADCAST_PEER_ID,
    ttl: number = 7
  ): Promise<boolean> {
    const seq = this.nextSequence();
    const packet: SmpPacket = {
      version: SmpPacketCodec.CURRENT_VERSION,
      packetType,
      ttl,
      flags: 0x01,
      timestamp: Math.floor(Date.now() / 1000),
      senderPeerId: this.config.peerId,
      recipientPeerId,
      sequence: seq,
      payload,
    };

    const rawBuffer = SmpPacketCodec.encode(packet, this.config.keypair.privateKeyHex);

    // Record in seen cache so we never process our own packet if echoed
    const packetHash = LruSeenCache.computePacketHash(
      this.config.peerId,
      seq,
      packetType
    );
    this.seenCache.isDuplicate(packetHash);

    return this.transport.broadcastPacket(rawBuffer);
  }

  private handleInboundRawPacket(rawBytes: Uint8Array, rssi: number): void {
    const buffer = Buffer.from(rawBytes);

    // Initial decode without public key verification (to read header)
    const initialDecode = SmpPacketCodec.decode(buffer);
    if (!initialDecode.ok) {
      return;
    }

    const packet = initialDecode.value;

    // Self exclusion
    if (packet.senderPeerId === this.config.peerId) {
      return;
    }

    // Anti-broadcast storm: O(1) duplicate drop
    const packetHash = LruSeenCache.computePacketHash(
      packet.senderPeerId,
      packet.sequence,
      packet.packetType
    );

    if (this.seenCache.isDuplicate(packetHash)) {
      return;
    }

    // Handle MESH_ANNOUNCE
    if (packet.packetType === SmpPacketType.MESH_ANNOUNCE) {
      this.handleAnnouncePacket(packet, buffer, rssi);
      return;
    }

    // For other packet types, notify listeners
    for (const listener of this.packetListeners) {
      try {
        listener(packet, rssi);
      } catch (err) {
        console.error(`[BleMeshEngine ${this.config.peerId}] Listener error:`, err);
      }
    }
  }

  private handleAnnouncePacket(packet: SmpPacket, rawBuffer: Buffer, rssi: number): void {
    try {
      const parsed = JSON.parse(packet.payload.toString("utf8")) as AnnouncePayload;
      if (!parsed.signingPubkey) {
        return;
      }

      // Cryptographic verification against claimed signingPubkey
      const verifiedDecode = SmpPacketCodec.decode(rawBuffer, parsed.signingPubkey);
      if (!verifiedDecode.ok) {
        return; // Signature forged or mismatch!
      }

      const calculatedHops = Math.max(1, 8 - packet.ttl);
      const existing = this.peers.get(packet.senderPeerId);

      const updatedPeer: MeshPeer = {
        peerId: packet.senderPeerId,
        noisePubkey: `noise_${packet.senderPeerId}`,
        signingPubkey: parsed.signingPubkey,
        aliasName: parsed.aliasName,
        role: parsed.role,
        currentPosId: parsed.poskoId,
        rssi,
        hops: calculatedHops,
        lastSeen: Date.now(),
      };

      this.peers.set(packet.senderPeerId, updatedPeer);

      if (!existing || existing.lastSeen + 5000 < updatedPeer.lastSeen) {
        this.notifyPeersChanged();
      }
    } catch {
      // Malformed json payload ignored
    }
  }

  private pruneStalePeers(ttlMs: number): void {
    const now = Date.now();
    let hasChanges = false;

    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > ttlMs) {
        this.peers.delete(id);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.notifyPeersChanged();
    }
  }

  private notifyPeersChanged(): void {
    const peerList = this.getPeers();
    for (const listener of this.peerListeners) {
      try {
        listener(peerList);
      } catch (err) {
        console.error(`[BleMeshEngine ${this.config.peerId}] Peer update error:`, err);
      }
    }
  }

  private nextSequence(): number {
    const seq = this.sequence;
    this.sequence = (this.sequence + 1) % 65535;
    return seq;
  }
}
