import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { fredoka: ['Fredoka', 'system-ui', 'sans-serif'] },
      colors: {
        brand: 'var(--fw-brand)',
        ink: 'var(--fw-ink)',
        soft: 'var(--fw-soft)',
        accent: 'var(--fw-accent)',
        surface: '#ffffff',
      },
      borderRadius: { chunk: '22px' },
      boxShadow: {
        card: '0 4px 14px rgba(190,107,58,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
