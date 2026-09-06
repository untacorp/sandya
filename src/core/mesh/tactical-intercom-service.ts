import { BleMeshEngine } from "./ble-mesh-engine";
import { SmpPacketType, SmpPacket } from "./smp-packet";
import { PttVoiceCodec, PttAudioPacket } from "@/core/audio/ptt-codec";
import { TacticalMessage, TacticalChannel, UserRole } from "@/shared/types";

export type MessageReceivedListener = (message: TacticalMessage) => void;

interface InboundVoiceFramePayload {
  mId?: string;
  messageId?: string;
  ch?: TacticalChannel;
  channel?: TacticalChannel;
  dur?: number;
  durationMs?: number;
  wf?: number[];
  waveform?: number[];
  idx?: number;
  chunkIndex?: number;
  tot?: number;
  totalChunks?: number;
  sName?: string;
  senderName?: string;
  sRole?: UserRole;
  senderRole?: UserRole;
  aud?: string;
  audioBase64?: string;
}

interface PendingVoiceNote {
  messageId: string;
  channel: TacticalChannel;
  senderPeerId: string;
  senderName: string;
  senderRole: UserRole;
  durationMs: number;
  totalChunks: number;
  waveform: number[];
  receivedChunks: Map<number, Uint8Array>;
  createdAt: number;
}

export class TacticalIntercomService {
  private messageListeners = new Set<MessageReceivedListener>();
  private pendingVoiceNotes = new Map<string, PendingVoiceNote>();

  constructor(private readonly engine: BleMeshEngine) {
    this.engine.onPacket((packet, rssi) => {
      this.handleInboundPacket(packet, rssi);
    });
  }

