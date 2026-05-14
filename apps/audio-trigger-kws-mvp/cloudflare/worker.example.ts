/**
 * Cloudflare Worker edge proxy for audio-trigger-kws-mvp API.
 *
 * Required env vars (set via wrangler.toml or dashboard):
 * - KWS_API_ORIGIN: CloudRuntime URL for this app (e.g. https://kws-api.thenewfuse.com)
 * - EDGE_API_KEY: shared key expected from clients
 */

interface Env {
  KWS_API_ORIGIN: string;
  EDGE_API_KEY: string;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/healthz') {
      return json({ status: 'ok', edge: 'cloudflare' });
    }

    const key = request.headers.get('x-edge-api-key');
    if (!key || key !== env.EDGE_API_KEY) {
      return json({ error: 'unauthorized' }, 401);
    }

    const upstream = new URL(url.pathname + url.search, env.KWS_API_ORIGIN);
    const upstreamRequest = new Request(upstream.toString(), request);
    return fetch(upstreamRequest, {
      cf: {
        cacheTtl: 0,
        cacheEverything: false,
      },
    });
  },
};
