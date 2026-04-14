import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import EventCalendar from '@/components/EventCalendar';
import NameBar from '@/components/NameBar';
import BestDays from '@/components/BestDays';
import ParticipantChips from '@/components/ParticipantChips';
import Button from '@/components/Button';
import ShareCard from '@/components/ShareCard';
import ConfettiBurst from '@/components/ConfettiBurst';
import NotFound from '@/components/NotFound';
import { fetchEvent, upsertSubmission, ApiError } from '@/lib/api';
import type { EventPayload } from '@/types';
import { getTheme } from '@/themes';

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const justCreated = searchParams.get('just-created') === '1';
  const nav = useNavigate();

  const [data, setData] = useState<EventPayload | null>(null);
  const [status, setStatus] = useState<'loading'|'ok'|'notfound'|'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
    if (!slug || !name.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await upsertSubmission(slug, { name, dates: [...mine].sort() });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  function dismissShare() {
    searchParams.delete('just-created');
    setSearchParams(searchParams, { replace: true });
  }

  if (status === 'loading') {
    return <Layout theme="eating"><main className="flex items-center justify-center min-h-screen"><p className="text-ink/50">Loading…</p></main></Layout>;
  }
  if (status === 'notfound') return <NotFound />;
  if (status === 'error' || !data) {
    return <Layout theme="eating"><main className="flex items-center justify-center min-h-screen"><p className="text-red-500">Something went wrong: {errorMsg}</p></main></Layout>;
  }

  const t = getTheme(data.event.theme);
  const shareUrl = `${window.location.origin}/${data.event.slug}`;

  if (justCreated) {
    return (
      <Layout theme={data.event.theme}>
        <main className="max-w-3xl mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl font-bold mb-2 text-ink">Your gathering is ready to share! 🎉</h1>
          <p className="text-ink/60 mb-6">Send this link to your people. They don't need an account.</p>
          <ShareCard url={shareUrl} />
          <div className="mt-6">
            <Button onClick={() => { dismissShare(); nav(`/${data.event.slug}`, { replace: true }); }}>
              Continue to event →
            </Button>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout theme={data.event.theme}>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink">{data.event.title}</h1>
            <p className="text-sm text-ink/50 mt-1">
              🗓 {fmt(data.event.startDate)} – {fmt(data.event.endDate)} · {totalPeople} people
            </p>
          </div>
          <div className="flex items-center gap-2 text-brand font-semibold text-sm md:text-base">
            <span className="text-xl">🍔</span> freewhen
          </div>
        </div>

        <div className="mb-5">
          <NameBar value={name} onChange={(e) => setName(e.target.value)} emoji={t.emoji} />
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
            <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
              {errorMsg && <span className="text-sm text-red-500">{errorMsg}</span>}
              <div className="ml-auto w-full sm:w-auto">
                <Button
                  onClick={submit}
                  loading={submitting}
                  disabled={!name.trim()}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  Submit {t.buttonEmoji}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <BestDays ranked={ranked} total={totalPeople} />
            <ParticipantChips names={names} youName={name} />
          </div>
        </div>

        <ConfettiBurst show={showConfetti} emoji={t.confettiEmoji} />
      </main>
    </Layout>
  );
}
