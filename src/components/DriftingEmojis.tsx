import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props { emojis: string[]; density?: number; }

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Drifter {
  key: string; emoji: string;
  top: string; left: string;
  size: number; duration: number; delay: number;
}

export default function DriftingEmojis({ emojis, density = 1 }: Props) {
  const reduced = prefersReducedMotion();
  const drifters = useMemo<Drifter[]>(() => {
    if (!emojis.length || reduced) return [];
    const count = Math.round(emojis.length * 1.5 * density);
    return Array.from({ length: count }, (_, i) => ({
      key: `d-${i}`,
      emoji: emojis[i % emojis.length],
      top: `${5 + Math.random() * 90}%`,
      left: `${5 + Math.random() * 90}%`,
      size: 28 + Math.random() * 24,
      duration: 12 + Math.random() * 10,
      delay: Math.random() * 6,
    }));
  }, [emojis, density, reduced]);

  if (reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {drifters.map((d) => (
        <motion.span
          key={d.key}
          className="absolute"
          style={{ top: d.top, left: d.left, fontSize: d.size, opacity: 0.18 }}
          animate={{ x: [0, 12, -8, 0], y: [0, -14, 6, 0], rotate: [0, 8, -6, 0] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {d.emoji}
        </motion.span>
      ))}
    </div>
  );
}
