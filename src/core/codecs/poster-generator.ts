import { XorParityEngine, SplitResult, ParityChunk } from './parity-xor';
import { RADIX } from '@/core/shared/constants';

export interface PosterQrCell {
  cellLabel: string; // e.g. "QR 1 (Data 1/3)", "QR 4 (Paritas XOR)"
  isParity: boolean;
  partIndex: number;
  totalDataParts: number;
  totalGridCells: number;
  qrRawString: string; // Format: SAN_POSTER_V2|{syncId}|{partIndex}|{totalDataParts}|{isParity:1|0}|{originalLength}|{base64Chunk}
  qrPayloadBase64: string;
  byteLength: number;
}

export interface PosterLayoutSpec {
  poskoName: string;
  poskoId?: string;
  missionName?: string;
  syncId: string;
  generatedAt: number;
  totalRefugees: number;
  criticalNeedsCount: number;
  gridType: 'DYNAMIC' | 'GRID_4' | 'GRID_8';
  totalDataParts: number; // N
  totalGridCells: number; // N + 1
  cells: PosterQrCell[];
  instructions: string;
  verificationBadge: string;
}

export interface DynamicPosterOptions {
  poskoName: string;
  poskoId?: string;
  missionName?: string;
  totalRefugees: number;
  criticalNeedsCount: number;
  payload: Buffer;
  maxChunkBytes?: number; // Default: 250 bytes per QR cell for crisp scanning
  syncId?: string;
}

export interface ParsedPosterCell {
  syncId: string;
  partIndex: number;
  totalDataParts: number;
  isParity: boolean;
  originalLength: number;
  totalPayloadBytes: number;
  chunkBuffer: Buffer;
}

export const POSTER_CONSTANTS = {
  DEFAULT_MAX_CHUNK_BYTES: 250,
  MIN_DATA_PARTS: 2,
  GRID_4_DATA_PARTS: 3,
  GRID_4_TOTAL_CELLS: 4,
  GRID_8_DATA_PARTS: 7,
  GRID_8_TOTAL_CELLS: 8,
  MIN_PARTS_V2_FULL: 8,
  MIN_PARTS_V2_SHORT: 7,
} as const;

export class PosterGenerator {
  /**
  * Menghasilkan spesifikasi poster dengan jumlah grid dinamis (N Data + 1 Paritas XOR = N+1 QR)
  * Jumlah grid beradaptasi otomatis mengikuti ukuran payload posko.
  * Cukup pindai sembarang N dari (N+1) QR untuk memulihkan 100% data posko.
  */
  public static generateDynamicParityPoster(options: DynamicPosterOptions): PosterLayoutSpec {
  const {
  poskoName,
  poskoId = 'POSKO-UNKNOWN',
  missionName = 'Operasi Tanggap Darurat',
  totalRefugees,
  criticalNeedsCount,
  payload,
  maxChunkBytes = POSTER_CONSTANTS.DEFAULT_MAX_CHUNK_BYTES,
  syncId = `SYNC-${Date.now().toString(RADIX.BASE36).toUpperCase()}`,
  } = options;

  // Hitung jumlah part data (N) secara dinamis
  const calculatedN = Math.ceil(payload.length / maxChunkBytes);
  const totalDataParts = Math.max(POSTER_CONSTANTS.MIN_DATA_PARTS, calculatedN); // Minimal 2 part data agar selalu memiliki paritas redundan

  const splitResult: SplitResult = XorParityEngine.splitWithParity(payload, totalDataParts);
  const totalGridCells = totalDataParts + 1;
  const cells: PosterQrCell[] = [];

  for (let i = 0; i < splitResult.chunks.length; i++) {
  const chunk = splitResult.chunks[i]!;
  const isParity = chunk.isParity;
  const base64Data = chunk.data.toString('base64');
  
  const cellLabel = isParity
  ? `QR ${i + 1} (PARITAS XOR)`
  : `QR ${i + 1} (Data ${i + 1}/${totalDataParts})`;

  // Amplop QR Standar Lapangan Sandya:
  // SAN_POSTER_V2|{syncId}|{partIndex}|{totalDataParts}|{isParity}|{chunkLength}|{totalPayloadBytes}|{base64Data}
  const qrRawString = `SAN_POSTER_V2|${syncId}|${chunk.index}|${totalDataParts}|${isParity ? 1 : 0}|${chunk.originalLength}|${payload.length}|${base64Data}`;

  cells.push({
  cellLabel,
  isParity,
  partIndex: chunk.index,
  totalDataParts,
  totalGridCells,
  qrRawString,
  qrPayloadBase64: base64Data,
  byteLength: chunk.data.length,
  });
  }

  return {
  poskoName,
  poskoId,
  missionName,
  syncId,
  generatedAt: Date.now(),
  totalRefugees,
  criticalNeedsCount,
  gridType: 'DYNAMIC',
  totalDataParts,
  totalGridCells,
  cells,
  instructions: `Cukup pindai sembarang ${totalDataParts} dari ${totalGridCells} kotak QR untuk memulihkan seluruh data posko 100% sempurna tanpa cela (kebal 1 kotak QR sobek/rusak fisik).`,
  verificationBadge: 'SANDYA_XOR_PARITY_VERIFIED_V2',
  };
  }

