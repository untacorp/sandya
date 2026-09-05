/**
 * Standard 12-Word Recovery Seed Phrase Generator & Verifier
 * Digunakan untuk pencadangan Master Key Lembaga / Posko Sandya
 */

export const SEED_PHRASE_CONSTANTS = {
  WORD_COUNT: 12,
} as const;

// Curated standard humanitarian & disaster emergency keywords
export const EMERGENCY_SEED_WORDS: readonly string[] = [
  'anchor', 'beacon', 'bridge', 'canyon', 'forest', 'harbor', 'island', 'jungle',
  'meadow', 'mountain', 'oasis', 'pathway', 'prairie', 'quarry', 'rapids', 'river',
  'shelter', 'summit', 'temple', 'valley', 'volcano', 'water', 'wildlife', 'zenith',
  'armor', 'battery', 'blanket', 'canvas', 'compass', 'cordage', 'filter', 'flare',
  'generator', 'helmet', 'ladder', 'lantern', 'mattress', 'medical', 'oxygen', 'pack',
  'paraffin', 'purifier', 'radio', 'rescue', 'rope', 'safety', 'satellite', 'siren',
  'stretcher', 'survival', 'tarp', 'tent', 'thermal', 'toolbox', 'transceiver', 'truck',
  'urgent', 'vaccine', 'vital', 'walkie', 'warning', 'watch', 'whistle', 'bandage',
  'accord', 'action', 'active', 'admire', 'advance', 'affirm', 'agile', 'alert',
  'alliance', 'altruism', 'amity', 'anthem', 'appeal', 'ardent', 'aspire', 'assist',
  'brave', 'caring', 'civic', 'comrade', 'courage', 'devote', 'dignity', 'duty',
  'empathy', 'endure', 'energy', 'ethical', 'fairness', 'faithful', 'fellow', 'focus',
  'gallant', 'generous', 'genuine', 'goodwill', 'grace', 'grateful', 'guidance', 'guardian',
  'harmony', 'healing', 'heart', 'helper', 'heroic', 'honest', 'honor', 'hope',
  'humane', 'impact', 'insight', 'inspire', 'integrity', 'justice', 'kindred', 'kinship',
  'leader', 'legacy', 'liberty', 'lifeline', 'loyalty', 'mentor', 'mercy', 'mission',
];

/**
 * Menghasilkan 12 kata sandi pemulihan acak dari kamus standar
 */
export function generate12WordSeed(): string[] {
  const words: string[] = [];
  const randomBytes = new Uint8Array(SEED_PHRASE_CONSTANTS.WORD_COUNT);
  globalThis.crypto.getRandomValues(randomBytes);

  for (let i = 0; i < SEED_PHRASE_CONSTANTS.WORD_COUNT; i++) {
  const wordIndex = randomBytes[i]! % EMERGENCY_SEED_WORDS.length;
  words.push(EMERGENCY_SEED_WORDS[wordIndex]!);
  }

  return words;
}

/**
 * Memvalidasi apakah daftar kata sandi valid
 */
export function validateSeedPhrase(words: string[]): boolean {
  if (!Array.isArray(words) || words.length !== SEED_PHRASE_CONSTANTS.WORD_COUNT) {
  return false;
  }
  return words.every((w) => EMERGENCY_SEED_WORDS.includes(w.toLowerCase().trim()));
}
