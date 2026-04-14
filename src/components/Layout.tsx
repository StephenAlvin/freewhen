import { type ReactNode, useEffect, useRef } from 'react';
import { applyThemeVars, getTheme } from '@/themes';
import type { ThemeId } from '@/types';
import DriftingEmojis from './DriftingEmojis';

interface Props { theme?: ThemeId; children: ReactNode; }

export default function Layout({ theme = 'eating', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const t = getTheme(theme);

  useEffect(() => { if (ref.current) applyThemeVars(ref.current, t); }, [t]);

  return (
    <div
      ref={ref}
      className="relative min-h-screen font-fredoka"
      style={{
        background:
          'radial-gradient(circle at 12% 22%, rgba(255,255,255,0.4) 0%, transparent 32%), linear-gradient(135deg, var(--fw-bg1) 0%, var(--fw-bg2) 100%)',
        color: 'var(--fw-ink)',
      }}
    >
      <DriftingEmojis emojis={t.drifters} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
