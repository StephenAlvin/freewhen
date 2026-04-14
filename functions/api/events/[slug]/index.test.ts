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

beforeEach(async () => { await applyMigrations(env.DB); });

describe('GET /api/events/:slug', () => {
  it('returns event with empty submissions', async () => {
    const slug = await createEvent();
    const res = await SELF.fetch(`https://example.com/api/events/${slug}`);
    expect(res.status).toBe(200);
    const body = await res.json() as { event: { slug: string }; submissions: unknown[] };
    expect(body.event.slug).toBe(slug);
    expect(body.submissions).toEqual([]);
  });

  it('404 for unknown slug', async () => {
    const res = await SELF.fetch('https://example.com/api/events/not-a-real-slug-99');
    expect(res.status).toBe(404);
  });
});
