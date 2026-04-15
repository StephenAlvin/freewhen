import type { CSSProperties } from 'react';
import { useMemo } from 'react';

interface Props { emojis: string[]; density?: number; }

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Drifter {
  key: string; emoji: string;
  top: string; left: string;
  size: number;
  dx: number; dy: number; dr: number;
  duration: number; delay: number;
}

export default function DriftingEmojis({ emojis, density = 1 }: Props) {
  const reduced = prefersReducedMotion();
  const drifters = useMemo<Drifter[]>(() => {
    if (!emojis.length || reduced) return [];
    const count = Math.round(emojis.length * 3 * density);
    const aspect =
      typeof window !== 'undefined' && window.innerHeight
        ? window.innerWidth / window.innerHeight
        : 16 / 9;
    const cols = Math.max(1, Math.round(Math.sqrt(count * aspect)));
    const rows = Math.max(1, Math.ceil(count / cols));
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    const jitter = 0.55;
    const indices = Array.from({ length: cols * rows }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    return indices.map((cell, i) => {
      const cx = cell % cols;
      const cy = Math.floor(cell / cols);
      const left = (cx + 0.5 + (Math.random() - 0.5) * jitter) * cellW;
      const top = (cy + 0.5 + (Math.random() - 0.5) * jitter) * cellH;
      return {
        key: `d-${i}`,
        emoji: emojis[i % emojis.length],
        top: `${Math.max(2, Math.min(98, top))}%`,
        left: `${Math.max(2, Math.min(98, left))}%`,
        size: 28 + Math.random() * 24,
        dx: (Math.random() - 0.5) * 40,
        dy: (Math.random() - 0.5) * 40,
        dr: (Math.random() - 0.5) * 16,
        duration: 18 + Math.random() * 14,
        delay: -Math.random() * 20,
      };
    });
  }, [emojis, density, reduced]);

  if (reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {drifters.map((d) => (
        <span
          key={d.key}
          className="fw-drifter absolute"
          style={{
            top: d.top,
            left: d.left,
            fontSize: d.size,
            opacity: 0.18,
            ['--fw-dx' as string]: `${d.dx}px`,
            ['--fw-dy' as string]: `${d.dy}px`,
            ['--fw-dr' as string]: `${d.dr}deg`,
            ['--fw-dur' as string]: `${d.duration}s`,
            ['--fw-delay' as string]: `${d.delay}s`,
          } as CSSProperties}
        >
          {d.emoji}
        </span>
      ))}
    </div>
  );
}
