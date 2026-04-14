import { cn } from '@/lib/cn';

interface Props { names: string[]; youName?: string; }

export default function ParticipantChips({ names, youName }: Props) {
  return (
    <div className="bg-surface rounded-chunk p-5 border border-[var(--fw-soft)] shadow-card">
      <div className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Who's in 🧡</div>
      <div className="flex flex-wrap gap-1.5">
        {names.map((name) => {
          const isYou = !!youName && name.toLowerCase() === youName.toLowerCase();
          return (
            <span
              key={name}
              className={cn(
                'px-3 py-1 rounded-chunk text-xs border',
                isYou
                  ? 'bg-[var(--fw-bg2)] border-2 border-[var(--fw-accent)] font-semibold text-ink'
                  : 'bg-white border-[var(--fw-soft)] text-ink',
              )}
            >
              {isYou ? 'you' : name}
            </span>
          );
        })}
        {names.length === 0 && <span className="text-sm text-ink/50">Nobody yet</span>}
      </div>
    </div>
  );
}
