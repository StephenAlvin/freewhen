import { describe, it, expect } from 'vitest';
import { toIsoDate, isValidIsoDate, daysBetween, enumerateDates } from './dates';

describe('toIsoDate', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 3, 14))).toBe('2026-04-14');
  });
  it('pads single-digit months and days', () => {
    expect(toIsoDate(new Date(2026, 0, 3))).toBe('2026-01-03');
  });
});

describe('isValidIsoDate', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(isValidIsoDate('2026-04-14')).toBe(true);
  });
  it('rejects malformed values', () => {
    expect(isValidIsoDate('04/14/2026')).toBe(false);
    expect(isValidIsoDate('2026-4-14')).toBe(false);
    expect(isValidIsoDate('2026-04-32')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
  });
});

describe('daysBetween', () => {
  it('counts inclusive', () => {
    expect(daysBetween('2026-04-14', '2026-04-14')).toBe(1);
    expect(daysBetween('2026-04-14', '2026-04-15')).toBe(2);
    expect(daysBetween('2026-04-01', '2026-04-30')).toBe(30);
  });
  it('handles month boundaries', () => {
    expect(daysBetween('2026-04-30', '2026-05-02')).toBe(3);
  });
});

describe('enumerateDates', () => {
  it('returns every day inclusive', () => {
    expect(enumerateDates('2026-04-14', '2026-04-16')).toEqual(['2026-04-14','2026-04-15','2026-04-16']);
  });
  it('returns a single day when start === end', () => {
    expect(enumerateDates('2026-04-14', '2026-04-14')).toEqual(['2026-04-14']);
  });
});
