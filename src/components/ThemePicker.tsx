import { themes } from '@/themes';
import { THEME_IDS, type ThemeId } from '@/types';
import { cn } from '@/lib/cn';

interface Props { value: ThemeId; onChange: (id: ThemeId) => void; className?: string; }

export default function ThemePicker({ value, onChange, className }: Props) {
  return (
    <div
      className={cn('grid grid-cols-4 gap-2 md:grid-cols-1 md:gap-2', className)}
      role="radiogroup"
      aria-label="Choose a theme"
    >
      {THEME_IDS.map((id) => {
        const t = themes[id];
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-2xl border-2 bg-surface px-3 py-3 transition-all',
              'md:flex-row md:gap-3 md:justify-start md:text-left md:px-4',
              active ? 'border-brand -translate-y-0.5 shadow-card' : 'border-transparent hover:border-soft',
            )}
          >
            <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-ink leading-none">{t.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-ink/50 mt-0.5">{t.tagline}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
