import { cn } from '@/lib/cn';
import type { ChangeEventHandler } from 'react';

interface Props {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  emoji?: string;
  className?: string;
}

export default function NameBar({ value, onChange, emoji = '🐰', className }: Props) {
  return (
    <div className={cn(
      'flex items-center gap-3 bg-surface rounded-full px-4 py-3 border-2 border-[var(--fw-soft)] shadow-card',
      className,
    )}>
      <span aria-hidden="true" className="w-8 h-8 rounded-full flex items-center justify-center text-base"
            style={{ background: 'var(--fw-accent)' }}>
        {emoji}
      </span>
      <span className="text-xs text-ink/50 font-medium flex-shrink-0">who are you?</span>
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
