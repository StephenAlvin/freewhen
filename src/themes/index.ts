import type { ThemeId } from '@/types';
import { eating } from './eating';
import { hiking } from './hiking';
import { shopping } from './shopping';
import { games } from './games';

export interface Palette {
  bg1: string; bg2: string;
  primary: string; primaryDark: string;
  accent: string; ink: string; brand: string; soft: string;
  heat: [string, string, string, string, string];
}

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  emoji: string;
  tagline: string;
  palette: Palette;
  drifters: string[];
  buttonEmoji: string;
  confettiEmoji: string;
}

export const themes: Record<ThemeId, ThemeConfig> = { eating, hiking, shopping, games };

export function getTheme(id: ThemeId): ThemeConfig { return themes[id]; }

export function applyThemeVars(el: HTMLElement, theme: ThemeConfig) {
  const p = theme.palette;
  el.style.setProperty('--fw-brand', p.brand);
  el.style.setProperty('--fw-ink', p.ink);
  el.style.setProperty('--fw-soft', p.soft);
  el.style.setProperty('--fw-accent', p.accent);
  el.style.setProperty('--fw-bg1', p.bg1);
  el.style.setProperty('--fw-bg2', p.bg2);
  el.style.setProperty('--fw-primary', p.primary);
  el.style.setProperty('--fw-primary-dark', p.primaryDark);
  p.heat.forEach((color, i) => el.style.setProperty(`--fw-heat-${i}`, color));
}
