import type { Env } from '../_lib/db';
import { insertEvent } from '../_lib/db';
import { generateSlug } from '../_lib/slug';
import { validateCreateEvent } from '../_lib/validation';

const MAX_RETRIES = 5;

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const result = validateCreateEvent(body);
  if (!result.ok) return json(400, { error: result.error });

  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < MAX_RETRIES; i++) {
    const slug = generateSlug(result.value.theme);
    const record = {
      slug,
      title: result.value.title,
      theme: result.value.theme,
      startDate: result.value.startDate,
      endDate: result.value.endDate,
      createdAt: now,
    };
    try {
      await insertEvent(ctx.env.DB, record);
      return json(201, record);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('UNIQUE') || msg.includes('constraint')) {
        console.error('slug collision, retrying', { attempt: i });
        continue;
      }
      throw err;
    }
  }
  console.error('slug generation exhausted retries');
  return json(500, { error: 'Could not generate unique slug' });
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
