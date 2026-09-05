import { Result, Ok } from '@/core/shared/result';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { PoskoId, asPoskoId } from '@/core/shared/branded-types';
import { RADIX } from '@/core/shared/constants';

export interface FamilyReunionMatch {
  id: string;
  seekerName: string;
  seekerPoskoId: string;
  seekerPoskoName?: string;
  seekerShelter?: string;
  targetId: string;
  targetName: string;
  targetAge: number;
  targetGender: 'M' | 'F';
  targetPoskoId: string;
  targetPoskoName: string;
  targetShelter: string;
  targetDomicile: string;
  confidence: number;
  matchType: 'EXACT_BI_DIRECTIONAL' | 'EXACT_DIRECT' | 'FUZZY_NAME_ORIGIN' | 'FUZZY_NAME';
  status: 'CONFIRMED' | 'POTENTIAL';
  recordedAt: number;
}

export interface SearchRelativesQuery {
  targetName: string;
  domicileOrigin?: string | undefined;
  seekerName?: string | undefined;
  currentPoskoId?: string | undefined;
}

export const REUNION_CONSTANTS = {
  CONFIDENCE_EXACT_BI_DIRECTIONAL: 99,
  CONFIDENCE_EXACT_WITH_ORIGIN: 98,
  CONFIDENCE_EXACT_DIRECT: 95,
  CONFIDENCE_MAX_PARTIAL: 94,
  CONFIDENCE_MAX_FUZZY: 88,
  CONFIDENCE_THRESHOLD_CONFIRMED: 90,
  CONFIDENCE_THRESHOLD_AUDIT_MATCH: 75,
  CONFIDENCE_THRESHOLD_MINIMUM: 70,
  SIMILARITY_SUBSTRING_FACTOR: 95,
  ORIGIN_BONUS_PARTIAL: 10,
  ORIGIN_BONUS_FUZZY: 8,
  MAX_SIMILARITY_PERCENT: 100,
} as const;

export class FamilyReunionService {
  constructor(private readonly refugeeRepo: IRefugeeRepository) {}

