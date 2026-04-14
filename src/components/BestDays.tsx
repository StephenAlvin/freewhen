interface Ranked { date: string; count: number; }
interface Props { ranked: Ranked[]; total: number; }

function formatReadable(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function BestDays({ ranked, total }: Props) {
  return (
    <div className="bg-surface rounded-chunk p-5 border border-[var(--fw-soft)] shadow-card">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink/50 mb-3">Best days so far 🏆</div>
      {ranked.length === 0 && <p className="text-sm text-ink/50">Be the first to pick some days!</p>}
      <div className="flex flex-col gap-2">
        {ranked.slice(0, 3).map((r, i) => {
          const everyone = r.count === total && total > 0;
          return (
            <div
              key={r.date}
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{
                background: i === 0 ? 'var(--fw-heat-1)' : '#fff7ed',
                border: i === 0 ? '1.5px solid var(--fw-heat-3)' : 'none',
              }}
            >
              <div>
                <div className="font-semibold text-ink text-sm">{formatReadable(r.date)}</div>
                {everyone && <div className="text-[10px] text-ink/50">Everyone free! 🎊</div>}
              </div>
              <div
                className="text-white px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: 'var(--fw-heat-3)' }}
              >
                {r.count}/{total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
