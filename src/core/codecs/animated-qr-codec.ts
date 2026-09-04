import { createHash } from 'node:crypto';

export interface AnimatedFrameHeader {
  payloadUuid: number; // 2 Bytes (uint16)
  partIndex: number; // 1 Byte (uint8)
  totalParts: number; // 1 Byte (uint8)
  crc16: number; // 2 Bytes (uint16)
}

export interface AnimatedFrame {
  header: AnimatedFrameHeader;
  rawBuffer: Buffer;
  base64String: string;
}

/**
 * Menghitung CRC16 (CCITT-False) untuk verifikasi integritas frame super-cepat
 */
export function computeCrc16(buffer: Buffer): number {
  let crc = 0xffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= (buffer[i]! & 0xff) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc & 0xffff;
}

/**
 * Memecah buffer payload besar menjadi rangkaian frame QR dinamis
 * @param payload Buffer data terkompresi / Ultra-Dense biner
 * @param maxChunkSize Ukuran data per frame (Default: 1200 Bytes untuk modul tebal QR V24)
 */
export function splitPayloadToAnimatedFrames(
  payload: Buffer,
  maxChunkSize: number = 1200
): AnimatedFrame[] {
  const totalParts = Math.max(1, Math.ceil(payload.length / maxChunkSize));
  if (totalParts > 255) {
    throw new Error(`Payload terlalu besar untuk 1 siklus animated QR (Maksimal 255 parts, dibutuhkan ${totalParts})`);
  }

  const sessionUuid = Math.floor(Math.random() * 65535);
  const frames: AnimatedFrame[] = [];

  for (let partIndex = 0; partIndex < totalParts; partIndex++) {
    const start = partIndex * maxChunkSize;
    const end = Math.min(start + maxChunkSize, payload.length);
    const chunk = payload.subarray(start, end);
    const crc16 = computeCrc16(chunk);

    // Frame Header (6 Bytes):
    // [0..1]: Payload UUID (uint16 BE)
    // [2]   : Part Index   (uint8)
    // [3]   : Total Parts  (uint8)
    // [4..5]: CRC16        (uint16 BE)
    const headerBuf = Buffer.alloc(6);
    headerBuf.writeUInt16BE(sessionUuid, 0);
    headerBuf.writeUInt8(partIndex, 2);
    headerBuf.writeUInt8(totalParts, 3);
    headerBuf.writeUInt16BE(crc16, 4);

    const fullFrameBuf = Buffer.concat([headerBuf, chunk]);

    frames.push({
      header: {
        payloadUuid: sessionUuid,
        partIndex,
        totalParts,
        crc16,
      },
      rawBuffer: fullFrameBuf,
      base64String: fullFrameBuf.toString('base64'),
    });
  }

  return frames;
}

/**
 * Engine Assembler Out-of-Order Asinkron
 * Menangkap frame QR yang berputar secara acak dan langsung berhenti begitu semua slot terisi
 */
export class OutOfOrderFrameAssembler {
  private slots: Array<Buffer | null> = [];
  private totalParts: number = 0;
  private sessionUuid: number | null = null;
  private isCompleted: boolean = false;

  /**
   * Memasukkan frame baru yang ditangkap kamera
   */
  public ingestFrame(frameBuffer: Buffer): {
    completed: boolean;
    progress: number;
    partIndex: number;
    totalParts: number;
    isNewPart: boolean;
  } {
    if (frameBuffer.length < 6) {
      return {
        completed: false,
        progress: this.getProgress(),
        partIndex: -1,
        totalParts: this.totalParts,
        isNewPart: false,
      };
    }

    const uuid = frameBuffer.readUInt16BE(0);
    const partIdx = frameBuffer.readUInt8(2);
    const total = frameBuffer.readUInt8(3);
    const crc = frameBuffer.readUInt16BE(4);
    const chunkData = frameBuffer.subarray(6);

    // 1. Verifikasi integritas CRC16
    if (computeCrc16(chunkData) !== crc) {
      return {
        completed: false,
        progress: this.getProgress(),
        partIndex: partIdx,
        totalParts: total,
        isNewPart: false,
      };
    }

    // 2. Inisialisasi slot jika sesi baru terdeteksi
    if (this.sessionUuid === null || this.sessionUuid !== uuid) {
      this.sessionUuid = uuid;
      this.totalParts = total;
      this.slots = new Array(total).fill(null);
      this.isCompleted = false;
    }

    // 3. Simpan chunk jika belum ada di slot
    let isNewPart = false;
    if (partIdx < this.slots.length && !this.slots[partIdx]) {
      this.slots[partIdx] = chunkData;
      isNewPart = true;
    }

    const filledCount = this.slots.filter(Boolean).length;
    this.isCompleted = filledCount === this.totalParts && this.totalParts > 0;

    return {
      completed: this.isCompleted,
      progress: this.getProgress(),
      partIndex: partIdx,
      totalParts: this.totalParts,
      isNewPart,
    };
  }

  public getProgress(): number {
    if (this.totalParts === 0) return 0;
    const filled = this.slots.filter(Boolean).length;
    return Math.round((filled / this.totalParts) * 100);
  }

  public getMissingPartIndices(): number[] {
    const missing: number[] = [];
    for (let i = 0; i < this.totalParts; i++) {
      if (!this.slots[i]) missing.push(i);
    }
    return missing;
  }

  public isDone(): boolean {
    return this.isCompleted;
  }

  public getFullPayload(): Buffer {
    if (!this.isCompleted) {
      throw new Error(`Payload belum lengkap! Progress: ${this.getProgress()}% (${this.slots.filter(Boolean).length}/${this.totalParts})`);
    }
    return Buffer.concat(this.slots as Buffer[]);
  }

  public reset(): void {
    this.slots = [];
    this.totalParts = 0;
    this.sessionUuid = null;
    this.isCompleted = false;
  }
}
