import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> { error?: string; }

export default function TitleInput({ error, className, ...rest }: Props) {
  return (
    <div className="w-full">
      <input
        type="text"
        className={cn(
          'block w-full px-5 py-4 rounded-2xl border-2 border-dashed bg-surface',
          'text-lg font-fredoka text-ink placeholder:text-ink/30',
          'focus:outline-none focus:ring-4 focus:ring-soft/50',
          error ? 'border-red-400' : 'border-[var(--fw-soft)]',
          className,
        )}
        maxLength={120}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-red-500 pl-2">{error}</p>}
    </div>
  );
}
