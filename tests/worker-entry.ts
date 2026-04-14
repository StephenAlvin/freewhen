// Test-only worker entry that emulates the Cloudflare Pages Functions file router
// over the handlers in `functions/`. It lets `SELF.fetch()` in integration tests
// reach our Pages Functions without running `wrangler pages dev`.

import type { Env } from '../functions/api/_lib/db';
import { onRequest as middleware } from '../functions/_middleware';
import { onRequestPost as onEventsPost } from '../functions/api/events/index';
import { onRequestGet as onEventGet } from '../functions/api/events/[slug]/index';
import { onRequestPut as onSubmissionsPut } from '../functions/api/events/[slug]/submissions';

type AnyHandler = (ctx: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  next: (req?: Request) => Promise<Response>;
  data: Record<string, unknown>;
  functionPath: string;
  waitUntil: (p: Promise<unknown>) => void;
  passThroughOnException: () => void;
}) => Promise<Response> | Response;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: AnyHandler;
}

function route(method: string, pattern: string, handler: AnyHandler): Route {
  const paramNames: string[] = [];
  const re = pattern.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return { method, pattern: new RegExp(`^${re}/?$`), paramNames, handler };
}

const routes: Route[] = [
  route('POST', '/api/events', onEventsPost as AnyHandler),
  route('GET', '/api/events/:slug', onEventGet as AnyHandler),
  route('PUT', '/api/events/:slug/submissions', onSubmissionsPut as AnyHandler),
];

function matchRoute(method: string, pathname: string): { handler: AnyHandler; params: Record<string, string> } | null {
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = pathname.match(r.pattern);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.paramNames.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1]); });
    return { handler: r.handler, params };
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const match = matchRoute(request.method, url.pathname);

    const next = async (): Promise<Response> => {
      if (!match) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      return match.handler({
        request,
        env,
        params: match.params,
        next: async () => next(),
        data: {},
        functionPath: url.pathname,
        waitUntil: (p) => ctx.waitUntil(p),
        passThroughOnException: () => ctx.passThroughOnException(),
      });
    };

    return middleware({
      request,
      env,
      params: {},
      next,
      data: {},
      functionPath: url.pathname,
      waitUntil: (p: Promise<unknown>) => ctx.waitUntil(p),
      passThroughOnException: () => ctx.passThroughOnException(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  },
};
