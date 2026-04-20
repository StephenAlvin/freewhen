import { themes } from '@/themes';
import { THEME_IDS, type ThemeId } from '@/types';
import { cn } from '@/lib/cn';

interface Props {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  className?: string;
}

export default function ThemeSwitcher({ value, onChange, className }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Switch theme"
      className={cn('inline-flex items-center gap-1', className)}
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
            aria-label={t.label}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full text-lg transition',
              active
                ? 'bg-white/90 backdrop-blur shadow-md ring-1 ring-black/5'
                : 'bg-transparent hover:bg-white/70',
            )}
          >
            <span aria-hidden="true">{t.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
