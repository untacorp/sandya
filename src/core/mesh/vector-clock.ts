export interface PoskoClockState {
  poskoId: string;
  maxLogicalSeq: number;
  lastUpdated: number;
}

export interface DeltaSyncRequest {
  poskoId: string;
  fromSeq: number;
  toSeq: number;
}

export class VectorClockTracker {
  private clocks = new Map<string, PoskoClockState>();

  constructor(initialClocks?: Record<string, number>) {
    if (initialClocks) {
      for (const [poskoId, seq] of Object.entries(initialClocks)) {
        this.clocks.set(poskoId, {
          poskoId,
          maxLogicalSeq: seq,
          lastUpdated: Date.now(),
        });
      }
    }
  }

  public getClock(poskoId: string): number {
    return this.clocks.get(poskoId)?.maxLogicalSeq || 0;
  }

  public updateClock(poskoId: string, seq: number): boolean {
    const current = this.getClock(poskoId);
    if (seq > current) {
      this.clocks.set(poskoId, {
        poskoId,
        maxLogicalSeq: seq,
        lastUpdated: Date.now(),
      });
      return true;
    }
    return false;
  }

  public exportClockSnapshot(): Record<string, number> {
    const snapshot: Record<string, number> = {};
    for (const [poskoId, state] of this.clocks.entries()) {
      snapshot[poskoId] = state.maxLogicalSeq;
    }
    return snapshot;
  }

  /**
   * Menghitung selisih (delta) yang dibutuhkan antara clock lokal dan remote probe
   */
  public computeDeltaRequirements(remoteClocks: Record<string, number>): DeltaSyncRequest[] {
    const requests: DeltaSyncRequest[] = [];

    for (const [poskoId, remoteSeq] of Object.entries(remoteClocks)) {
      const localSeq = this.getClock(poskoId);
      if (remoteSeq > localSeq) {
        requests.push({
          poskoId,
          fromSeq: localSeq + 1,
          toSeq: remoteSeq,
        });
      }
    }

    return requests;
  }
}
