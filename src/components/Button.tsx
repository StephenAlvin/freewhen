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
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold font-fredoka transition-transform select-none';
  const primary = 'px-8 py-4 text-white text-lg shadow-[0_4px_0_var(--fw-primary-dark),0_8px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0';
  const soft = 'px-5 py-3 bg-surface text-brand border border-soft shadow-card hover:-translate-y-0.5 active:translate-y-0';

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        base,
        variant === 'primary' && primary,
        variant === 'soft' && soft,
        isDisabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
      style={variant === 'primary' ? {
        background: `linear-gradient(180deg, var(--fw-primary) 0%, var(--fw-primary-dark) 100%)`,
      } : undefined}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? <>{children} …</> : children}
    </motion.button>
  );
}
