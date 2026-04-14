import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyMigrations } from '../../../tests/helpers/migrations';

beforeEach(async () => { await applyMigrations(env.DB); });

describe('POST /api/events', () => {
  it('creates an event and returns a slug', async () => {
    const res = await SELF.fetch('https://example.com/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Brunch', theme: 'eating', startDate: '2026-04-20', endDate: '2026-04-25' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { slug: string; title: string; theme: string };
    expect(body.slug).toMatch(/^[a-z]+-[a-z]+-[1-9][0-9]$/);
    expect(body.title).toBe('Brunch');
    expect(body.theme).toBe('eating');
  });

  it('rejects invalid input with 400', async () => {
    const res = await SELF.fetch('https://example.com/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '', theme: 'eating', startDate: '2026-04-20', endDate: '2026-04-25' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects range > 90 days', async () => {
    const res = await SELF.fetch('https://example.com/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Long', theme: 'eating', startDate: '2026-01-01', endDate: '2026-06-01' }),
    });
    expect(res.status).toBe(400);
  });
});
