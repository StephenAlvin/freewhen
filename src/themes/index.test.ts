import { describe, it, expect } from 'vitest';
import { themes, getTheme, applyThemeVars } from './index';
import type { ThemeId } from '@/types';

describe('themes registry', () => {
  const ids: ThemeId[] = ['eating','hiking','shopping','games'];
  it.each(ids)('has a valid config for %s', (id) => {
    const t = getTheme(id);
    expect(t.id).toBe(id);
    expect(t.drifters.length).toBeGreaterThan(0);
    expect(t.palette.heat).toHaveLength(5);
  });
  it('unique primary colors', () => {
    const primaries = new Set(Object.values(themes).map((t) => t.palette.primary));
    expect(primaries.size).toBe(4);
  });
  it('applyThemeVars sets CSS variables', () => {
    const el = document.createElement('div');
    applyThemeVars(el, themes.eating);
    expect(el.style.getPropertyValue('--fw-brand')).toBe('#be6b3a');
    expect(el.style.getPropertyValue('--fw-primary')).toBe('#f97316');
    expect(el.style.getPropertyValue('--fw-heat-3')).toBe('#f59e0b');
  });
});
