/**
 * Standard 12-Word Recovery Seed Phrase Generator & Verifier
 * Digunakan untuk pencadangan Master Key Lembaga / Posko Sandya
 * Menggunakan kamus 256 kata terstandarisasi kemanusiaan & tanggap darurat (8-bit per word, zero modulo bias).
 */

export const SEED_PHRASE_CONSTANTS = {
  WORD_COUNT: 12,
  DICTIONARY_SIZE: 256,
  ENTROPY_BYTES: 12,
  MASTER_SEED_BYTES: 32,
} as const;

/**
 * Kamus 256 kata darurat, taktis, kemanusiaan, dan geografi Sandya (2^8 = 256 kata unik)
 */
export const EMERGENCY_SEED_WORDS: readonly string[] = [
  'access', 'accord', 'action', 'active', 'admire', 'advance', 'affirm', 'agency',
  'agile', 'airlift', 'alert', 'alliance', 'altruism', 'amity', 'anchor', 'anthem',
  'appeal', 'ardent', 'armor', 'aspire', 'assist', 'bandage', 'barrier', 'battery',
  'beacon', 'blanket', 'brave', 'bridge', 'bundle', 'camp', 'canteen', 'canvas',
  'canyon', 'cargo', 'caring', 'carrier', 'civic', 'clinic', 'cluster', 'comfort',
  'compass', 'comrade', 'conduit', 'cordage', 'courage', 'depot', 'devote', 'dignity',
  'dispatch', 'doctor', 'domain', 'drain', 'drone', 'duty', 'dynamo', 'empathy',
  'endure', 'energy', 'engine', 'escort', 'ethical', 'evacuate', 'expedite', 'fairness',
  'faithful', 'feeder', 'fellow', 'filter', 'flare', 'fleet', 'flight', 'focus',
  'forest', 'forward', 'freight', 'fuel', 'gallant', 'gear', 'generator', 'generous',
  'genuine', 'goodwill', 'grace', 'grateful', 'grid', 'guard', 'guardian', 'guidance',
  'habitat', 'hamlet', 'harbor', 'harmony', 'harvest', 'hauler', 'hazard', 'healing',
  'health', 'heart', 'helmet', 'helper', 'heroic', 'hoist', 'honest', 'honor',
  'hope', 'humane', 'humble', 'hygiene', 'impact', 'insight', 'inspire', 'integrity',
  'island', 'jungle', 'justice', 'kernel', 'kindred', 'kinship', 'kit', 'ladder',
  'lantern', 'leader', 'legacy', 'liberty', 'lifeline', 'liferaft', 'link', 'locate',
  'lodging', 'logbook', 'loyalty', 'marshal', 'matrix', 'mattress', 'meadow', 'medic',
  'medical', 'mentor', 'mercy', 'mission', 'mobile', 'mountain', 'muster', 'network',
  'node', 'nurse', 'oasis', 'outpost', 'oxygen', 'pack', 'package', 'panacea',
  'paraffin', 'passage', 'pathway', 'patrol', 'payload', 'portal', 'posko', 'potable',
  'prairie', 'priority', 'protect', 'protein', 'purifier', 'pylon', 'quarry', 'radar',
  'radio', 'rally', 'ranger', 'rapids', 'ration', 'realm', 'recovery', 'refuge',
  'relief', 'remedy', 'rescue', 'reserve', 'resource', 'response', 'restore', 'river',
  'rope', 'roster', 'route', 'safe', 'safety', 'salvage', 'sanitary', 'satellite',
  'scanner', 'scout', 'secure', 'sensor', 'serum', 'shelter', 'shuttle', 'signal',
  'siren', 'socket', 'solace', 'splice', 'squad', 'stable', 'station', 'sterile',
  'steward', 'stock', 'stretcher', 'summit', 'supply', 'support', 'surgeon', 'survival',
  'suture', 'system', 'tactical', 'tarp', 'telecom', 'temple', 'tent', 'terminal',
  'terrain', 'thermal', 'toolbox', 'transceiver', 'triage', 'truck', 'unite', 'unity',
  'urgent', 'utility', 'vaccine', 'valley', 'valor', 'vanguard', 'vector', 'vehicle',
  'vendor', 'vessel', 'victor', 'vigil', 'vital', 'volcano', 'walkie', 'warden',
  'warning', 'watch', 'water', 'waypoint', 'whistle', 'wildlife', 'wireless', 'zenith',
];

// O(1) Fast Lookup Map & Set
const WORD_INDEX_MAP = new Map<string, number>(
  EMERGENCY_SEED_WORDS.map((word, index) => [word, index])
);

