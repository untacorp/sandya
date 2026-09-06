import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { IInventoryRepository } from '@/core/domain/logistics/inventory.repository.interface';
import { asPoskoId } from '@/core/shared/branded-types';
import {
  extractDemographicBreakdown,
  calculateItemResilience,
} from '@/core/domain/logistics/consumption-resilience';

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
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'STANDBY';
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

export const ANALYTICS_CONSTANTS = {
  INFANT_MAX_AGE: 5,
  ELDERLY_MIN_AGE: 60,
  BURN_RATE_LOOKBACK_DAYS: 3,
  DECIMAL_PRECISION_FACTOR: 10,
  INFINITE_DAYS_REMAINING: 999,
  CRITICAL_DAYS_THRESHOLD: 1,
  WARNING_DAYS_THRESHOLD: 3,
} as const;

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

  if (snap.age < ANALYTICS_CONSTANTS.INFANT_MAX_AGE) countInfants += 1;
  if (snap.age >= ANALYTICS_CONSTANTS.ELDERLY_MIN_AGE) countElderly += 1;
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
   * mengadopsi standar kemanusiaan SPHERE Project & BNPB berdasarkan populasi pengungsi.
   */
  public async getInventoryBurnRate(poskoId: string): Promise<ItemBurnRateSummary[]> {
    const targetPoskoId = asPoskoId(poskoId);
    const [itemsResult, refugeesResult] = await Promise.all([
      this.inventoryRepo.findByPoskoId(targetPoskoId),
      this.refugeeRepo.findByPoskoId(targetPoskoId),
    ]);

    const items = itemsResult.ok ? itemsResult.value : [];
    const refugees = refugeesResult.ok ? refugeesResult.value : [];

    const demographics = extractDemographicBreakdown(
      refugees.map((r) => {
        const snap = r.toSnapshot();
        return {
          age: snap.age,
          gender: snap.gender,
        };
      })
    );

    const summaries: ItemBurnRateSummary[] = [];

    for (const item of items) {
      const snap = item.toSnapshot();
      const resilience = calculateItemResilience(
        {
          itemName: snap.itemName,
          category: snap.category,
          currentQuantity: snap.currentQuantity,
          unit: snap.unit,
        },
        demographics
      );

      summaries.push({
        itemId: snap.id,
        itemName: snap.itemName,
        category: snap.category,
        currentQuantity: snap.currentQuantity,
        unit: snap.unit,
        dailyBurnRate: resilience.dailyDemand,
        daysRemaining: resilience.daysRemaining,
        status: resilience.status,
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
