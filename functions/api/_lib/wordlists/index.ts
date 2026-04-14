import type { ThemeId } from '../../../../src/types';
import * as eating from './eating';
import * as hiking from './hiking';
import * as shopping from './shopping';
import * as games from './games';

export const wordlists: Record<ThemeId, { adjectives: string[]; nouns: string[] }> = {
  eating, hiking, shopping, games,
};
