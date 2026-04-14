import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ThemePicker from '@/components/ThemePicker';
import TitleInput from '@/components/TitleInput';
import Button from '@/components/Button';
import type { ThemeId } from '@/types';
import { DEFAULT_RANGE_DAYS } from '@/types';
import { toIsoDate } from '@/lib/dates';
import { createEvent } from '@/lib/api';

export default function HomePage() {
  const [theme, setTheme] = useState<ThemeId>('eating');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const canSubmit = title.trim().length > 0 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + DEFAULT_RANGE_DAYS - 1);
      const event = await createEvent({
        title, theme,
        startDate: toIsoDate(today),
        endDate: toIsoDate(end),
      });
      nav(`/${event.slug}`);
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
          <Link to="/" className="inline-flex items-center gap-2 text-brand font-semibold text-lg hover:opacity-80 transition-opacity">
            freewhen.me
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink">when r u free?</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-2 pl-1">Pick a theme</div>
            <ThemePicker value={theme} onChange={setTheme} />
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-2 pl-1">Name the event</div>
            <TitleInput
              placeholder="What are we planning?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Event title"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-ink/50 pl-1 flex-1 min-w-0">
              We'll open the next {DEFAULT_RANGE_DAYS} days for people to mark their availability.
            </p>
            <Button type="submit" disabled={!canSubmit} loading={loading} className="w-full sm:w-auto">
              Create Event
            </Button>
          </div>
        </form>
      </main>
    </Layout>
  );
}
