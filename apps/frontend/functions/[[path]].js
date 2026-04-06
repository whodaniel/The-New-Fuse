export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Cloud Run Backend Origins - Discovered in GCP project the-new-fuse-2025
  const API_GATEWAY = 'https://api-gateway-ipjhxcemfa-uc.a.run.app';
  const RELAY_SERVER = 'https://relay-server-ipjhxcemfa-uc.a.run.app';

  // 1. API & WebSocket Routes - Proxy to Cloud Run (Bridge Mode)
  if (path.startsWith('/api/') || path.startsWith('/v1/') || path === '/api' || path === '/v1') {
    const apiTarget = new URL(path + url.search, API_GATEWAY);
    return fetch(new Request(apiTarget, context.request));
  }

  if (path.startsWith('/ws/') || path === '/ws') {
    const wsTarget = new URL(path + url.search, RELAY_SERVER);
    return fetch(new Request(wsTarget, context.request));
  }

  // 2. Fetch the requested asset from the static store
  let response = await context.env.ASSETS.fetch(context.request);

  // 3. Fallback logic for SPA routes
  // If the asset is not found (404) and the path doesn't have an extension, serve app.html
  if (response.status === 404 && !path.includes('.')) {
    const appRequest = new Request(new URL('/app.html', url.origin), context.request);
    return context.env.ASSETS.fetch(appRequest);
  }

  // 4. Return the original response (could be the marketing page, a static asset, or a real 404)
  return response;
}
