import type { ThemeConfig } from './index';

export const games: ThemeConfig = {
  id: 'games', label: 'Games', emoji: '🎮', tagline: 'play',
  palette: {
    bg1: '#f5f3ff', bg2: '#e0f2fe',
    primary: '#8b5cf6', primaryDark: '#5b21b6',
    accent: '#7c3aed', ink: '#4c1d95', brand: '#5b21b6', soft: '#ddd6fe',
    heat: ['#ddd6fe','#c4b5fd','#a78bfa','#7c3aed','#5b21b6'],
  },
  drifters: ['🎮','🕹','🎲','🪄','👾','🧩'],
  buttonEmoji: '🎮', confettiEmoji: '✨',
};
