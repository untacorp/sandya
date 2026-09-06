import { BleMeshEngine } from "./ble-mesh-engine";
import { SmpPacketType, SmpPacket } from "./smp-packet";
import { VectorClockTracker, DeltaSyncRequest } from "./vector-clock";

export interface GossipEventRecord {
  eventId: string;
  poskoId: string;
  logicalSeq: number;
  topic: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface VectorProbePayload {
  senderPeerId: string;
  clocks: Record<string, number>;
}

export interface DeltaBatchPayload {
  poskoId: string;
  events: GossipEventRecord[];
}

export type EventsAppliedListener = (events: GossipEventRecord[]) => void;

export class VectorClockGossipService {
  private clockTracker: VectorClockTracker;
  private localEvents = new Map<string, GossipEventRecord>(); // key: `${poskoId}:${seq}`
  private appliedListeners = new Set<EventsAppliedListener>();

  constructor(
    private readonly engine: BleMeshEngine,
    public readonly localPoskoId: string,
    initialClocks?: Record<string, number>
  ) {
    this.clockTracker = new VectorClockTracker(initialClocks);

    this.engine.onPacket((packet, rssi) => {
      this.handleInboundPacket(packet, rssi);
    });
  }

  public onEventsApplied(listener: EventsAppliedListener): () => void {
    this.appliedListeners.add(listener);
    return () => {
      this.appliedListeners.delete(listener);
    };
  }

  public appendLocalEvent(event: GossipEventRecord): void {
    const key = `${event.poskoId}:${event.logicalSeq}`;
    this.localEvents.set(key, event);
    this.clockTracker.updateClock(event.poskoId, event.logicalSeq);
  }

  public getClockSnapshot(): Record<string, number> {
    return this.clockTracker.exportClockSnapshot();
  }

  public getAllEvents(): GossipEventRecord[] {
    return Array.from(this.localEvents.values());
  }

  /**
   * Broadcast current Vector Clock state to ask neighbors for missing events
   */
  public async broadcastVectorProbe(): Promise<boolean> {
    const probe: VectorProbePayload = {
      senderPeerId: this.engine.config.peerId,
      clocks: this.getClockSnapshot(),
    };

    const payload = Buffer.from(JSON.stringify(probe), "utf8");
    return this.engine.sendPacket(SmpPacketType.SYNC_VECTOR_PROBE, payload);
  }

  private handleInboundPacket(packet: SmpPacket, rssi: number): void {
    if (packet.packetType === SmpPacketType.SYNC_VECTOR_PROBE) {
      this.handleVectorProbe(packet);
      return;
    }

    if (packet.packetType === SmpPacketType.SYNC_DELTA_BATCH) {
      this.handleDeltaBatch(packet);
      return;
    }
  }

  /**
   * When receiving a vector probe from neighbor:
   * 1. Detect if we have events they are missing -> send them SYNC_DELTA_BATCH
   * 2. Detect if they have events we are missing -> our future probe or direct request
   */
  private handleVectorProbe(packet: SmpPacket): void {
    try {
      const probe = JSON.parse(packet.payload.toString("utf8")) as VectorProbePayload;
      const remoteClocks = probe.clocks || {};

      // 1. Check if we have events that the remote peer is missing
      const ourClocks = this.getClockSnapshot();
      let weAreBehind = false;

      // Check all poskos we know about
      for (const [poskoId, ourMaxSeq] of Object.entries(ourClocks)) {
        const remoteSeq = remoteClocks[poskoId] || 0;
        if (ourMaxSeq > remoteSeq) {
          const deltasToSend: GossipEventRecord[] = [];
          for (let s = remoteSeq + 1; s <= ourMaxSeq; s++) {
            const ev = this.localEvents.get(`${poskoId}:${s}`);
            if (ev) {
              deltasToSend.push(ev);
            }
          }

          if (deltasToSend.length > 0) {
            this.sendDeltaBatch(poskoId, deltasToSend, packet.senderPeerId).catch((err) => {
              console.error("[VectorClockGossipService] Delta batch send error:", err);
            });
          }
        } else if (remoteSeq > ourMaxSeq) {
          weAreBehind = true;
        }
      }

      // Also check if remote has poskos we don't know about at all
      for (const [poskoId, remoteSeq] of Object.entries(remoteClocks)) {
        const ourMaxSeq = ourClocks[poskoId] || 0;
        if (remoteSeq > ourMaxSeq) {
          weAreBehind = true;
        }
      }

      // 2. If remote peer has newer events that we need, reply with our vector probe
      if (weAreBehind) {
        this.broadcastVectorProbe().catch((err) => {
          console.error("[VectorClockGossipService] Probe reply error:", err);
        });
      }
    } catch {
      // Ignored malformed probe
    }
  }

  /**
   * When receiving a delta batch from neighbor:
   * Validate, ingest into local event log, update vector clock, and notify listeners
   */
  private handleDeltaBatch(packet: SmpPacket): void {
    try {
      const batch = JSON.parse(packet.payload.toString("utf8")) as DeltaBatchPayload;
      if (!batch.events || !Array.isArray(batch.events)) {
        return;
      }

      const newlyApplied: GossipEventRecord[] = [];

      for (const event of batch.events) {
        const key = `${event.poskoId}:${event.logicalSeq}`;
        if (!this.localEvents.has(key)) {
          this.localEvents.set(key, event);
          this.clockTracker.updateClock(event.poskoId, event.logicalSeq);
          newlyApplied.push(event);
        }
      }

      if (newlyApplied.length > 0) {
        for (const listener of this.appliedListeners) {
          try {
            listener(newlyApplied);
          } catch (err) {
            console.error("[VectorClockGossipService] Listener error:", err);
          }
        }
      }
    } catch {
      // Ignored malformed batch
    }
  }

  private async sendDeltaBatch(
    poskoId: string,
    events: GossipEventRecord[],
    recipientPeerId: string
  ): Promise<boolean> {
    const batch: DeltaBatchPayload = {
      poskoId,
      events,
    };

    const payload = Buffer.from(JSON.stringify(batch), "utf8");
    return this.engine.sendPacket(
      SmpPacketType.SYNC_DELTA_BATCH,
      payload,
      recipientPeerId
    );
  }
}