  /**
  * Menghitung jarak Levenshtein antara dua string (case-insensitive, trimmed)
  */
  public static levenshteinDistance(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
  for (let j = 1; j <= n; j++) {
  const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
  dp[i][j] = Math.min(
  dp[i - 1][j] + 1, // deletion
  dp[i][j - 1] + 1, // insertion
  dp[i - 1][j - 1] + cost // substitution
  );
  }
  }
  return dp[m][n];
  }

  /**
  * Menghitung kesamaan persentase kemiripan kata (0 - 100)
  */
  public static calculateSimilarity(strA: string, strB: string): number {
  const s1 = strA.trim().toLowerCase();
  const s2 = strB.trim().toLowerCase();
  if (s1 === s2) return REUNION_CONSTANTS.MAX_SIMILARITY_PERCENT;
  if (s1.includes(s2) || s2.includes(s1)) {
  const minLen = Math.min(s1.length, s2.length);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.round((minLen / maxLen) * REUNION_CONSTANTS.SIMILARITY_SUBSTRING_FACTOR);
  }

  const dist = FamilyReunionService.levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return REUNION_CONSTANTS.MAX_SIMILARITY_PERCENT;
  const ratio = Math.max(0, 1 - dist / maxLen);
  return Math.round(ratio * REUNION_CONSTANTS.MAX_SIMILARITY_PERCENT);
  }

  /**
  * Melakukan pencarian kerabat berdasarkan nama dan asal dusun di seluruh data posko offline
  */
  public async searchRelatives(query: SearchRelativesQuery): Promise<Result<FamilyReunionMatch[]>> {
  const allRefugeesResult = await this.refugeeRepo.findByPoskoId(asPoskoId('ALL'));
  const refugees = allRefugeesResult.ok ? allRefugeesResult.value : [];

  const targetSearch = query.targetName.trim().toLowerCase();
  const originSearch = query.domicileOrigin?.trim().toLowerCase() || '';
  const seekerSearch = query.seekerName?.trim().toLowerCase() || '';

  if (!targetSearch) {
  return Ok([]);
  }

  const matches: FamilyReunionMatch[] = [];

  for (const ref of refugees) {
  const snap = ref.toSnapshot();
  const personName = snap.fullName.toLowerCase();
  const personOrigin = (snap.domicileOrigin || '').toLowerCase();
  const personSeeking = (snap.missingKinName || '').toLowerCase();

  let confidence = 0;
  let matchType: FamilyReunionMatch['matchType'] = 'FUZZY_NAME';
  let status: FamilyReunionMatch['status'] = 'POTENTIAL';

  // 1. Bi-Directional Match: Seeker mencari Person, dan Person mencari Seeker
  if (
  seekerSearch &&
  personSeeking &&
  (personSeeking.includes(seekerSearch) || seekerSearch.includes(personSeeking)) &&
  (personName.includes(targetSearch) || targetSearch.includes(personName))
  ) {
  confidence = REUNION_CONSTANTS.CONFIDENCE_EXACT_BI_DIRECTIONAL;
  matchType = 'EXACT_BI_DIRECTIONAL';
  status = 'CONFIRMED';
  }
  // 2. Exact Direct Match: Nama identik
  else if (personName === targetSearch) {
  if (originSearch && personOrigin && (personOrigin.includes(originSearch) || originSearch.includes(personOrigin))) {
  confidence = REUNION_CONSTANTS.CONFIDENCE_EXACT_WITH_ORIGIN;
  matchType = 'EXACT_DIRECT';
  status = 'CONFIRMED';
  } else {
  confidence = REUNION_CONSTANTS.CONFIDENCE_EXACT_DIRECT;
  matchType = 'EXACT_DIRECT';
  status = 'CONFIRMED';
  }
  }
  // 3. Name Contains / Partial Match
  else if (personName.includes(targetSearch) || targetSearch.includes(personName)) {
  const sim = FamilyReunionService.calculateSimilarity(personName, targetSearch);
  const originBonus = originSearch && personOrigin && personOrigin.includes(originSearch)
  ? REUNION_CONSTANTS.ORIGIN_BONUS_PARTIAL
  : 0;
  confidence = Math.min(REUNION_CONSTANTS.CONFIDENCE_MAX_PARTIAL, sim + originBonus);
  matchType = originBonus > 0 ? 'FUZZY_NAME_ORIGIN' : 'FUZZY_NAME';
  status = confidence >= REUNION_CONSTANTS.CONFIDENCE_THRESHOLD_CONFIRMED ? 'CONFIRMED' : 'POTENTIAL';
  }
  // 4. Fuzzy Levenshtein Match
  else {
  const sim = FamilyReunionService.calculateSimilarity(personName, targetSearch);
  if (sim >= REUNION_CONSTANTS.CONFIDENCE_THRESHOLD_MINIMUM) {
  const originBonus = originSearch && personOrigin && personOrigin.includes(originSearch)
  ? REUNION_CONSTANTS.ORIGIN_BONUS_FUZZY
  : 0;
  confidence = Math.min(REUNION_CONSTANTS.CONFIDENCE_MAX_FUZZY, sim + originBonus);
  matchType = originBonus > 0 ? 'FUZZY_NAME_ORIGIN' : 'FUZZY_NAME';
  status = 'POTENTIAL';
  }
  }

  if (confidence >= REUNION_CONSTANTS.CONFIDENCE_THRESHOLD_MINIMUM) {
  matches.push({
  id: `REUNION-${snap.id}-${Date.now().toString(RADIX.BASE36)}`,
  seekerName: query.seekerName || 'Pencarian Mandiri (Mode Warga)',
  seekerPoskoId: query.currentPoskoId || 'GUEST',
  targetId: snap.id,
  targetName: snap.fullName,
  targetAge: snap.age,
  targetGender: snap.gender,
  targetPoskoId: snap.poskoId,
  targetPoskoName: this.getPoskoDisplayName(snap.poskoId),
  targetShelter: snap.shelterLocation || 'Tenda Utama',
  targetDomicile: snap.domicileOrigin || 'Tidak Diketahui',
  confidence,
  matchType,
  status,
  recordedAt: snap.createdAt,
  });
  }
  }

  // Urutkan berdasarkan confidence tertinggi
  matches.sort((a, b) => b.confidence - a.confidence);
  return Ok(matches);
  }

  /**
  * Mengaudit seluruh potensi temu keluarga otomatis di satu posko
  */
  public async getPoskoReunionMatches(poskoId: PoskoId): Promise<Result<FamilyReunionMatch[]>> {
  const allRefugeesResult = await this.refugeeRepo.findByPoskoId(asPoskoId('ALL'));
  if (!allRefugeesResult.ok) return Ok([]);

  const allRefugees = allRefugeesResult.value;
  const currentPoskoRefugees = allRefugees.filter((r) => r.toSnapshot().poskoId === poskoId);
  const otherPoskoRefugees = allRefugees.filter((r) => r.toSnapshot().poskoId !== poskoId);

  const matches: FamilyReunionMatch[] = [];

  for (const localRef of currentPoskoRefugees) {
  const localSnap = localRef.toSnapshot();
  if (!localSnap.missingKinName?.trim()) continue;

  const missingKin = localSnap.missingKinName.trim().toLowerCase();

  for (const otherRef of otherPoskoRefugees) {
  const otherSnap = otherRef.toSnapshot();
  const otherName = otherSnap.fullName.toLowerCase();
  const otherSeeking = (otherSnap.missingKinName || '').toLowerCase();

  let confidence = 0;
  let matchType: FamilyReunionMatch['matchType'] = 'FUZZY_NAME';
  let status: FamilyReunionMatch['status'] = 'POTENTIAL';

  // Bi-directional check
  if (
  otherSeeking &&
  (otherSeeking.includes(localSnap.fullName.toLowerCase()) || localSnap.fullName.toLowerCase().includes(otherSeeking)) &&
  (otherName.includes(missingKin) || missingKin.includes(otherName))
  ) {
  confidence = REUNION_CONSTANTS.CONFIDENCE_EXACT_BI_DIRECTIONAL;
  matchType = 'EXACT_BI_DIRECTIONAL';
  status = 'CONFIRMED';
  } else if (otherName === missingKin) {
  const sameOrigin =
  localSnap.domicileOrigin &&
  otherSnap.domicileOrigin &&
  localSnap.domicileOrigin.toLowerCase() === otherSnap.domicileOrigin.toLowerCase();
  confidence = sameOrigin
  ? REUNION_CONSTANTS.CONFIDENCE_EXACT_WITH_ORIGIN
  : REUNION_CONSTANTS.CONFIDENCE_EXACT_DIRECT;
  matchType = 'EXACT_DIRECT';
  status = 'CONFIRMED';
  } else {
  const sim = FamilyReunionService.calculateSimilarity(otherName, missingKin);
  if (sim >= REUNION_CONSTANTS.CONFIDENCE_THRESHOLD_AUDIT_MATCH) {
  confidence = sim;
  matchType = 'FUZZY_NAME';
  status = sim >= REUNION_CONSTANTS.CONFIDENCE_THRESHOLD_CONFIRMED ? 'CONFIRMED' : 'POTENTIAL';
  }
  }

  if (confidence >= REUNION_CONSTANTS.CONFIDENCE_THRESHOLD_MINIMUM) {
  matches.push({
  id: `MATCH-${localSnap.id}-${otherSnap.id}`,
  seekerName: localSnap.fullName,
  seekerPoskoId: localSnap.poskoId,
  seekerPoskoName: this.getPoskoDisplayName(localSnap.poskoId),
  seekerShelter: localSnap.shelterLocation || 'Tenda Utama',
  targetId: otherSnap.id,
  targetName: otherSnap.fullName,
  targetAge: otherSnap.age,
  targetGender: otherSnap.gender,
  targetPoskoId: otherSnap.poskoId,
  targetPoskoName: this.getPoskoDisplayName(otherSnap.poskoId),
  targetShelter: otherSnap.shelterLocation || 'Tenda Utama',
  targetDomicile: otherSnap.domicileOrigin || 'Dusun Asal',
  confidence,
  matchType,
  status,
  recordedAt: otherSnap.createdAt,
  });
  }
  }
  }

  matches.sort((a, b) => b.confidence - a.confidence);
  return Ok(matches);
  }

  private getPoskoDisplayName(poskoId: string): string {
  const map: Record<string, string> = {
  'POS-01': 'Posko Lapangan RW 03 Kp. Cijedil',
  'POS-02': 'Posko GOR Pacet / Balai Desa',
  'POS-03': 'Posko Tenda Lapangan Cariu',
  'posko-demo-001': 'Posko Lapangan RW 03 Kp. Cijedil',
  'posko-demo-002': 'Posko GOR Pacet / Balai Desa',
  };
  return map[poskoId] || `Posko ${poskoId}`;
  }
}
