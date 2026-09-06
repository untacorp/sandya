export const VECTOR_CLOCK_CONSTANTS = {
  INITIAL_SEQUENCE: 0,
  NEXT_SEQUENCE_OFFSET: 1,
} as const;

export interface PoskoClockState {
  key: string;
  poskoId: string;
  authorId?: string;
  maxLogicalSeq: number;
  lastUpdated: number;
}

export interface DeltaSyncRequest {
  poskoId: string;
  authorId?: string;
  clockKey?: string;
  fromSeq: number;
  toSeq: number;
}

export type ClockComparisonResult = 'EQUAL' | 'AHEAD' | 'BEHIND' | 'CONCURRENT';

export class VectorClockTracker {
  private clocks = new Map<string, PoskoClockState>();

  constructor(initialClocks?: Record<string, number>) {
    if (initialClocks) {
      this.importClockSnapshot(initialClocks);
    }
  }

  /**
   * Format standar compound key untuk vector clock: `poskoId:authorId` atau `poskoId`
   */
  public static formatKey(poskoId: string, authorId?: string): string {
    if (!authorId || authorId === '*' || authorId === poskoId) {
      return poskoId;
    }
    return `${poskoId}:${authorId}`;
  }

  /**
   * Parsing compound key menjadi tuple { poskoId, authorId }
   */
  public static parseKey(key: string): { poskoId: string; authorId?: string } {
    const parts = key.split(':');
    if (parts.length >= 2) {
      return {
        poskoId: parts[0]!,
        authorId: parts.slice(1).join(':'),
      };
    }
    return { poskoId: key };
  }

  /**
   * Mendapatkan logical sequence terakhir untuk poskoId atau compound key
   */
  public getClock(keyOrPoskoId: string, authorId?: string): number {
    const key = authorId ? VectorClockTracker.formatKey(keyOrPoskoId, authorId) : keyOrPoskoId;
    
    // 1. Coba exact key
    const exact = this.clocks.get(key);
    if (exact) return exact.maxLogicalSeq;

    // 2. Jika query hanya poskoId, cari nilai tertinggi di antara sub-authors
    if (!authorId && !keyOrPoskoId.includes(':')) {
      let maxSeq: number = VECTOR_CLOCK_CONSTANTS.INITIAL_SEQUENCE;
      for (const [k, state] of this.clocks.entries()) {
        if (k === keyOrPoskoId || k.startsWith(`${keyOrPoskoId}:`)) {
          if (state.maxLogicalSeq > maxSeq) {
            maxSeq = state.maxLogicalSeq;
          }
        }
      }
      return maxSeq;
    }

    return VECTOR_CLOCK_CONSTANTS.INITIAL_SEQUENCE;
  }

  /**
   * Memperbarui clock untuk poskoId / compound key.
   * Hanya mengupdate jika `seq` lebih besar dari sequence saat ini (monotonic safety).
   */
  public updateClock(keyOrPoskoId: string, seq: number, authorId?: string): boolean {
    const key = authorId ? VectorClockTracker.formatKey(keyOrPoskoId, authorId) : keyOrPoskoId;
    const { poskoId, authorId: parsedAuthor } = VectorClockTracker.parseKey(key);
    const current = this.clocks.get(key)?.maxLogicalSeq ?? VECTOR_CLOCK_CONSTANTS.INITIAL_SEQUENCE;

    if (seq > current) {
      this.clocks.set(key, {
        key,
        poskoId,
        authorId: parsedAuthor,
        maxLogicalSeq: seq,
        lastUpdated: Date.now(),
      });
      return true;
    }
    return false;
  }

  /**
   * Mengambil snapshot seluruh vector clock saat ini dalam bentuk key-value dictionary
   */
  public exportClockSnapshot(): Record<string, number> {
    const snapshot: Record<string, number> = {};
    for (const [key, state] of this.clocks.entries()) {
      snapshot[key] = state.maxLogicalSeq;
    }
    return snapshot;
  }

  /**
   * Mengimpor dictionary clock (misal dari SQLite / localStorage)
   */
  public importClockSnapshot(clocks: Record<string, number>): void {
    for (const [key, seq] of Object.entries(clocks)) {
      const { poskoId, authorId } = VectorClockTracker.parseKey(key);
      const current = this.clocks.get(key);
      if (!current || seq > current.maxLogicalSeq) {
        this.clocks.set(key, {
          key,
          poskoId,
          authorId,
          maxLogicalSeq: seq,
          lastUpdated: Date.now(),
        });
      }
    }
  }

  /**
   * Menggabungkan (merge) remote clocks ke local clocks dengan mengambil nilai max monotonic
   */
  public merge(remoteClocks: Record<string, number>): { updatedKeys: string[] } {
    const updatedKeys: string[] = [];
    for (const [key, remoteSeq] of Object.entries(remoteClocks)) {
      const updated = this.updateClock(key, remoteSeq);
      if (updated) {
        updatedKeys.push(key);
      }
    }
    return { updatedKeys };
  }

  /**
   * Menghitung status relasi causal antara clock lokal dan remote clock
   */
  public compare(remoteClocks: Record<string, number>): ClockComparisonResult {
    const allKeys = new Set([...this.clocks.keys(), ...Object.keys(remoteClocks)]);
    let hasGreater = false;
    let hasLesser = false;

    for (const key of allKeys) {
      const localSeq = this.clocks.get(key)?.maxLogicalSeq ?? 0;
      const remoteSeq = remoteClocks[key] ?? 0;

      if (localSeq > remoteSeq) {
        hasGreater = true;
      } else if (localSeq < remoteSeq) {
        hasLesser = true;
      }
    }

    if (hasGreater && hasLesser) return 'CONCURRENT';
    if (hasGreater && !hasLesser) return 'AHEAD';
    if (!hasGreater && hasLesser) return 'BEHIND';
    return 'EQUAL';
  }

  /**
   * Menghitung selisih (delta) yang dibutuhkan antara clock lokal dan remote probe
   */
  public computeDeltaRequirements(remoteClocks: Record<string, number>): DeltaSyncRequest[] {
    const requests: DeltaSyncRequest[] = [];

    for (const [key, remoteSeq] of Object.entries(remoteClocks)) {
      const { poskoId, authorId } = VectorClockTracker.parseKey(key);
      const localSeq = this.clocks.get(key)?.maxLogicalSeq ?? VECTOR_CLOCK_CONSTANTS.INITIAL_SEQUENCE;

      if (remoteSeq > localSeq) {
        requests.push({
          poskoId,
          authorId,
          clockKey: key,
          fromSeq: localSeq + VECTOR_CLOCK_CONSTANTS.NEXT_SEQUENCE_OFFSET,
          toSeq: remoteSeq,
        });
      }
    }

    return requests;
  }
}
