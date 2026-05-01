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

  // 2. Static content routes on app subdomain - redirect to landing page hash anchors
  // Previously these returned blank (RedirectToStatic returned null on app subdomain)
  // or 301'd to broken thenewfuse.com root domain (DNS Error 1000 → 403).
  // Now we redirect to the landing page on the SAME app subdomain with hash anchors,
  // which works because _redirects serves index.html (landing page) for all paths.
  if (host === 'app.thenewfuse.com' || host.startsWith('app.')) {
    const staticRouteMap = {
      '/pricing': '/#pricing',
      '/features': '/#features',
      '/about': '/#about',
      '/blog': '/#blog',
      '/community': '/#community',
      '/brand': '/#brand',
    };
    if (staticRouteMap[path]) {
      return Response.redirect(`https://app.thenewfuse.com${staticRouteMap[path]}`, 302);
    }
    if (path === '/docs' || path.startsWith('/docs/')) {
      return Response.redirect('https://app.thenewfuse.com/#docs', 302);
    }
  }

  // Cloud Run Backend Origins
  const API_GATEWAY = 'https://api-gateway-241337102384.us-central1.run.app';
  const RELAY_SERVER = 'https://relay-server-ipjhxcemfa-uc.a.run.app';

  // 3. API & WebSocket Routes - Proxy to Cloud Run
  if (path.startsWith('/api/') || path.startsWith('/v1/') || path === '/api' || path === '/v1') {
    const apiTarget = new URL(path + url.search, API_GATEWAY);
    return fetch(new Request(apiTarget, context.request));
  }

  if (path.startsWith('/ws/') || path === '/ws') {
    const wsTarget = new URL(path + url.search, RELAY_SERVER);
    return fetch(new Request(wsTarget, context.request));
  }

  // 4. Fetch the requested asset from the static store
  let response = await context.env.ASSETS.fetch(context.request);

  // 5. Fallback logic for SPA routes (on the app subdomain)
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
// Missing pages fix: Added explicit 302 redirects for /pricing, /features, /docs on app subdomain
