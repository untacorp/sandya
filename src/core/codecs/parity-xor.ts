/**
 * Engine Paritas XOR (N-of-M Erasure Coding)
 * Menghasilkan chunk paritas untuk poster cetak fisik dan transmisi layar sehingga kebal terhadap kerusakan/kehilangan 1 chunk penuh.
 * Rumus Paritas: Paritas = Part_1 ⊕ Part_2 ⊕ ... ⊕ Part_M
 * Rekonstruksi: Part_k = Paritas ⊕ (⊕_{i != k} Part_i)
 */

export const PARITY_CONSTANTS = {
  MIN_DATA_CHUNKS: 1,
  PARITY_CHUNKS_COUNT: 1,
  ALLOWED_MISSING_CHUNKS: 1,
  MISSING_INDEX_NOT_FOUND: -1,
  EMPTY_BUFFER_LENGTH: 0,
} as const;

export interface ParityChunk {
  index: number;
  totalChunks: number;
  isParity: boolean;
  originalLength: number;
  data: Buffer;
}

export interface SplitResult {
  totalDataChunks: number;
  totalWithParity: number;
  chunks: ParityChunk[];
}

export class XorParityEngine {
  /**
  * Menghitung XOR buffer dari kumpulan buffer data
  */
  public static computeParityBuffer(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) return Buffer.alloc(0);
  const maxLen = Math.max(...buffers.map((b) => b.length));
  const parity = Buffer.alloc(maxLen);

  for (let i = 0; i < maxLen; i++) {
  let xorVal = 0;
  for (const b of buffers) {
  const byteVal = i < b.length ? (b[i] ?? 0) : 0;
  xorVal ^= byteVal;
  }
  parity[i] = xorVal;
  }

  return parity;
  }

  /**
  * Merekonstruksi 1 buffer yang hilang menggunakan sisa buffer yang ada + buffer paritas
  */
  public static recoverMissingBuffer(
  presentBuffers: Buffer[],
  parityBuffer: Buffer,
  originalLength: number
  ): Buffer {
  const recovered = Buffer.alloc(parityBuffer.length);

  for (let i = 0; i < parityBuffer.length; i++) {
  let xorVal = parityBuffer[i] ?? 0;
  for (const b of presentBuffers) {
  const byteVal = i < b.length ? (b[i] ?? 0) : 0;
  xorVal ^= byteVal;
  }
  recovered[i] = xorVal;
  }

  return recovered.subarray(0, originalLength);
  }

  /**
  * Membagi satu payload biner besar menjadi M chunks data + 1 chunk paritas XOR
  */
  public static splitWithParity(
  payload: Buffer,
  targetDataChunks: number
  ): SplitResult {
  const numChunks = Math.max(PARITY_CONSTANTS.MIN_DATA_CHUNKS, targetDataChunks);
  const chunkSize = Math.ceil(payload.length / numChunks);
  const dataBuffers: Buffer[] = [];
  const chunks: ParityChunk[] = [];

  for (let i = 0; i < numChunks; i++) {
  const start = i * chunkSize;
  const end = Math.min(start + chunkSize, payload.length);
  const chunkBuf = payload.subarray(start, end);
  dataBuffers.push(chunkBuf);

  chunks.push({
  index: i,
  totalChunks: numChunks + PARITY_CONSTANTS.PARITY_CHUNKS_COUNT,
  isParity: false,
  originalLength: chunkBuf.length,
  data: chunkBuf,
  });
  }

  // Hitung Paritas
  const parityBuf = this.computeParityBuffer(dataBuffers);
  chunks.push({
  index: numChunks,
  totalChunks: numChunks + PARITY_CONSTANTS.PARITY_CHUNKS_COUNT,
  isParity: true,
  originalLength: parityBuf.length,
  data: parityBuf,
  });

  return {
  totalDataChunks: numChunks,
  totalWithParity: numChunks + PARITY_CONSTANTS.PARITY_CHUNKS_COUNT,
  chunks,
  };
  }

  /**
  * Menggabungkan kembali kumpulan chunk (bisa dengan 1 chunk yang hilang asal paritas ada)
  */
  public static assembleFromChunks(
  collectedChunks: ParityChunk[],
  expectedDataChunks: number,
  originalLengths: number[]
  ): Buffer {
  const dataMap = new Map<number, ParityChunk>();
  let parityChunk: ParityChunk | null = null;

  for (const c of collectedChunks) {
  if (c.isParity) {
  parityChunk = c;
  } else {
  dataMap.set(c.index, c);
  }
  }

  // Jika seluruh data chunk lengkap, langsung gabungkan
  if (dataMap.size === expectedDataChunks) {
  const ordered: Buffer[] = [];
  for (let i = 0; i < expectedDataChunks; i++) {
  ordered.push(dataMap.get(i)!.data);
  }
  return Buffer.concat(ordered);
  }

  // Jika ada tepat 1 data chunk yang hilang dan ada parity chunk
  if (dataMap.size === expectedDataChunks - PARITY_CONSTANTS.ALLOWED_MISSING_CHUNKS && parityChunk) {
  // Cari index yang hilang
  let missingIndex: number = PARITY_CONSTANTS.MISSING_INDEX_NOT_FOUND;
  const presentBuffers: Buffer[] = [];

  for (let i = 0; i < expectedDataChunks; i++) {
  if (dataMap.has(i)) {
  presentBuffers.push(dataMap.get(i)!.data);
  } else {
  missingIndex = i;
  }
  }

  if (missingIndex !== PARITY_CONSTANTS.MISSING_INDEX_NOT_FOUND) {
  let expectedLen = parityChunk.data.length;
  if (originalLengths && originalLengths[missingIndex] && originalLengths[missingIndex] > 0) {
  expectedLen = originalLengths[missingIndex];
  } else if (missingIndex < expectedDataChunks - PARITY_CONSTANTS.ALLOWED_MISSING_CHUNKS) {
  expectedLen = parityChunk.data.length;
  }

  const recoveredBuf = this.recoverMissingBuffer(
  presentBuffers,
  parityChunk.data,
  expectedLen
  );

  dataMap.set(missingIndex, {
  index: missingIndex,
  totalChunks: expectedDataChunks + PARITY_CONSTANTS.PARITY_CHUNKS_COUNT,
  isParity: false,
  originalLength: expectedLen,
  data: recoveredBuf,
  });

  const ordered: Buffer[] = [];
  for (let i = 0; i < expectedDataChunks; i++) {
  ordered.push(dataMap.get(i)!.data);
  }
  return Buffer.concat(ordered);
  }
  }

  throw new Error(
  `INSUFFICIENT_CHUNKS: Memerlukan minimal ${expectedDataChunks} dari ${expectedDataChunks + PARITY_CONSTANTS.PARITY_CHUNKS_COUNT} chunks untuk rekonstruksi.`
  );
  }
}
