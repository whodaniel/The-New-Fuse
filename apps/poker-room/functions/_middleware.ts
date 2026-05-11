// Cloudflare Worker: Proxy /api/* requests from poker.ai-arcade.xyz to casin8-games Cloud Run
export default {
  async fetch(request: Request, env: PagesEnv) {
    const url = new URL(request.url);

    // Only proxy /api/* paths
    if (!url.pathname.startsWith('/api/')) {
      // Pass through to Pages for static assets
      return env.ASSETS.fetch(request);
    }

    // Forward to the casin8-games Cloud Run service
    const targetUrl = `https://casin8-games-241337102384.us-central1.run.app${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set('Host', 'casin8-games-241337102384.us-central1.run.app');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');

    // CORS headers for browser requests
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers':
        'content-type, authorization, x-tnf-identity, x-community-api-key',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ ok: false, error: message }), {
        status: 502,
        headers: { 'content-type': 'application/json', ...corsHeaders },
      });
    }
  },
};
