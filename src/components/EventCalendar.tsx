import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { enumerateDates } from '@/lib/dates';

interface Props {
  startDate: string;
  endDate: string;
  counts: Map<string, number>;
  totalPeople: number;
  mine: Set<string>;
  onToggle: (date: string) => void;
}

function heatClass(count: number, total: number): string {
  if (total === 0 || count === 0) return 'bg-[var(--fw-heat-0)]';
  const ratio = count / total;
  if (ratio < 0.25) return 'bg-[var(--fw-heat-1)]';
  if (ratio < 0.5) return 'bg-[var(--fw-heat-2)]';
  if (ratio < 0.75) return 'bg-[var(--fw-heat-3)] text-white';
  return 'bg-[var(--fw-heat-4)] text-white';
}

function formatReadable(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function dayOfWeek(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export default function EventCalendar({ startDate, endDate, counts, totalPeople, mine, onToggle }: Props) {
  const days = useMemo(() => enumerateDates(startDate, endDate), [startDate, endDate]);
  const leadingBlanks = dayOfWeek(startDate);
  const trailingBlanks = (7 - ((leadingBlanks + days.length) % 7)) % 7;

  return (
    <div className="bg-surface rounded-chunk p-5 border border-[var(--fw-soft)] shadow-card">
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-ink/50">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5" role="grid">
        {Array.from({ length: leadingBlanks }, (_, i) => <div key={`lb-${i}`} />)}
        {days.map((date) => {
          const count = counts.get(date) ?? 0;
          const isMine = mine.has(date);
          const label = `${formatReadable(date)} · ${count} of ${totalPeople} people free${isMine ? ' · picked by you' : ''}`;
          return (
            <button
              key={date}
              type="button"
              role="button"
              aria-pressed={isMine}
              aria-label={label}
              onClick={() => onToggle(date)}
              className={cn(
                'aspect-square rounded-xl relative flex items-center justify-center text-sm font-semibold transition-transform hover:scale-105 active:scale-95',
                heatClass(count, totalPeople),
              )}
            >
              <span>{Number(date.slice(-2))}</span>
              {count > 0 && (
                <span className="absolute bottom-1 right-1 text-[9px] font-semibold opacity-60">{count}</span>
              )}
              {isMine && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: 'var(--fw-accent)', boxShadow: '0 0 0 2px white' }}
                />
              )}
            </button>
          );
        })}
        {Array.from({ length: trailingBlanks }, (_, i) => <div key={`tb-${i}`} />)}
      </div>
    </div>
  );
}
