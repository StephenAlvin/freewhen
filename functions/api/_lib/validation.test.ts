import { describe, it, expect } from 'vitest';
import { validateCreateEvent, validateUpsertSubmission } from './validation';

describe('validateCreateEvent', () => {
  const base = { title: 'Brunch', theme: 'eating', startDate: '2026-04-20', endDate: '2026-04-25' };

  it('accepts valid input', () => {
    expect(validateCreateEvent(base).ok).toBe(true);
  });
  it('rejects empty title', () => {
    const r = validateCreateEvent({ ...base, title: '   ' });
    expect(r.ok).toBe(false);
  });
  it('rejects title over 120 chars', () => {
    expect(validateCreateEvent({ ...base, title: 'x'.repeat(121) }).ok).toBe(false);
  });
  it('rejects unknown theme', () => {
    expect(validateCreateEvent({ ...base, theme: 'napping' }).ok).toBe(false);
  });
  it('rejects malformed date', () => {
    expect(validateCreateEvent({ ...base, startDate: '4/20/2026' }).ok).toBe(false);
  });
  it('rejects end before start', () => {
    expect(validateCreateEvent({ ...base, startDate: '2026-05-01', endDate: '2026-04-30' }).ok).toBe(false);
  });
  it('rejects range over 90 days', () => {
    expect(validateCreateEvent({ ...base, startDate: '2026-01-01', endDate: '2026-06-01' }).ok).toBe(false);
  });
  it('trims title whitespace', () => {
    const r = validateCreateEvent({ ...base, title: '  Brunch  ' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.title).toBe('Brunch');
  });
});

describe('validateUpsertSubmission', () => {
  const ev = { startDate: '2026-04-20', endDate: '2026-04-25' };

  it('accepts valid input', () => {
    expect(validateUpsertSubmission({ name: 'Sarah', dates: ['2026-04-22'] }, ev).ok).toBe(true);
  });
  it('rejects empty name', () => {
    expect(validateUpsertSubmission({ name: '  ', dates: [] }, ev).ok).toBe(false);
  });
  it('dedupes and sorts dates', () => {
    const r = validateUpsertSubmission({ name: 'Sarah', dates: ['2026-04-23','2026-04-22','2026-04-22'] }, ev);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.dates).toEqual(['2026-04-22','2026-04-23']);
  });
  it('drops dates outside range', () => {
    const r = validateUpsertSubmission({ name: 'Sarah', dates: ['2026-04-19','2026-04-22','2026-04-26'] }, ev);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.dates).toEqual(['2026-04-22']);
  });
});
