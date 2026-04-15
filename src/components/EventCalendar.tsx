import { useCallback, useEffect, useMemo, useRef } from 'react';
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

type GridItem =
  | { type: 'month'; key: string; label: string }
  | { type: 'blank'; key: string }
  | { type: 'date'; date: string };

const TAP_THRESHOLD = 10;

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

function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildItems(days: string[]): GridItem[] {
  const items: GridItem[] = [];
  let currentMonth = '';

  for (const date of days) {
    const monthKey = date.slice(0, 7);
    if (monthKey !== currentMonth) {
      items.push({ type: 'month', key: monthKey, label: monthLabel(date) });
      const dow = dayOfWeek(date);
      for (let i = 0; i < dow; i++) {
        items.push({ type: 'blank', key: `blank-${monthKey}-${i}` });
      }
      currentMonth = monthKey;
    }
    items.push({ type: 'date', date });
  }

  return items;
}

export default function EventCalendar({ startDate, endDate, counts, totalPeople, mine, onToggle }: Props) {
  const items = useMemo(() => buildItems(enumerateDates(startDate, endDate)), [startDate, endDate]);

  const dragModeRef = useRef<boolean | null>(null);
  const draggedOverRef = useRef<Set<string>>(new Set());
  const lastTouchAtRef = useRef(0);
  const pendingTapRef = useRef<{ date: string; x: number; y: number } | null>(null);
  const mineRef = useRef(mine);
  const onToggleRef = useRef(onToggle);

  useEffect(() => { mineRef.current = mine; });
  useEffect(() => { onToggleRef.current = onToggle; });

  const applyAt = useCallback((date: string) => {
    const mode = dragModeRef.current;
    if (mode === null) return;
    if (draggedOverRef.current.has(date)) return;
    draggedOverRef.current.add(date);
    if (mineRef.current.has(date) !== mode) {
      onToggleRef.current(date);
    }
  }, []);

  const startDrag = useCallback((date: string) => {
    const willSelect = !mineRef.current.has(date);
    dragModeRef.current = willSelect;
    draggedOverRef.current = new Set([date]);
    onToggleRef.current(date);
  }, []);

  useEffect(() => {
    function end() {
      if (pendingTapRef.current && dragModeRef.current === null) {
        const pending = pendingTapRef.current;
        pendingTapRef.current = null;
        onToggleRef.current(pending.date);
      }
      pendingTapRef.current = null;
      dragModeRef.current = null;
      draggedOverRef.current.clear();
    }
    function touchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;

      if (pendingTapRef.current && dragModeRef.current === null) {
        const dx = touch.clientX - pendingTapRef.current.x;
        const dy = touch.clientY - pendingTapRef.current.y;
        if (Math.hypot(dx, dy) < TAP_THRESHOLD) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          startDrag(pendingTapRef.current.date);
          pendingTapRef.current = null;
        } else {
          pendingTapRef.current = null;
          return;
        }
      }

      if (dragModeRef.current === null) return;

      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const dateEl = el?.closest('[data-date]') as HTMLElement | null;
      if (dateEl) {
        const date = dateEl.getAttribute('data-date');
        if (date) applyAt(date);
      }
      e.preventDefault();
    }
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    window.addEventListener('touchmove', touchMove, { passive: false });
    return () => {
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
      window.removeEventListener('touchmove', touchMove);
    };
  }, [applyAt, startDrag]);

  return (
    <div className="bg-surface rounded-chunk p-5 border border-[var(--fw-soft)] shadow-card select-none">
      <div className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-5">When you free?</div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-ink/50">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid">
        {items.map((item) => {
          if (item.type === 'month') {
            return (
              <div
                key={`m-${item.key}`}
                className="col-span-7 text-sm font-medium text-ink/60 pt-4 pb-1"
              >
                {item.label}
              </div>
            );
          }
          if (item.type === 'blank') {
            return <div key={item.key} />;
          }
          const { date } = item;
          const count = counts.get(date) ?? 0;
          const isMine = mine.has(date);
          const label = `${formatReadable(date)} · ${count} of ${totalPeople} people free${isMine ? ' · picked by you' : ''}`;
          return (
            <button
              key={date}
              type="button"
              role="button"
              data-date={date}
              aria-pressed={isMine}
              aria-label={label}
              onMouseDown={(e) => {
                if (Date.now() - lastTouchAtRef.current < 500) return;
                e.preventDefault();
                startDrag(date);
              }}
              onMouseEnter={() => {
                if (Date.now() - lastTouchAtRef.current < 500) return;
                applyAt(date);
              }}
              onTouchStart={(e) => {
                lastTouchAtRef.current = Date.now();
                const touch = e.touches[0];
                if (!touch) return;
                pendingTapRef.current = { date, x: touch.clientX, y: touch.clientY };
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(date);
                }
              }}
              className={cn(
                'aspect-square rounded-chunk relative flex items-center justify-center text-sm font-semibold transition-transform active:scale-95',
                isMine ? 'text-white' : heatClass(count, totalPeople),
              )}
              style={isMine ? { background: 'var(--fw-accent)' } : undefined}
            >
              <span>{Number(date.slice(-2))}</span>
              {count > 0 && (
                <span className="absolute bottom-1 right-1 text-[9px] font-semibold opacity-60">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
