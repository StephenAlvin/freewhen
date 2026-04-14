import type { CreateEventRequest, EventPayload, EventRecord, Submission, UpsertSubmissionRequest } from '@/types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const body = await res.json() as { error?: string };
      if (body.error) msg = body.error;
    } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }
  return (await res.json()) as T;
}

export async function createEvent(req: CreateEventRequest): Promise<EventRecord> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });
  return jsonOrThrow<EventRecord>(res);
}

export async function fetchEvent(slug: string): Promise<EventPayload> {
  const res = await fetch(`/api/events/${encodeURIComponent(slug)}`);
  return jsonOrThrow<EventPayload>(res);
}

export async function upsertSubmission(slug: string, req: UpsertSubmissionRequest): Promise<Submission> {
  const res = await fetch(`/api/events/${encodeURIComponent(slug)}/submissions`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });
  return jsonOrThrow<Submission>(res);
}
