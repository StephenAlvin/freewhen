import type { Env } from '../../_lib/db';

export const onRequestPut: PagesFunction<Env> = async () => {
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: { 'content-type': 'application/json' },
  });
};
