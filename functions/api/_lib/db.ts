import type { EventRecord, Submission, ThemeId } from '../../../src/types';

export interface Env { DB: D1Database; }

interface EventRow {
  slug: string; title: string; theme: string;
  start_date: string; end_date: string; created_at: number;
}
interface SubmissionRow { id: number; name: string; updated_at: number; }
interface AvailabilityRow { submission_id: number; date: string; }

function rowToEvent(r: EventRow): EventRecord {
  return {
    slug: r.slug,
    title: r.title,
    theme: r.theme as ThemeId,
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at,
  };
}

export async function insertEvent(db: D1Database, e: EventRecord): Promise<void> {
  await db
    .prepare('INSERT INTO events (slug, title, theme, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(e.slug, e.title, e.theme, e.startDate, e.endDate, e.createdAt)
    .run();
}

export async function getEvent(db: D1Database, slug: string): Promise<EventRecord | null> {
  const row = await db
    .prepare('SELECT slug, title, theme, start_date, end_date, created_at FROM events WHERE slug = ?')
    .bind(slug)
    .first<EventRow>();
  return row ? rowToEvent(row) : null;
}

export async function getSubmissions(db: D1Database, slug: string): Promise<Submission[]> {
  const subs = await db
    .prepare('SELECT id, name, updated_at FROM submissions WHERE event_slug = ? ORDER BY updated_at ASC')
    .bind(slug)
    .all<SubmissionRow>();

  if (!subs.results.length) return [];
  const ids = subs.results.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const av = await db
    .prepare(`SELECT submission_id, date FROM availability WHERE submission_id IN (${placeholders})`)
    .bind(...ids)
    .all<AvailabilityRow>();

  const byId = new Map<number, string[]>();
  for (const row of av.results) {
    const arr = byId.get(row.submission_id) ?? [];
    arr.push(row.date);
    byId.set(row.submission_id, arr);
  }

  return subs.results.map((r) => ({
    name: r.name,
    updatedAt: r.updated_at,
    dates: (byId.get(r.id) ?? []).sort(),
  }));
}

export async function upsertSubmission(
  db: D1Database, slug: string, name: string, dates: string[], now: number,
): Promise<void> {
  const existing = await db
    .prepare('SELECT id FROM submissions WHERE event_slug = ? AND name = ?')
    .bind(slug, name)
    .first<{ id: number }>();

  let subId: number;
  if (existing) {
    subId = existing.id;
    await db.prepare('UPDATE submissions SET updated_at = ? WHERE id = ?').bind(now, subId).run();
  } else {
    const inserted = await db
      .prepare('INSERT INTO submissions (event_slug, name, updated_at) VALUES (?, ?, ?) RETURNING id')
      .bind(slug, name, now)
      .first<{ id: number }>();
    if (!inserted) throw new Error('Failed to insert submission');
    subId = inserted.id;
  }

  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM availability WHERE submission_id = ?').bind(subId),
  ];
  for (const d of dates) {
    statements.push(db.prepare('INSERT INTO availability (submission_id, date) VALUES (?, ?)').bind(subId, d));
  }
  await db.batch(statements);
}