  /**
  * Menghasilkan spesifikasi poster Grid 4 QR (3 Data + 1 Paritas XOR)
  * (Backward compatibility)
  */
  public static generateGrid4Poster(
  poskoName: string,
  totalRefugees: number,
  criticalNeedsCount: number,
  payload: Buffer
  ): PosterLayoutSpec {
  const splitResult: SplitResult = XorParityEngine.splitWithParity(payload, POSTER_CONSTANTS.GRID_4_DATA_PARTS);
  const cells: PosterQrCell[] = [];
  const syncId = `SYNC-G4-${Date.now().toString(RADIX.BASE36).toUpperCase()}`;

  for (let i = 0; i < splitResult.chunks.length; i++) {
  const chunk = splitResult.chunks[i]!;
  const isParity = chunk.isParity;
  const base64Data = chunk.data.toString('base64');
  const cellLabel = isParity ? 'QR 4 (PARITAS XOR)' : `QR ${i + 1} (Data ${i + 1}/3)`;
  const qrRawString = `SAN_POSTER_V2|${syncId}|${chunk.index}|${POSTER_CONSTANTS.GRID_4_DATA_PARTS}|${isParity ? 1 : 0}|${chunk.originalLength}|${payload.length}|${base64Data}`;

  cells.push({
  cellLabel,
  isParity,
  partIndex: chunk.index,
  totalDataParts: POSTER_CONSTANTS.GRID_4_DATA_PARTS,
  totalGridCells: POSTER_CONSTANTS.GRID_4_TOTAL_CELLS,
  qrRawString,
  qrPayloadBase64: base64Data,
  byteLength: chunk.data.length,
  });
  }

  return {
  poskoName,
  syncId,
  generatedAt: Date.now(),
  totalRefugees,
  criticalNeedsCount,
  gridType: 'GRID_4',
  totalDataParts: POSTER_CONSTANTS.GRID_4_DATA_PARTS,
  totalGridCells: POSTER_CONSTANTS.GRID_4_TOTAL_CELLS,
  cells,
  instructions:
  'Cukup pindai 3 DARI 4 QR untuk memulihkan seluruh data posko 100% sempurna tanpa cela.',
  verificationBadge: 'SANDYA_XOR_PARITY_VERIFIED_V2',
  };
  }

  /**
  * Menghasilkan spesifikasi poster Grid 8 QR (7 Data + 1 Paritas XOR) untuk posko besar
  * (Backward compatibility)
  */
  public static generateGrid8Poster(
  poskoName: string,
  totalRefugees: number,
  criticalNeedsCount: number,
  payload: Buffer
  ): PosterLayoutSpec {
  const splitResult = XorParityEngine.splitWithParity(payload, POSTER_CONSTANTS.GRID_8_DATA_PARTS);
  const cells: PosterQrCell[] = [];
  const syncId = `SYNC-G8-${Date.now().toString(RADIX.BASE36).toUpperCase()}`;

  for (let i = 0; i < splitResult.chunks.length; i++) {
  const chunk = splitResult.chunks[i]!;
  const isParity = chunk.isParity;
  const base64Data = chunk.data.toString('base64');
  const cellLabel = isParity ? 'QR 8 (PARITAS XOR)' : `QR ${i + 1} (Data ${i + 1}/7)`;
  const qrRawString = `SAN_POSTER_V2|${syncId}|${chunk.index}|${POSTER_CONSTANTS.GRID_8_DATA_PARTS}|${isParity ? 1 : 0}|${chunk.originalLength}|${payload.length}|${base64Data}`;

  cells.push({
  cellLabel,
  isParity,
  partIndex: chunk.index,
  totalDataParts: POSTER_CONSTANTS.GRID_8_DATA_PARTS,
  totalGridCells: POSTER_CONSTANTS.GRID_8_TOTAL_CELLS,
  qrRawString,
  qrPayloadBase64: base64Data,
  byteLength: chunk.data.length,
  });
  }

  return {
  poskoName,
  syncId,
  generatedAt: Date.now(),
  totalRefugees,
  criticalNeedsCount,
  gridType: 'GRID_8',
  totalDataParts: POSTER_CONSTANTS.GRID_8_DATA_PARTS,
  totalGridCells: POSTER_CONSTANTS.GRID_8_TOTAL_CELLS,
  cells,
  instructions:
  'Cukup pindai 7 DARI 8 QR untuk memulihkan seluruh database pengungsi 100% sempurna.',
  verificationBadge: 'SANDYA_XOR_PARITY_VERIFIED_V2',
  };
  }

