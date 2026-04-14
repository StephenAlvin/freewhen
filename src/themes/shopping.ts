import type { ThemeConfig } from './index';

export const shopping: ThemeConfig = {
  id: 'shopping', label: 'Shopping', emoji: '🛍', tagline: 'retail',
  palette: {
    bg1: '#fdf4ff', bg2: '#fce7f3',
    primary: '#ec4899', primaryDark: '#9d174d',
    accent: '#be185d', ink: '#831843', brand: '#9f1239', soft: '#fbcfe8',
    heat: ['#fbcfe8','#f9a8d4','#ec4899','#be185d','#831843'],
  },
  drifters: ['👜','👗','👠','💄','🛍'],
  buttonEmoji: '🛍', confettiEmoji: '💕',
};
