import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays } from 'date-fns';
import Layout from '@/components/Layout';
import TopActions from '@/components/TopActions';
import ThemePicker from '@/components/ThemePicker';
import TitleInput from '@/components/TitleInput';
import Button from '@/components/Button';
import RangeControl from '@/components/RangeControl';
import type { ThemeId } from '@/types';
import { DEFAULT_RANGE_DAYS } from '@/types';
import { toIsoDate } from '@/lib/dates';
import { createEvent } from '@/lib/api';

export default function HomePage() {
  const [theme, setTheme] = useState<ThemeId>('eating');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<string>(() => toIsoDate(new Date()));
  const [endDate, setEndDate] = useState<string>(() => toIsoDate(addDays(new Date(), DEFAULT_RANGE_DAYS - 1)));
  const [rangeValid, setRangeValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const canSubmit = title.trim().length > 0 && rangeValid && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const event = await createEvent({ title, theme, startDate, endDate });
      nav(`/${event.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const sectionLabel = 'text-sm font-semibold uppercase tracking-wide text-ink/50 mb-2 pl-1';

  return (
    <Layout theme={theme}>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink">when r u free?</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <div className={sectionLabel}>Pick a theme</div>
            <ThemePicker value={theme} onChange={setTheme} />
          </div>

          <div>
            <div className={sectionLabel}>Name the event</div>
            <TitleInput
              placeholder="What are we planning?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Event title"
            />
          </div>

          <div>
            <div className={sectionLabel}>Which date-range might work?</div>
            <RangeControl
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
              onValidityChange={setRangeValid}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit} loading={loading} className="w-full sm:w-auto">
              Create Event
            </Button>
          </div>
        </form>

        <div className="mt-10 flex justify-center">
          <TopActions />
        </div>
      </main>
    </Layout>
  );
}
