export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const host = url.hostname;

  // 0. Special handling for missing pages on app subdomain
  // On app.thenewfuse.com, /pricing, /features, /docs should redirect to
  // the main landing site (thenewfuse.com) where those sections live.
  if (host === 'app.thenewfuse.com' || host.startsWith('app.')) {
    if (path === '/pricing') {
      return Response.redirect(`https://thenewfuse.com/#pricing${url.search}${url.hash}`, 301);
    }
    if (path === '/features') {
      return Response.redirect(`https://thenewfuse.com/#features${url.search}${url.hash}`, 301);
    }
    if (path === '/docs') {
      return Response.redirect(`https://thenewfuse.com/docs${url.search}${url.hash}`, 301);
    }
  }

  // 1. Force Redirect from Main Domain to App Subdomain for functional routes
  if (host === 'thenewfuse.com' || host === 'www.thenewfuse.com') {
    if (
      path.startsWith('/auth') ||
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/app') ||
      path === '/app.html'
    ) {
      // Remove '/app' or '/app.html' from the path when redirecting to the app subdomain
      const cleanPath = path.replace(/^\/app(\.html)?/, '');
      const redirectPath = cleanPath === '' ? '/dashboard' : cleanPath;

      return Response.redirect(
        `https://app.thenewfuse.com${redirectPath}${url.search}${url.hash}`,
        301
      );
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
// Force function deploy: Thu Apr 30 14:57:00 UTC 2026
// Missing pages fix: redirect /pricing, /features, /docs to thenewfuse.com landing
