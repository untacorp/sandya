export interface PttAudioPacket {
  channel: 'POSKO_ALL' | 'MEDIS' | 'LOGISTIK' | 'SOS';
  durationMs: number;
  waveform: number[]; // 10-20 sample level integer (0..100)
  audioBytes: Buffer;
  chunkIndex: number;
  totalChunks: number;
}

export class PttVoiceCodec {
  public static readonly MAX_DURATION_MS = 5000; // 5 Detik
  public static readonly MAX_BLE_FRAME_SIZE = 380; // Fit in 469B MTU with SMP headers

  /**
   * Menghasilkan visualisasi 10-bar waveform untuk UI chat
   */
  public static generateWaveformPreview(audioBytes: Buffer, barsCount: number = 10): number[] {
    const bars: number[] = [];
    const step = Math.max(1, Math.floor(audioBytes.length / barsCount));

    for (let i = 0; i < barsCount; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i * step; j < Math.min((i + 1) * step, audioBytes.length); j++) {
        sum += Math.abs((audioBytes[j]! || 0) - 128);
        count++;
      }
      const avg = count > 0 ? Math.round((sum / count) * 2) : 20;
      bars.push(Math.min(100, Math.max(15, avg)));
    }

    return bars;
  }

  /**
   * Memecah rekaman suara PTT menjadi frame-frame BLE SMP v1
   */
  public static splitPttToBleFrames(
    channel: 'POSKO_ALL' | 'MEDIS' | 'LOGISTIK' | 'SOS',
    durationMs: number,
    audioBytes: Buffer
  ): PttAudioPacket[] {
    const totalChunks = Math.max(1, Math.ceil(audioBytes.length / PttVoiceCodec.MAX_BLE_FRAME_SIZE));
    const waveform = PttVoiceCodec.generateWaveformPreview(audioBytes, 10);
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
