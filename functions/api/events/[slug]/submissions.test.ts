import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyMigrations } from '../../../../tests/helpers/migrations';

async function createEvent(): Promise<string> {
  const res = await SELF.fetch('https://example.com/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Brunch', theme: 'eating', startDate: '2026-04-20', endDate: '2026-04-25' }),
  });
  const body = await res.json() as { slug: string };
  return body.slug;
}

async function submit(slug: string, name: string, dates: string[]) {
  return SELF.fetch(`https://example.com/api/events/${slug}/submissions`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, dates }),
  });
}

async function fetchEvent(slug: string) {
  const res = await SELF.fetch(`https://example.com/api/events/${slug}`);
  return res.json() as Promise<{ submissions: { name: string; dates: string[] }[] }>;
}

beforeEach(async () => { await applyMigrations(env.DB); });

describe('PUT /api/events/:slug/submissions', () => {
  it('creates a submission', async () => {
    const slug = await createEvent();
    const res = await submit(slug, 'Sarah', ['2026-04-22','2026-04-24']);
    expect(res.status).toBe(200);
    const { submissions } = await fetchEvent(slug);
    expect(submissions).toHaveLength(1);
    expect(submissions[0].name).toBe('Sarah');
    expect(submissions[0].dates).toEqual(['2026-04-22','2026-04-24']);
  });

  it('overwrites on second submit with same name', async () => {
    const slug = await createEvent();
    await submit(slug, 'Sarah', ['2026-04-22']);
    await submit(slug, 'Sarah', ['2026-04-23','2026-04-24']);
    const { submissions } = await fetchEvent(slug);
    expect(submissions).toHaveLength(1);
    expect(submissions[0].dates).toEqual(['2026-04-23','2026-04-24']);
  });

  it('silently drops out-of-range dates', async () => {
    const slug = await createEvent();
    await submit(slug, 'Sarah', ['2026-04-19','2026-04-22','2026-04-26']);
    const { submissions } = await fetchEvent(slug);
    expect(submissions[0].dates).toEqual(['2026-04-22']);
  });

  it('404 for unknown slug', async () => {
    const res = await submit('not-a-real-slug-99', 'Sarah', ['2026-04-22']);
    expect(res.status).toBe(404);
  });

  it('400 for empty name', async () => {
    const slug = await createEvent();
    const res = await submit(slug, '', ['2026-04-22']);
    expect(res.status).toBe(400);
  });
});
