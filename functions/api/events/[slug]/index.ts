import type { Env } from '../../_lib/db';
import { getEvent, getSubmissions } from '../../_lib/db';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const slug = ctx.params.slug as string;
  const event = await getEvent(ctx.env.DB, slug);
  if (!event) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }
  const submissions = await getSubmissions(ctx.env.DB, slug);
  return new Response(JSON.stringify({ event, submissions }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
