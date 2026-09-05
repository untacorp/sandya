import { BITWISE, RADIX } from '@/core/shared/constants';

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
  frameString: string; // Format: SAN_ANIM_V1|{uuid}|{partIndex}|{totalParts}|{crc16}|{base64Chunk}
}

export const ANIMATED_QR_CONSTANTS = {
  CRC16_INITIAL_VALUE: 0xffff,
  CRC16_POLYNOMIAL: 0x1021,
  CRC16_MASK: 0xffff,
  CRC16_HIGH_BIT: 0x8000,
  DEFAULT_MAX_CHUNK_SIZE: 400,
  MAX_PARTS: 255,
  MAX_SESSION_UUID: 65535,
  HEADER_SIZE_BYTES: 6,
  MIN_FRAME_PARTS_COUNT: 6,
  PAYLOAD_UUID_OFFSET: 0,
  PART_INDEX_OFFSET: 2,
  TOTAL_PARTS_OFFSET: 3,
  CRC16_OFFSET: 4,
  CHUNK_DATA_OFFSET: 6,
  PERCENTAGE_MAX: 100,
} as const;

/**
 * Menghitung CRC16 (CCITT-False) untuk verifikasi integritas frame super-cepat
 */
export function computeCrc16(buffer: Buffer): number {
  let crc: number = ANIMATED_QR_CONSTANTS.CRC16_INITIAL_VALUE;
  for (let i = 0; i < buffer.length; i++) {
  crc ^= (buffer[i]! & BITWISE.BYTE_MASK) << BITWISE.BITS_PER_BYTE;
  for (let j = 0; j < BITWISE.BITS_PER_BYTE; j++) {
  if ((crc & ANIMATED_QR_CONSTANTS.CRC16_HIGH_BIT) !== 0) {
  crc = ((crc << 1) ^ ANIMATED_QR_CONSTANTS.CRC16_POLYNOMIAL) & ANIMATED_QR_CONSTANTS.CRC16_MASK;
  } else {
  crc = (crc << 1) & ANIMATED_QR_CONSTANTS.CRC16_MASK;
  }
  }
  }
  return crc & ANIMATED_QR_CONSTANTS.CRC16_MASK;
}

/**
 * Memecah buffer payload besar menjadi rangkaian frame QR dinamis
 * @param payload Buffer data terkompresi / Ultra-Dense biner
 * @param maxChunkSize Ukuran data per frame (Default: 400 Bytes untuk layar HP outdoor)
 */
export function splitPayloadToAnimatedFrames(
  payload: Buffer,
  maxChunkSize: number = ANIMATED_QR_CONSTANTS.DEFAULT_MAX_CHUNK_SIZE
): AnimatedFrame[] {
  const totalParts = Math.max(1, Math.ceil(payload.length / maxChunkSize));
  if (totalParts > ANIMATED_QR_CONSTANTS.MAX_PARTS) {
  throw new Error(
  `Payload terlalu besar untuk 1 siklus animated QR (Maksimal ${ANIMATED_QR_CONSTANTS.MAX_PARTS} parts, dibutuhkan ${totalParts})`
  );
  }

  const sessionUuid = Math.floor(Math.random() * ANIMATED_QR_CONSTANTS.MAX_SESSION_UUID);
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
  const headerBuf = Buffer.alloc(ANIMATED_QR_CONSTANTS.HEADER_SIZE_BYTES);
  headerBuf.writeUInt16BE(sessionUuid, ANIMATED_QR_CONSTANTS.PAYLOAD_UUID_OFFSET);
  headerBuf.writeUInt8(partIndex, ANIMATED_QR_CONSTANTS.PART_INDEX_OFFSET);
  headerBuf.writeUInt8(totalParts, ANIMATED_QR_CONSTANTS.TOTAL_PARTS_OFFSET);
  headerBuf.writeUInt16BE(crc16, ANIMATED_QR_CONSTANTS.CRC16_OFFSET);

  const fullFrameBuf = Buffer.concat([headerBuf, chunk]);
  const base64Data = chunk.toString('base64');
  const frameString = `SAN_ANIM_V1|${sessionUuid}|${partIndex}|${totalParts}|${crc16}|${base64Data}`;

  frames.push({
  header: {
  payloadUuid: sessionUuid,
  partIndex,
  totalParts,
  crc16,
  },
  rawBuffer: fullFrameBuf,
  base64String: fullFrameBuf.toString('base64'),
  frameString,
  });
  }

  return frames;
}