  public onMessageReceived(listener: MessageReceivedListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  /**
   * Broadcast tactical text message across specified channel
   */
  public async sendTextMessage(
    channel: TacticalChannel,
    text: string,
    isUrgent: boolean = false
  ): Promise<boolean> {
    this.assertAuthorizedSender();

    const msg: TacticalMessage = {
      id: `MSG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      channel,
      senderPeerId: this.engine.config.peerId,
      senderName: this.engine.config.aliasName,
      senderRole: this.engine.config.role,
      contentType: "TEXT",
      textContent: text,
      isUrgent,
      createdAt: Date.now(),
    };

    const payload = Buffer.from(JSON.stringify(msg), "utf8");
    return this.engine.sendPacket(SmpPacketType.TACTICAL_BROADCAST, payload);
  }

  /**
   * High-priority SOS emergency evacuation warning
   */
  public async triggerSOS(hazardType: string): Promise<boolean> {
    this.assertAuthorizedSender();

    const msg: TacticalMessage = {
      id: `SOS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      channel: "SOS",
      senderPeerId: this.engine.config.peerId,
      senderName: this.engine.config.aliasName,
      senderRole: this.engine.config.role,
      contentType: "ALERT",
      textContent: `PERINGATAN DARURAT: ${hazardType} terdeteksi di sekitar posko! Evakuasi siaga!`,
      isUrgent: true,
      createdAt: Date.now(),
    };

    const payload = Buffer.from(JSON.stringify(msg), "utf8");
    return this.engine.sendPacket(SmpPacketType.TACTICAL_BROADCAST, payload);
  }

  /**
   * Push-to-Talk Voice Note frame splitting & broadcasting
   */
  public async sendVoiceNote(
    channel: TacticalChannel,
    durationMs: number,
    audioBytes: Buffer
  ): Promise<boolean> {
    this.assertAuthorizedSender();

    const boundedDuration = Math.min(PttVoiceCodec.MAX_DURATION_MS, durationMs);
    const audioChunkSize = 150; // 150B raw -> 200B base64 + 100B metadata = ~300B payload + 92B SMP header/sig = ~392B < 469B MTU
    const totalChunks = Math.max(1, Math.ceil(audioBytes.length / audioChunkSize));
    const waveform = PttVoiceCodec.generateWaveformPreview(audioBytes, PttVoiceCodec.DEFAULT_BARS_COUNT);
    const messageId = `V-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const start = chunkIdx * audioChunkSize;
      const end = Math.min(start + audioChunkSize, audioBytes.length);
      const chunkBytes = audioBytes.subarray(start, end);

      const frameObj = {
        mId: messageId,
        ch: channel,
        dur: boundedDuration,
        wf: chunkIdx === 0 ? waveform : undefined,
        idx: chunkIdx,
        tot: totalChunks,
        sName: this.engine.config.aliasName,
        sRole: this.engine.config.role,
        aud: chunkBytes.toString("base64"),
      };

      const payload = Buffer.from(JSON.stringify(frameObj), "utf8");
      await this.engine.sendPacket(SmpPacketType.VOICE_NOTE_FRAME, payload);
    }

    return true;
  }

  private handleInboundPacket(packet: SmpPacket, rssi: number): void {
    if (packet.packetType === SmpPacketType.TACTICAL_BROADCAST) {
      try {
        const msg = JSON.parse(packet.payload.toString("utf8")) as TacticalMessage;
        this.notifyMessage(msg);
      } catch (err) {
        // Ignored malformed broadcast
      }
      return;
    }

    if (packet.packetType === SmpPacketType.VOICE_NOTE_FRAME) {
      try {
        const frame = JSON.parse(packet.payload.toString("utf8"));
        this.handleVoiceFrame(packet.senderPeerId, frame);
      } catch (err) {
        // Ignored malformed frame
      }
      return;
    }
  }

  private handleVoiceFrame(senderPeerId: string, frame: InboundVoiceFramePayload): void {
    const messageId = frame.mId || frame.messageId;
    const channel = frame.ch || frame.channel || "POSKO_ALL";
    const durationMs = frame.dur || frame.durationMs || 0;
    const waveform = frame.wf || frame.waveform;
    const chunkIndex = frame.idx ?? frame.chunkIndex ?? 0;
    const totalChunks = frame.tot || frame.totalChunks || 1;
    const senderName = frame.sName || frame.senderName || "Relawan";
    const senderRole = frame.sRole || frame.senderRole || "RELAWAN_LAPANGAN";
    const audioBase64 = frame.aud || frame.audioBase64 || "";

    if (!messageId) {
      return;
    }

    let pending = this.pendingVoiceNotes.get(messageId);
    if (!pending) {
      pending = {
        messageId,
        channel,
        senderPeerId,
        senderName,
        senderRole,
        durationMs,
        totalChunks,
        waveform: waveform || [],
        receivedChunks: new Map(),
        createdAt: Date.now(),
      };
      this.pendingVoiceNotes.set(messageId, pending);
    } else if (waveform && (!pending.waveform || pending.waveform.length === 0)) {
      pending.waveform = waveform;
    }

    const chunkBytes = Buffer.from(audioBase64, "base64");
    pending.receivedChunks.set(chunkIndex, chunkBytes);

    // If all chunks received, reassemble and dispatch
    if (pending.receivedChunks.size === pending.totalChunks) {
      this.pendingVoiceNotes.delete(messageId);

      const msg: TacticalMessage = {
        id: pending.messageId,
        channel: pending.channel,
        senderPeerId: pending.senderPeerId,
        senderName: pending.senderName,
        senderRole: pending.senderRole,
        contentType: "VOICE_NOTE",
        audioDurationMs: pending.durationMs,
        audioWaveform: pending.waveform,
        createdAt: pending.createdAt,
      };

      this.notifyMessage(msg);
    }
  }

  private notifyMessage(msg: TacticalMessage): void {
    for (const listener of this.messageListeners) {
      try {
        listener(msg);
      } catch (err) {
        console.error("[TacticalIntercomService] Listener error:", err);
      }
    }
  }

  private assertAuthorizedSender(): void {
    if (this.engine.config.role === "WARGA_TAMU") {
      throw new Error("403 GUEST_MUTED: Tamu publik tidak memiliki hak siaran radio taktis.");
    }
  }
}
