import { MAX_RANGE_DAYS } from '@/types';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isValidIsoDate(s: string): boolean {
  const m = s.match(ISO_RE);
  if (!m) return false;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return (
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(mo) - 1 &&
    date.getDate() === Number(d)
  );
}

function parseIso(s: string): Date {
  const [y, mo, d] = s.split('-').map(Number);
  return new Date(y, mo - 1, d);
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = parseIso(startIso).getTime();
  const end = parseIso(endIso).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

export function enumerateDates(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const d = parseIso(startIso);
  const end = parseIso(endIso);
  while (d.getTime() <= end.getTime()) {
    out.push(toIsoDate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export type RangeError = null | 'invalid' | 'past-start' | 'end-before-start' | 'too-long';

export function validateRange(start: string, end: string, todayIso: string): RangeError {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return 'invalid';
  if (start < todayIso) return 'past-start';
  if (end < start) return 'end-before-start';
  if (daysBetween(start, end) > MAX_RANGE_DAYS) return 'too-long';
  return null;
}
