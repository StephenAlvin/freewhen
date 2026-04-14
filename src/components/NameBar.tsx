import { cn } from '@/lib/cn';
import type { ChangeEventHandler } from 'react';

interface Props {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

export default function NameBar({ value, onChange, className }: Props) {
  return (
    <div className={cn(
      'flex items-center gap-3 bg-surface rounded-chunk px-4 py-3 border-2 border-[var(--fw-soft)] shadow-card',
      className,
    )}>
      <span className="text-sm font-semibold uppercase tracking-wide text-ink/50 flex-shrink-0">Who are you?</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        maxLength={40}
        className="flex-1 bg-transparent outline-none text-base font-fredoka text-ink"
        placeholder="your name"
        aria-label="Your name"
      />
    </div>
  );
}
