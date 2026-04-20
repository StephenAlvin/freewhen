import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import TopActions from '@/components/TopActions';
import EventCalendar from '@/components/EventCalendar';
import NameBar from '@/components/NameBar';
import BestDays from '@/components/BestDays';
import ParticipantChips from '@/components/ParticipantChips';
import Button from '@/components/Button';
import ShareCard from '@/components/ShareCard';
import ConfettiBurst from '@/components/ConfettiBurst';
import NotFound from '@/components/NotFound';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { fetchEvent, upsertSubmission, ApiError } from '@/lib/api';
import type { EventPayload, ThemeId } from '@/types';
import { getTheme } from '@/themes';

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<EventPayload | null>(null);
  const [status, setStatus] = useState<'loading'|'ok'|'notfound'|'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [themeOverride, setThemeOverride] = useState<ThemeId | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setStatus('loading');
    try {
      const payload = await fetchEvent(slug);
      setData(payload);
      setStatus('ok');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setStatus('notfound');
      else {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!data) return;
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { setMine(new Set()); return; }
    const match = data.submissions.find((s) => s.name.trim().toLowerCase() === trimmed);
    if (match) setMine(new Set(match.dates));
  }, [name, data]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    if (!data) return m;
    for (const s of data.submissions) for (const d of s.dates) m.set(d, (m.get(d) ?? 0) + 1);
    return m;
  }, [data]);

  const totalPeople = data?.submissions.length ?? 0;

  const ranked = useMemo(() => {
    const arr: { date: string; count: number }[] = [];
    counts.forEach((count, date) => arr.push({ date, count }));
    arr.sort((a, b) => (b.count - a.count) || (a.date < b.date ? -1 : 1));
    return arr;
  }, [counts]);

  const names = useMemo(() => (data?.submissions.map((s) => s.name) ?? []), [data]);

  function toggle(date: string) {
    setMine((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  async function submit() {
    if (!slug || !name.trim() || mine.size === 0) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await upsertSubmission(slug, { name, dates: [...mine].sort() });
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
      } catch {}
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return <Layout theme="eating"><main className="flex items-center justify-center min-h-screen"><p className="text-ink/50">Loading…</p></main></Layout>;
  }
  if (status === 'notfound') return <NotFound />;
  if (status === 'error' || !data) {
    return <Layout theme="eating"><main className="flex items-center justify-center min-h-screen"><p className="text-red-500">Something went wrong: {errorMsg}</p></main></Layout>;
  }

  const activeTheme: ThemeId = themeOverride ?? data.event.theme;
  const t = getTheme(activeTheme);
  const shareUrl = `${window.location.origin}/${data.event.slug}`;

  return (
    <Layout theme={activeTheme}>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink">{data.event.title}</h1>
            <p className="text-sm text-ink/50 mt-1">
              🗓 {fmt(data.event.startDate)} – {fmt(data.event.endDate)} · {totalPeople} people
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeSwitcher
              value={activeTheme}
              onChange={(id) => setThemeOverride(id)}
            />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-ink shadow-md ring-1 ring-black/5 hover:bg-white hover:shadow-lg transition"
            >
              <span aria-hidden>＋</span>
              <span>New event</span>
            </Link>
          </div>
        </div>

        <div className="mb-5">
          <ShareCard url={shareUrl} />
        </div>

        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <div>
            <EventCalendar
              startDate={data.event.startDate}
              endDate={data.event.endDate}
              counts={counts}
              totalPeople={totalPeople}
              mine={mine}
              onToggle={toggle}
            />
          </div>

          <div className="space-y-4">
            <NameBar value={name} onChange={(e) => setName(e.target.value)} />
            <BestDays ranked={ranked} total={totalPeople} />
            <ParticipantChips names={names} youName={name} />
            <div>
              {errorMsg && <p className="text-sm text-red-500 mb-2">{errorMsg}</p>}
              <Button
                onClick={submit}
                loading={submitting}
                disabled={!name.trim() || mine.size === 0}
                variant="primary"
                className="w-full"
              >
                Submit & Copy Link
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <TopActions />
        </div>

        <ConfettiBurst show={showConfetti} emoji={t.confettiEmoji} />
      </main>
    </Layout>
  );
}