/**
 * Membersihkan dan menormalisasi input seed phrase dari teks bebas / nomor urut
 */
export function normalizeSeedPhrase(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input
      .map((w) => w.toLowerCase().trim().replace(/^[^a-z]+|[^a-z]+$/g, ''))
      .filter((w) => w.length > 0);
  }

  if (typeof input !== 'string') {
    return [];
  }

  return input
    .toLowerCase()
    .replace(/[0-9]+\.\s*/g, ' ') // Hapus nomor urut seperti '1. ', '2. '
    .replace(/[,;|\n\r\t]/g, ' ')  // Hapus pemisah tanda baca / newline
    .split(/\s+/)
    .map((w) => w.trim().replace(/^[^a-z]+|[^a-z]+$/g, ''))
    .filter((w) => w.length > 0);
}

/**
 * Menghasilkan 12 kata sandi pemulihan acak dari kamus standar (Zero Modulo Bias)
 */
export function generate12WordSeed(): string[] {
  const randomBytes = new Uint8Array(SEED_PHRASE_CONSTANTS.WORD_COUNT);
  globalThis.crypto.getRandomValues(randomBytes);

  return Array.from(randomBytes, (byte) => EMERGENCY_SEED_WORDS[byte]!);
}

/**
 * Memvalidasi apakah daftar kata sandi valid (tepat 12 kata dan terdaftar di kamus)
 */
export function validateSeedPhrase(input: string[] | string): boolean {
  const words = normalizeSeedPhrase(input);
  if (words.length !== SEED_PHRASE_CONSTANTS.WORD_COUNT) {
    return false;
  }
  return words.every((w) => WORD_INDEX_MAP.has(w));
}

/**
 * Format seed phrase menjadi representasi teks terstruktur dengan nomor urut
 */
export function formatSeedPhrase(words: string[]): string {
  const normalized = normalizeSeedPhrase(words);
  return normalized.map((w, idx) => `${idx + 1}. ${w}`).join(' ');
}

/**
 * Mengonversi 12 kata seed phrase menjadi 12-byte raw entropy biner
 */
export function seedPhraseToEntropy(words: string[] | string): Uint8Array {
  const normalized = normalizeSeedPhrase(words);
  if (normalized.length !== SEED_PHRASE_CONSTANTS.WORD_COUNT) {
    throw new Error(`Invalid seed phrase length: expected 12 words, got ${normalized.length}`);
  }

  const entropy = new Uint8Array(SEED_PHRASE_CONSTANTS.WORD_COUNT);
  for (let i = 0; i < normalized.length; i++) {
    const word = normalized[i]!;
    const index = WORD_INDEX_MAP.get(word);
    if (index === undefined) {
      throw new Error(`Unknown seed word: "${word}"`);
    }
    entropy[i] = index;
  }

  return entropy;
}

/**
 * Mengonversi 12-byte raw entropy biner kembali menjadi 12 kata seed phrase
 */
export function entropyToSeedPhrase(entropy: Uint8Array): string[] {
  if (entropy.length !== SEED_PHRASE_CONSTANTS.ENTROPY_BYTES) {
    throw new Error(`Invalid entropy length: expected 12 bytes, got ${entropy.length}`);
  }

  return Array.from(entropy, (byte) => EMERGENCY_SEED_WORDS[byte]!);
}

/**
 * Mengonversi seed phrase menjadi string hexadecimal (24 hex characters)
 */
export function seedPhraseToHex(words: string[] | string): string {
  const entropy = seedPhraseToEntropy(words);
  return Array.from(entropy, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mengonversi string hexadecimal (24 hex characters) menjadi seed phrase
 */
export function hexToSeedPhrase(hex: string): string[] {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length !== SEED_PHRASE_CONSTANTS.ENTROPY_BYTES * 2) {
    throw new Error(`Invalid hex length: expected 24 characters, got ${cleanHex.length}`);
  }

  const bytes = new Uint8Array(SEED_PHRASE_CONSTANTS.ENTROPY_BYTES);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }

  return entropyToSeedPhrase(bytes);
}

/**
 * Menurunkan Master Key Seed 32-byte deterministik menggunakan SHA-256 dari 12 kata pemulihan
 */
export async function deriveMasterKeySeed(words: string[] | string): Promise<Uint8Array> {
  const normalized = normalizeSeedPhrase(words);
  if (!validateSeedPhrase(normalized)) {
    throw new Error('Cannot derive master key from invalid seed phrase');
  }

  const phraseString = normalized.join(' ');
  const msgBytes = new TextEncoder().encode(`SANDYA_MASTER_SEED_V1:${phraseString}`);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBytes);

  return new Uint8Array(hashBuffer);
}
