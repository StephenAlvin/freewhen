import {
  THEME_IDS, MAX_TITLE_LEN, MAX_NAME_LEN, MAX_RANGE_DAYS,
  type CreateEventRequest, type UpsertSubmissionRequest,
} from '../../../src/types';
import { isValidIsoDate, daysBetween } from '../../../src/lib/dates';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateCreateEvent(input: unknown): Result<CreateEventRequest> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid body' };
  const { title, theme, startDate, endDate } = input as Record<string, unknown>;

  if (typeof title !== 'string' || !title.trim()) return { ok: false, error: 'Title is required' };
  const trimmed = title.trim();
  if (trimmed.length > MAX_TITLE_LEN) return { ok: false, error: `Title must be ≤ ${MAX_TITLE_LEN} chars` };

  if (typeof theme !== 'string' || !(THEME_IDS as readonly string[]).includes(theme)) {
    return { ok: false, error: 'Unknown theme' };
  }

  if (typeof startDate !== 'string' || !isValidIsoDate(startDate)) return { ok: false, error: 'Invalid startDate' };
  if (typeof endDate !== 'string' || !isValidIsoDate(endDate)) return { ok: false, error: 'Invalid endDate' };
  if (endDate < startDate) return { ok: false, error: 'endDate must be ≥ startDate' };
  if (daysBetween(startDate, endDate) > MAX_RANGE_DAYS) return { ok: false, error: `Range cannot exceed ${MAX_RANGE_DAYS} days` };

  return {
    ok: true,
    value: { title: trimmed, theme: theme as CreateEventRequest['theme'], startDate, endDate },
  };
}

export function validateUpsertSubmission(
  input: unknown,
  event: { startDate: string; endDate: string },
): Result<UpsertSubmissionRequest> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid body' };
  const { name, dates } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) return { ok: false, error: 'Name is required' };
  const trimmed = name.trim();
  if (trimmed.length > MAX_NAME_LEN) return { ok: false, error: `Name must be ≤ ${MAX_NAME_LEN} chars` };

  if (!Array.isArray(dates)) return { ok: false, error: 'dates must be an array' };
  for (const d of dates) {
    if (typeof d !== 'string' || !isValidIsoDate(d)) return { ok: false, error: 'Invalid date entry' };
  }
  const inRange = (dates as string[]).filter((d) => d >= event.startDate && d <= event.endDate);
  const deduped = [...new Set(inRange)].sort();

  return { ok: true, value: { name: trimmed, dates: deduped } };
}
