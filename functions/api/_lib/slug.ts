import type { ThemeId } from '../../../src/types';
import { wordlists } from './wordlists';

export const SLUG_RE = /^[a-z]+-[a-z]+-[1-9][0-9]$/;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSlug(theme: ThemeId): string {
  const { adjectives, nouns } = wordlists[theme];
  const adj = pick(adjectives);
  const noun = pick(nouns);
  const num = 10 + Math.floor(Math.random() * 90);
  return `${adj}-${noun}-${num}`;
}