  /**
  * Membaca string QR yang dipindai dari salah satu kotak poster
  */
  public static parsePosterCellQr(qrString: string): ParsedPosterCell | null {
  if (!qrString || typeof qrString !== 'string') return null;

  if (qrString.startsWith('SAN_POSTER_V2|')) {
  const parts = qrString.split('|');
  if (parts.length >= POSTER_CONSTANTS.MIN_PARTS_V2_FULL) {
  const syncId = parts[1] || 'UNKNOWN';
  const partIndex = parseInt(parts[2] || '0', RADIX.DECIMAL);
  const totalDataParts = parseInt(parts[3] || '3', RADIX.DECIMAL);
  const isParity = parts[4] === '1';
  const originalLength = parseInt(parts[5] || '0', RADIX.DECIMAL);
  const totalPayloadBytes = parseInt(parts[6] || '0', RADIX.DECIMAL);
  const base64Data = parts.slice(7).join('|');
  const chunkBuffer = Buffer.from(base64Data, 'base64');

  return {
  syncId,
  partIndex,
  totalDataParts,
  isParity,
  originalLength: originalLength || chunkBuffer.length,
  totalPayloadBytes,
  chunkBuffer,
  };
  } else if (parts.length >= POSTER_CONSTANTS.MIN_PARTS_V2_SHORT) {
  const syncId = parts[1] || 'UNKNOWN';
  const partIndex = parseInt(parts[2] || '0', RADIX.DECIMAL);
  const totalDataParts = parseInt(parts[3] || '3', RADIX.DECIMAL);
  const isParity = parts[4] === '1';
  const originalLength = parseInt(parts[5] || '0', RADIX.DECIMAL);
  const base64Data = parts.slice(6).join('|');
  const chunkBuffer = Buffer.from(base64Data, 'base64');

  return {
  syncId,
  partIndex,
  totalDataParts,
  isParity,
  originalLength: originalLength || chunkBuffer.length,
  totalPayloadBytes: 0,
  chunkBuffer,
  };
  }
  }

  // Fallback: Jika payload biner langsung dalam base64
  try {
  const buf = Buffer.from(qrString, 'base64');
  if (buf.length > 0) {
  return {
  syncId: 'LEGACY',
  partIndex: 0,
  totalDataParts: 1,
  isParity: false,
  originalLength: buf.length,
  totalPayloadBytes: buf.length,
  chunkBuffer: buf,
  };
  }
  } catch {
  // Not base64
  }

  return null;
  }

  /**
  * Merekonstruksi payload biner utuh dari kumpulan sel poster yang berhasil dipindai
  */
  public static reconstructFromPosterCells(
  scannedCells: ParsedPosterCell[],
  expectedDataParts?: number
  ): Buffer {
  if (scannedCells.length === 0) {
  throw new Error('Tidak ada sel QR poster yang diberikan untuk rekonstruksi.');
  }

  const totalDataParts = expectedDataParts || scannedCells[0]?.totalDataParts || POSTER_CONSTANTS.GRID_4_DATA_PARTS;
  const totalPayloadBytes = scannedCells.find((c) => c.totalPayloadBytes > 0)?.totalPayloadBytes || 0;
  const chunkSize = totalPayloadBytes > 0 ? Math.ceil(totalPayloadBytes / totalDataParts) : 0;

  const parityChunks: ParityChunk[] = scannedCells.map((c) => ({
  index: c.partIndex,
  totalChunks: totalDataParts + 1,
  isParity: c.isParity,
  originalLength: c.originalLength,
  data: c.chunkBuffer,
  }));

  // Petakan panjang asli tiap part jika tersedia
  const originalLengths: number[] = new Array(totalDataParts).fill(0);
  for (let i = 0; i < totalDataParts; i++) {
  if (totalPayloadBytes > 0) {
  if (i < totalDataParts - 1) {
  originalLengths[i] = chunkSize;
  } else {
  originalLengths[i] = totalPayloadBytes - (totalDataParts - 1) * chunkSize;
  }
  }
  }

  for (const c of scannedCells) {
  if (!c.isParity && c.partIndex < totalDataParts) {
  originalLengths[c.partIndex] = c.originalLength;
  }
  }

  return XorParityEngine.assembleFromChunks(parityChunks, totalDataParts, originalLengths);
  }
}
