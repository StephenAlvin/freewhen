import type { ThemeConfig } from './index';

export const eating: ThemeConfig = {
  id: 'eating', label: 'Eating', emoji: '🍽', tagline: 'yum',
  palette: {
    bg1: '#fff8ee', bg2: '#fff1e6',
    primary: '#f97316', primaryDark: '#c2410c',
    accent: '#be185d', ink: '#7c2d12', brand: '#be6b3a', soft: '#fde68a',
    heat: ['#fef3c7','#fde68a','#fbbf24','#f59e0b','#d97706'],
  },
  drifters: ['🥐','🧁','☕','🍓','🍣','🍰','🍜'],
  buttonEmoji: '🥐', confettiEmoji: '🥐',
};
