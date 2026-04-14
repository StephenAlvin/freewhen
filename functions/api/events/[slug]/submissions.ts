import type { Env } from '../../_lib/db';
import { getEvent, upsertSubmission } from '../../_lib/db';
import { validateUpsertSubmission } from '../../_lib/validation';

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  const slug = ctx.params.slug as string;
  const event = await getEvent(ctx.env.DB, slug);
  if (!event) return json(404, { error: 'Not found' });

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const result = validateUpsertSubmission(body, event);
  if (!result.ok) return json(400, { error: result.error });

  const now = Math.floor(Date.now() / 1000);
  await upsertSubmission(ctx.env.DB, slug, result.value.name, result.value.dates, now);

  return json(200, { name: result.value.name, dates: result.value.dates, updatedAt: now });
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
