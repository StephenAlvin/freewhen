import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>;

interface Props extends NativeButtonProps {
  variant?: 'primary' | 'soft';
  loading?: boolean;
}

export default function Button({ variant = 'primary', loading = false, disabled, children, className, ...rest }: Props) {
  const isDisabled = disabled || loading;
  const base = 'inline-flex items-center justify-center gap-2 rounded-chunk font-semibold font-fredoka transition-all select-none';
  const primary = 'px-6 py-2.5 text-white text-base hover:brightness-110 active:brightness-95';
  const soft = 'px-5 py-2.5 bg-surface text-brand border border-soft text-sm hover:bg-[var(--fw-bg2)] active:brightness-95';

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={cn(
        base,
        variant === 'primary' && primary,
        variant === 'soft' && soft,
        isDisabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
      style={variant === 'primary' ? { background: 'var(--fw-primary)' } : undefined}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? <>{children} …</> : children}
    </motion.button>
  );
}