/**
 * Mengurai string frame QR animasi menjadi buffer standar
 */
export function parseAnimatedFrameString(str: string): Buffer | null {
  if (!str || typeof str !== 'string') return null;

  if (str.startsWith('SAN_ANIM_V1|')) {
  const parts = str.split('|');
  if (parts.length >= ANIMATED_QR_CONSTANTS.MIN_FRAME_PARTS_COUNT) {
  const uuid = parseInt(parts[1] || '0', RADIX.DECIMAL);
  const partIdx = parseInt(parts[2] || '0', RADIX.DECIMAL);
  const total = parseInt(parts[3] || '1', RADIX.DECIMAL);
  const crc = parseInt(parts[4] || '0', RADIX.DECIMAL);
  const chunkData = Buffer.from(parts.slice(5).join('|'), 'base64');

  const headerBuf = Buffer.alloc(ANIMATED_QR_CONSTANTS.HEADER_SIZE_BYTES);
  headerBuf.writeUInt16BE(uuid, ANIMATED_QR_CONSTANTS.PAYLOAD_UUID_OFFSET);
  headerBuf.writeUInt8(partIdx, ANIMATED_QR_CONSTANTS.PART_INDEX_OFFSET);
  headerBuf.writeUInt8(total, ANIMATED_QR_CONSTANTS.TOTAL_PARTS_OFFSET);
  headerBuf.writeUInt16BE(crc, ANIMATED_QR_CONSTANTS.CRC16_OFFSET);
  return Buffer.concat([headerBuf, chunkData]);
  }
  }

  try {
  const buf = Buffer.from(str, 'base64');
  if (buf.length >= ANIMATED_QR_CONSTANTS.HEADER_SIZE_BYTES) return buf;
  } catch {
  // Ignore error
  }

  return null;
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
  * Memasukkan frame baru yang ditangkap kamera (Buffer atau String)
  */
  public ingestFrame(frameInput: Buffer | string): {
  completed: boolean;
  progress: number;
  partIndex: number;
  totalParts: number;
  isNewPart: boolean;
  } {
  let frameBuffer: Buffer | null = null;
  if (typeof frameInput === 'string') {
  frameBuffer = parseAnimatedFrameString(frameInput);
  } else if (Buffer.isBuffer(frameInput)) {
  frameBuffer = frameInput;
  }

  if (!frameBuffer || frameBuffer.length < ANIMATED_QR_CONSTANTS.HEADER_SIZE_BYTES) {
  return {
  completed: false,
  progress: this.getProgress(),
  partIndex: -1,
  totalParts: this.totalParts,
  isNewPart: false,
  };
  }

  const uuid = frameBuffer.readUInt16BE(ANIMATED_QR_CONSTANTS.PAYLOAD_UUID_OFFSET);
  const partIdx = frameBuffer.readUInt8(ANIMATED_QR_CONSTANTS.PART_INDEX_OFFSET);
  const total = frameBuffer.readUInt8(ANIMATED_QR_CONSTANTS.TOTAL_PARTS_OFFSET);
  const crc = frameBuffer.readUInt16BE(ANIMATED_QR_CONSTANTS.CRC16_OFFSET);
  const chunkData = frameBuffer.subarray(ANIMATED_QR_CONSTANTS.CHUNK_DATA_OFFSET);

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
  return Math.round((filled / this.totalParts) * ANIMATED_QR_CONSTANTS.PERCENTAGE_MAX);
  }

  public getMissingPartIndices(): number[] {
  const missing: number[] = [];
  for (let i = 0; i < this.totalParts; i++) {
  if (!this.slots[i]) missing.push(i);
  }
  return missing;
  }

  public getCapturedPartIndices(): number[] {
  const captured: number[] = [];
  for (let i = 0; i < this.totalParts; i++) {
  if (this.slots[i]) captured.push(i);
  }
  return captured;
  }

  public getTotalParts(): number {
  return this.totalParts;
  }

  public isDone(): boolean {
  return this.isCompleted;
  }

  public getFullPayload(): Buffer {
  if (!this.isCompleted) {
  throw new Error(
  `Payload belum lengkap! Progress: ${this.getProgress()}% (${this.slots.filter(Boolean).length}/${this.totalParts})`
  );
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
