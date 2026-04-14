import type { ThemeConfig } from './index';

export const hiking: ThemeConfig = {
  id: 'hiking', label: 'Hiking', emoji: '🥾', tagline: 'outdoors',
  palette: {
    bg1: '#f0fdf4', bg2: '#ecfccb',
    primary: '#16a34a', primaryDark: '#14532d',
    accent: '#15803d', ink: '#14532d', brand: '#166534', soft: '#bbf7d0',
    heat: ['#ecfccb','#d9f99d','#bef264','#84cc16','#4d7c0f'],
  },
  drifters: ['🌲','⛰','☀️','🌿','🍂'],
  buttonEmoji: '🥾', confettiEmoji: '🌿',
};
