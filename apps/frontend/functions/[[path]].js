export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const host = url.hostname;

  // 1. Force Redirect from Main Domain to App Subdomain for functional routes
  if (host === 'thenewfuse.com' || host === 'www.thenewfuse.com') {
    if (
      path.startsWith('/auth') ||
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/dashboard')
    ) {
      return Response.redirect(`https://app.thenewfuse.com${path}${url.search}${url.hash}`, 301);
    }
  }

  // Cloud Run Backend Origins
  const API_GATEWAY = 'https://api-gateway-241337102384.us-central1.run.app';
  const RELAY_SERVER = 'https://relay-server-ipjhxcemfa-uc.a.run.app';

  // 2. API & WebSocket Routes - Proxy to Cloud Run
  if (path.startsWith('/api/') || path.startsWith('/v1/') || path === '/api' || path === '/v1') {
    const apiTarget = new URL(path + url.search, API_GATEWAY);
    return fetch(new Request(apiTarget, context.request));
  }

  if (path.startsWith('/ws/') || path === '/ws') {
    const wsTarget = new URL(path + url.search, RELAY_SERVER);
    return fetch(new Request(wsTarget, context.request));
  }

  // 3. Fetch the requested asset from the static store
  let response = await context.env.ASSETS.fetch(context.request);

  // 4. Fallback logic for SPA routes (on the app subdomain)
  if (
    response.status === 404 &&
    !path.includes('.') &&
    (host === 'app.thenewfuse.com' || host.startsWith('app.'))
  ) {
    const appRequest = new Request(new URL('/app.html', url.origin), context.request);
    return context.env.ASSETS.fetch(appRequest);
  }

  return response;
}
// Force function deploy: Thu Apr 23 13:03:03 EDT 2026
// Logo update: Thu Apr 23 15:36:22 EDT 2026
