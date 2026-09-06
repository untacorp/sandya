export type PttVoiceChannel = 'POSKO_ALL' | 'MEDIS' | 'LOGISTIK' | 'SOS';

export interface PttAudioPacket {
  channel: PttVoiceChannel;
  durationMs: number;
  waveform: number[]; // 10-20 sample level integer (0..100)
  audioBytes: Buffer;
  chunkIndex: number;
  totalChunks: number;
}

export type PttVoiceFrame = PttAudioPacket;

const CHANNEL_TO_CODE: Record<PttVoiceChannel, number> = {
  POSKO_ALL: 0,
  MEDIS: 1,
  LOGISTIK: 2,
  SOS: 3,
};

const CODE_TO_CHANNEL: Record<number, PttVoiceChannel> = {
  0: 'POSKO_ALL',
  1: 'MEDIS',
  2: 'LOGISTIK',
  3: 'SOS',
};

export class PttVoiceCodec {
  public static readonly MAX_DURATION_MS = 5000; // 5 Detik
  public static readonly MAX_BLE_FRAME_SIZE = 380; // Fit in 469B MTU with SMP headers
  public static readonly DEFAULT_BARS_COUNT = 10;
  public static readonly PCM8_CENTER_VALUE = 128; // Midpoint for 8-bit unsigned PCM audio
  public static readonly WAVEFORM_AMPLITUDE_MULTIPLIER = 2;
  public static readonly DEFAULT_WAVEFORM_BAR_LEVEL = 20;
  public static readonly MIN_WAVEFORM_BAR_LEVEL = 15;
  public static readonly MAX_WAVEFORM_BAR_LEVEL = 100;

  /**
   * Menghasilkan visualisasi 10-bar waveform untuk UI chat
   */
  public static generateWaveformPreview(
    audioBytes: Buffer,
    barsCount: number = PttVoiceCodec.DEFAULT_BARS_COUNT
  ): number[] {
    const bars: number[] = [];
    const step = Math.max(1, Math.floor(audioBytes.length / barsCount));

    for (let i = 0; i < barsCount; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i * step; j < Math.min((i + 1) * step, audioBytes.length); j++) {
        sum += Math.abs((audioBytes[j]! || 0) - PttVoiceCodec.PCM8_CENTER_VALUE);
        count++;
      }
      const avg = count > 0
        ? Math.round((sum / count) * PttVoiceCodec.WAVEFORM_AMPLITUDE_MULTIPLIER)
        : PttVoiceCodec.DEFAULT_WAVEFORM_BAR_LEVEL;
      bars.push(
        Math.min(
          PttVoiceCodec.MAX_WAVEFORM_BAR_LEVEL,
          Math.max(PttVoiceCodec.MIN_WAVEFORM_BAR_LEVEL, avg)
        )
      );
    }

    return bars;
  }

  /**
   * Mengemas PttAudioPacket menjadi buffer biner payload
   */
  public static encodeFrame(packet: PttAudioPacket): Buffer {
    const waveformLen = packet.waveform.length;
    const headerLen = 5 + waveformLen; // 1B channel + 2B dur + 1B chunk + 1B total + NB waveform
    const headerBuf = Buffer.alloc(headerLen);

    headerBuf.writeUInt8(CHANNEL_TO_CODE[packet.channel] ?? 0, 0);
    headerBuf.writeUInt16BE(Math.min(packet.durationMs, PttVoiceCodec.MAX_DURATION_MS), 1);
    headerBuf.writeUInt8(packet.chunkIndex, 3);
    headerBuf.writeUInt8(packet.totalChunks, 4);

    for (let i = 0; i < waveformLen; i++) {
      headerBuf.writeUInt8(packet.waveform[i] || 0, 5 + i);
    }

    return Buffer.concat([headerBuf, packet.audioBytes]);
  }

  /**
   * Mendekode buffer payload menjadi PttAudioPacket
   */
  public static decodeFrame(buffer: Buffer): PttAudioPacket | null {
    if (buffer.length < 5) return null;

    const channelCode = buffer.readUInt8(0);
    const channel = CODE_TO_CHANNEL[channelCode] || 'POSKO_ALL';
    const durationMs = buffer.readUInt16BE(1);
    const chunkIndex = buffer.readUInt8(3);
    const totalChunks = buffer.readUInt8(4);

    const waveformLen = Math.min(PttVoiceCodec.DEFAULT_BARS_COUNT, Math.max(0, buffer.length - 5));
    const waveform: number[] = [];
    for (let i = 0; i < waveformLen; i++) {
      waveform.push(buffer.readUInt8(5 + i));
    }

    const audioBytes = buffer.subarray(5 + waveformLen);

    return {
      channel,
      durationMs,
      chunkIndex,
      totalChunks,
      waveform,
      audioBytes,
    };
  }

  public static parseFrame(buffer: Buffer): PttAudioPacket | null {
    return PttVoiceCodec.decodeFrame(buffer);
  }

  /**
   * Memecah rekaman suara PTT menjadi frame-frame BLE SMP v1
   */
  public static splitPttToBleFrames(
    channel: PttVoiceChannel,
    durationMs: number,
    audioBytes: Buffer
  ): PttAudioPacket[] {
    const totalChunks = Math.max(1, Math.ceil(audioBytes.length / PttVoiceCodec.MAX_BLE_FRAME_SIZE));
    const waveform = PttVoiceCodec.generateWaveformPreview(audioBytes, PttVoiceCodec.DEFAULT_BARS_COUNT);
    const packets: PttAudioPacket[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * PttVoiceCodec.MAX_BLE_FRAME_SIZE;
      const end = Math.min(start + PttVoiceCodec.MAX_BLE_FRAME_SIZE, audioBytes.length);
      const chunkBytes = audioBytes.subarray(start, end);

      packets.push({
        channel,
        durationMs,
        waveform,
        audioBytes: chunkBytes,
        chunkIndex: i,
        totalChunks,
      });
    }

    return packets;
  }
}
