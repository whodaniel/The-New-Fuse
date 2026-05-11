// Cloudflare Pages Function: Proxy /api/* requests to casin8-games Cloud Run
// This runs at the edge and forwards API calls from poker.ai-arcade.xyz

const BACKEND_URL = 'https://casin8-games-241337102384.us-central1.run.app';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers':
    'content-type, authorization, x-tnf-identity, x-community-api-key',
};

export async function onRequest(context: PagesFunctionContext) {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('Host', new URL(BACKEND_URL).host);
  // Remove Cloudflare-specific headers that confuse the backend
  for (const key of ['cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker']) {
    headers.delete(key);
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    });

    // Clone response to add CORS headers
    const newHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v));

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 502,
      headers: { 'content-type': 'application/json', ...CORS_HEADERS },
    });
  }
}
