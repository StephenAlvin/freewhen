interface FeedbackEnv { DISCORD_WEBHOOK_URL?: string; }

const MAX_TEXT_LEN = 1800;
const MAX_PATH_LEN = 200;

export const onRequestPost: PagesFunction<FeedbackEnv> = async (ctx) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  if (!body || typeof body !== 'object') return json(400, { error: 'Invalid body' });
  const { text, path } = body as Record<string, unknown>;

  if (typeof text !== 'string' || !text.trim()) return json(400, { error: 'Text is required' });
  const trimmed = text.trim();
  if (trimmed.length > MAX_TEXT_LEN) return json(400, { error: `Text must be ≤ ${MAX_TEXT_LEN} chars` });

  const pathStr = typeof path === 'string' ? path.slice(0, MAX_PATH_LEN) : '';

  const webhook = ctx.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.error('DISCORD_WEBHOOK_URL not configured');
    return json(500, { error: 'Feedback unavailable' });
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: `**${pathStr}**\n${trimmed}` }),
  });

  if (!res.ok) {
    console.error('Discord webhook failed', res.status);
    return json(502, { error: 'Failed to deliver feedback' });
  }

  return json(204, null);
};

function json(status: number, body: unknown): Response {
  if (body === null) return new Response(null, { status });
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
