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
  * Memecah rekaman suara PTT menjadi frame-frame BLE SMP v1
  */
  public static splitPttToBleFrames(
  channel: 'POSKO_ALL' | 'MEDIS' | 'LOGISTIK' | 'SOS',
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
