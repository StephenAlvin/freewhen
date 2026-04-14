import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Props { show: boolean; emoji: string; count?: number; }

export default function ConfettiBurst({ show, emoji, count = 18 }: Props) {
  const reduced = prefersReducedMotion();
  const particles = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      key: i,
      tx: (Math.random() - 0.5) * 400,
      ty: -120 - Math.random() * 240,
      rotate: (Math.random() - 0.5) * 360,
      delay: Math.random() * 0.15,
    })),
    [count],
  );

  if (reduced) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden="true">
          {particles.map((p) => (
            <motion.span
              key={p.key}
              initial={{ opacity: 1, scale: 0.4, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, scale: 1, x: p.tx, y: p.ty, rotate: p.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, delay: p.delay, ease: 'easeOut' }}
              className="absolute text-3xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
