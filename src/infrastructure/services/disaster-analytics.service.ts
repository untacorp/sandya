import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { IInventoryRepository } from '@/core/domain/logistics/inventory.repository.interface';
import { PoskoId, asPoskoId } from '@/core/shared/branded-types';

export interface PoskoTriageSummary {
  poskoId: string;
  totalRefugees: number;
  countRed: number;
  countYellow: number;
  countGreen: number;
  countBlack: number;
  countInfants: number; // age < 5
  countElderly: number; // age >= 60
}

export interface ItemBurnRateSummary {
  itemId: string;
  itemName: string;
  category: string;
  currentQuantity: number;
  unit: string;
  dailyBurnRate: number;
  daysRemaining: number;
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY';
}

export interface FamilyReunionMatchSummary {
  seekerRefugeeId: string;
  seekerName: string;
  lookingFor: string;
  seekerPoskoId: string;
  foundRefugeeId: string;
  foundName: string;
  foundPoskoId: string;
  domicileOrigin: string | null;
  shelterLocation: string | null;
}

export class DisasterAnalyticsService {
  constructor(
    private readonly refugeeRepo: IRefugeeRepository,
    private readonly inventoryRepo: IInventoryRepository
  ) {}

  /**
   * Menghitung ringkasan triase START & demografi kelompok rentan
   */
  public async getTriageHeatmap(poskoId?: string): Promise<PoskoTriageSummary> {
    const targetPoskoId = poskoId ? asPoskoId(poskoId) : asPoskoId('all');
    const refugeesResult = await this.refugeeRepo.findByPoskoId(targetPoskoId);
    const refugees = refugeesResult.ok ? refugeesResult.value : [];

    let countRed = 0;
    let countYellow = 0;
    let countGreen = 0;
    let countBlack = 0;
    let countInfants = 0;
    let countElderly = 0;

    for (const r of refugees) {
      const snap = r.toSnapshot();
      if (snap.currentTriage === 'RED') countRed += 1;
      else if (snap.currentTriage === 'YELLOW') countYellow += 1;
      else if (snap.currentTriage === 'BLACK') countBlack += 1;
      else countGreen += 1;

      if (snap.age < 5) countInfants += 1;
      if (snap.age >= 60) countElderly += 1;
    }

    return {
      poskoId: targetPoskoId,
      totalRefugees: refugees.length,
      countRed,
      countYellow,
      countGreen,
      countBlack,
      countInfants,
      countElderly,
    };
  }

  /**
   * Menghitung proyeksi burn-rate dan estimasi sisa hari stok logistik
   */
  public async getInventoryBurnRate(poskoId: string): Promise<ItemBurnRateSummary[]> {
    const itemsResult = await this.inventoryRepo.findByPoskoId(asPoskoId(poskoId));
    const items = itemsResult.ok ? itemsResult.value : [];
    const summaries: ItemBurnRateSummary[] = [];

    for (const item of items) {
      const snap = item.toSnapshot();
      const txResult = await this.inventoryRepo.getTransactionsByItemId(snap.id);
      const txs = txResult.ok ? txResult.value : [];

      // Hitung total pemakaian distribusi 3 hari terakhir
      let totalDistributed = 0;
      for (const tx of txs) {
        if (tx.txType === 'DISTRIBUTION' && tx.quantityChange < 0) {
          totalDistributed += Math.abs(tx.quantityChange);
        }
      }

      const dailyBurnRate = totalDistributed > 0 ? Math.round((totalDistributed / 3) * 10) / 10 : 0;
      const daysRemaining =
        dailyBurnRate > 0 ? Math.round((snap.currentQuantity / dailyBurnRate) * 10) / 10 : 999;

      let status: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
      if (daysRemaining <= 1) status = 'CRITICAL';
      else if (daysRemaining <= 3) status = 'WARNING';

      summaries.push({
        itemId: snap.id,
        itemName: snap.itemName,
        category: snap.category,
        currentQuantity: snap.currentQuantity,
        unit: snap.unit,
        dailyBurnRate,
        daysRemaining,
        status,
      });
    }

    summaries.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return summaries;
  }

  /**
   * Menemukan rekonsiliasi graf Temu Keluarga antar-pengungsi
   */
  public async getFamilyReunionMatches(poskoId: string): Promise<FamilyReunionMatchSummary[]> {
    const refugeesResult = await this.refugeeRepo.findByPoskoId(asPoskoId(poskoId));
    const refugees = refugeesResult.ok ? refugeesResult.value : [];
    const matches: FamilyReunionMatchSummary[] = [];

    for (const seeker of refugees) {
      const snapSeeker = seeker.toSnapshot();
      if (!snapSeeker.missingKinName?.trim()) continue;

      const candidatesResult = await this.refugeeRepo.findMissingKinMatches(
        asPoskoId(poskoId),
        snapSeeker.missingKinName
      );

      if (candidatesResult.ok) {
        for (const candidate of candidatesResult.value) {
          const snapCandidate = candidate.toSnapshot();
          if (snapCandidate.id === snapSeeker.id) continue;

          matches.push({
            seekerRefugeeId: snapSeeker.id,
            seekerName: snapSeeker.fullName,
            lookingFor: snapSeeker.missingKinName,
            seekerPoskoId: snapSeeker.poskoId,
            foundRefugeeId: snapCandidate.id,
            foundName: snapCandidate.fullName,
            foundPoskoId: snapCandidate.poskoId,
            domicileOrigin: snapCandidate.domicileOrigin,
            shelterLocation: snapCandidate.shelterLocation,
          });
        }
      }
    }

    return matches;
  }
}
