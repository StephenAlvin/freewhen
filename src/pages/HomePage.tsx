import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ThemePicker from '@/components/ThemePicker';
import TitleInput from '@/components/TitleInput';
import RangePicker, { type DateRange } from '@/components/RangePicker';
import Button from '@/components/Button';
import type { ThemeId } from '@/types';
import { MAX_RANGE_DAYS } from '@/types';
import { toIsoDate, daysBetween } from '@/lib/dates';
import { createEvent } from '@/lib/api';
import { getTheme } from '@/themes';

export default function HomePage() {
  const [theme, setTheme] = useState<ThemeId>('eating');
  const [title, setTitle] = useState('');
  const [range, setRange] = useState<DateRange | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const tConfig = getTheme(theme);
  const hasRange = Boolean(range?.from && range.to);
  const rangeTooLong = hasRange
    ? daysBetween(toIsoDate(range!.from!), toIsoDate(range!.to!)) > MAX_RANGE_DAYS
    : false;
  const canSubmit = title.trim().length > 0 && hasRange && !rangeTooLong && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !range?.from || !range.to) return;
    setLoading(true);
    setError(null);
    try {
      const event = await createEvent({
        title, theme,
        startDate: toIsoDate(range.from),
        endDate: toIsoDate(range.to),
      });
      nav(`/${event.slug}?just-created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout theme={theme}>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-brand font-semibold text-lg">
            <span className="text-2xl">🍔</span> freewhen
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink">when r u free? 🧡</h1>
          <p className="text-sm text-ink/60 mt-1">Pick a vibe, a range, and share the link.</p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-[200px,1fr]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink/50 mb-2 pl-1">Choose your vibe</div>
            <ThemePicker value={theme} onChange={setTheme} />
          </div>

          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink/50 mb-2 pl-1">Name it</div>
              <TitleInput
                placeholder="What are we planning? 🍽"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Event title"
              />
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink/50 mb-2 pl-1">Pick a date range</div>
              <RangePicker value={range} onChange={setRange} />
              {rangeTooLong && (
                <p className="mt-2 text-sm text-red-500 pl-2">Ranges must be {MAX_RANGE_DAYS} days or fewer.</p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={!canSubmit} loading={loading} className="w-full sm:w-auto">
                Create Event
              </Button>
            </div>
          </div>
        </form>
      </main>
    </Layout>
  );
}
