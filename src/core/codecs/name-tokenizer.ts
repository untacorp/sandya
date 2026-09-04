import {
  INDONESIAN_NAME_WORDS,
  NameWordToken,
  tokenizeFullName,
  detokenizeFullName,
} from './name-dictionary';

export interface TokenizedNameResult {
  tokens: NameWordToken[];
  totalWords: number;
  tokenizedWordsCount: number;
  literalWordsCount: number;
}

export class NameTokenizer {
  public static tokenize(fullName: string): TokenizedNameResult {
    const tokens = tokenizeFullName(fullName);
    let tokenizedWordsCount = 0;
    let literalWordsCount = 0;

    for (const t of tokens) {
      if (t.type === 'TOKEN') {
        tokenizedWordsCount += 1;
      } else {
        literalWordsCount += 1;
      }
    }

    return {
      tokens,
      totalWords: tokens.length,
      tokenizedWordsCount,
      literalWordsCount,
    };
  }

  public static detokenize(tokens: NameWordToken[]): string {
    return detokenizeFullName(tokens);
  }

  public static getDictionarySize(): number {
    return INDONESIAN_NAME_WORDS.length;
  }
}

export { tokenizeFullName, detokenizeFullName };
export type { NameWordToken };
