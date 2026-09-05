import rawWords from './data/indonesian-name-words.json';

/**
 * Kamus Nama Indonesia Terkurasi (Pre-Shared Name Dictionary)
 * Dikompilasi dari HuggingFace (80k), Database Nama.xlsx, dan indonesian-names.csv
 * Total: 2048 kata nama paling sering muncul di Indonesia (11-bit token).
 */
export const INDONESIAN_NAME_WORDS: string[] = rawWords as string[];

export type NameWordToken =
  | { type: "TOKEN"; tokenId: number }
  | { type: "LITERAL"; text: string };

export const NAME_DICTIONARY_CONSTANTS = {
  TOKEN_INDEX_OFFSET: 1,
} as const;

const NAME_TO_ID_MAP = new Map<string, number>();
for (let i = 0; i < INDONESIAN_NAME_WORDS.length; i++) {
  NAME_TO_ID_MAP.set(INDONESIAN_NAME_WORDS[i].toLowerCase(), i + NAME_DICTIONARY_CONSTANTS.TOKEN_INDEX_OFFSET);
}

export function tokenizeFullName(fullName: string): NameWordToken[] {
  const words = fullName.trim().split(/\s+/);
  const result: NameWordToken[] = [];

  for (const w of words) {
  if (!w) continue;
  const cleanWord = w.replace(/[^A-Za-z]/g, "");
  if (!cleanWord) {
  result.push({ type: "LITERAL", text: w });
  continue;
  }
  const id = NAME_TO_ID_MAP.get(cleanWord.toLowerCase());
  if (id !== undefined) {
  result.push({ type: "TOKEN", tokenId: id });
  } else {
  result.push({ type: "LITERAL", text: w });
  }
  }

  return result;
}

export function detokenizeFullName(tokens: NameWordToken[]): string {
  const parts: string[] = [];

  for (const t of tokens) {
  if (t.type === "TOKEN") {
  const word = INDONESIAN_NAME_WORDS[t.tokenId - NAME_DICTIONARY_CONSTANTS.TOKEN_INDEX_OFFSET];
  parts.push(word || "Unknown");
  } else {
  parts.push(t.text);
  }
  }

  return parts.join(" ");
}
