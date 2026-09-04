import { XorParityEngine, SplitResult } from './parity-xor';

export interface PosterQrCell {
  cellLabel: string; // e.g. "QR A (1/3)", "QR PARITAS (D)"
  isParity: boolean;
  partIndex: number;
  totalDataParts: number;
  qrPayloadBase64: string;
  byteLength: number;
}

export interface PosterLayoutSpec {
  poskoName: string;
  generatedAt: number;
  totalRefugees: number;
  criticalNeedsCount: number;
  gridType: 'GRID_4' | 'GRID_8';
  cells: PosterQrCell[];
  instructions: string;
  verificationBadge: string;
}

export class PosterGenerator {
  /**
   * Menghasilkan spesifikasi poster Grid 4 QR (3 Data + 1 Paritas XOR)
   * Kebal kerusakan 1 QR utuh di tiang tenda (cukup scan sembarang 3 dari 4 QR)
   */
  public static generateGrid4Poster(
    poskoName: string,
    totalRefugees: number,
    criticalNeedsCount: number,
    payload: Buffer
  ): PosterLayoutSpec {
    const splitResult: SplitResult = XorParityEngine.splitWithParity(payload, 3);
    const cells: PosterQrCell[] = [];

    const labels = ['QR A (Data 1/3)', 'QR B (Data 2/3)', 'QR C (Data 3/3)', 'QR D (PARITAS XOR)'];

    for (let i = 0; i < splitResult.chunks.length; i++) {
      const chunk = splitResult.chunks[i]!;
      cells.push({
        cellLabel: labels[i] || `QR ${i + 1}`,
        isParity: chunk.isParity,
        partIndex: chunk.index,
        totalDataParts: 3,
        qrPayloadBase64: chunk.data.toString('base64'),
        byteLength: chunk.data.length,
      });
    }

    return {
      poskoName,
      generatedAt: Date.now(),
      totalRefugees,
      criticalNeedsCount,
      gridType: 'GRID_4',
      cells,
      instructions:
        'Cukup pindai 3 DARI 4 QR untuk memulihkan seluruh data posko 100% sempurna tanpa cela.',
      verificationBadge: 'SANIDYA_XOR_PARITY_VERIFIED_V2',
    };
  }

  /**
   * Menghasilkan spesifikasi poster Grid 8 QR (7 Data + 1 Paritas XOR) untuk posko besar (~1.000 jiwa)
   */
  public static generateGrid8Poster(
    poskoName: string,
    totalRefugees: number,
    criticalNeedsCount: number,
    payload: Buffer
  ): PosterLayoutSpec {
    const splitResult = XorParityEngine.splitWithParity(payload, 7);
    const cells: PosterQrCell[] = [];

    for (let i = 0; i < splitResult.chunks.length; i++) {
      const chunk = splitResult.chunks[i]!;
      cells.push({
        cellLabel: chunk.isParity ? 'QR PARITAS (XOR)' : `QR DATA (${i + 1}/7)`,
        isParity: chunk.isParity,
        partIndex: chunk.index,
        totalDataParts: 7,
        qrPayloadBase64: chunk.data.toString('base64'),
        byteLength: chunk.data.length,
      });
    }

    return {
      poskoName,
      generatedAt: Date.now(),
      totalRefugees,
      criticalNeedsCount,
      gridType: 'GRID_8',
      cells,
      instructions:
        'Cukup pindai 7 DARI 8 QR untuk memulihkan seluruh database pengungsi 100% sempurna.',
      verificationBadge: 'SANIDYA_XOR_PARITY_VERIFIED_V2',
    };
  }
}
