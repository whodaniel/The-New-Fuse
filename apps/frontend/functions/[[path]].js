export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const host = url.hostname;

  const isLandingDomain = host === 'thenewfuse.com' || host === 'www.thenewfuse.com';
  const isAppDomain = !isLandingDomain; // Treat everything else as app subdomain

  // Public machine-readable endpoints must not fall through to an HTML SPA shell.
  if (path === '/health' || path === '/status') {
    return Response.json({
      status: 'ok',
      service: isLandingDomain ? 'tnf-landing' : 'tnf-app',
      timestamp: new Date().toISOString(),
    });
  }

  if (path === '/robots.txt' || path === '/sitemap.xml' || path === '/.well-known/security.txt') {
    return context.env.ASSETS.fetch(context.request);
  }

  // Legacy API docs alias should resolve to static docs, not the API gateway.
  if (path === '/api/docs' || path.startsWith('/api/docs/')) {
    const docsSuffix = path.slice('/api/docs'.length);
    return Response.redirect(
      new URL(`/docs${docsSuffix}${url.search}${url.hash}`, url.origin),
      301
    );
  }

  // 1. API & WebSocket Routes - Proxy to backend services
  const API_GATEWAY = 'https://api.thenewfuse.com';
  const RELAY_SERVER = 'https://relay.thenewfuse.com';

  if (path.startsWith('/api/') || path.startsWith('/v1/') || path === '/api' || path === '/v1') {
    return fetch(new Request(new URL(path + url.search, API_GATEWAY), context.request));
  }

  if (path.startsWith('/ws/') || path === '/ws') {
    return fetch(new Request(new URL(path + url.search, RELAY_SERVER), context.request));
  }

  // 2. Landing Domain Specific Logic
  if (isLandingDomain) {
    // Pricing, Features, Docs routes stay on landing domain
    if (
      path === '/pricing' ||
      path === '/features' ||
      path === '/docs' ||
      path.startsWith('/docs/')
    ) {
      return context.env.ASSETS.fetch(context.request);
    }

    // Marketing SPA routes on landing domain -> serve app.html (not static index.html)
    const landingSpaRoutes = ['/about', '/blog', '/brand', '/contact'];
    const isLandingSpaRoute =
      landingSpaRoutes.includes(path) || path === '/legal/privacy' || path === '/legal/terms';

    if (isLandingSpaRoute) {
      const appResponse = await context.env.ASSETS.fetch(
        new Request(new URL('/app.html', url.origin))
      );
      const newHeaders = new Headers(appResponse.headers);
      newHeaders.set('Content-Type', 'text/html; charset=utf-8');
      newHeaders.set('X-TNF-Routing', 'SPA-Landing');
      return new Response(appResponse.body, {
        status: 200,
        headers: newHeaders,
      });
    }

    // Functional routes on landing domain -> redirect to app subdomain
    const functionalPrefixes = [
      '/dashboard',
      '/agents',
      '/workflows',
      '/settings',
      '/workspace',
      '/tasks',
      '/chat',
      '/admin',
      '/agency',
      '/mcp-hub',
      '/knowledge-hub',
      '/a2a-control',
      '/hub',
      '/resources',
      '/hosting',
      '/spaces',
      '/space',
      '/marketplace',
      '/suggestions',
      '/goals',
      '/plans',
      '/timeline',
      '/analytics',
      '/onboarding',
      '/codebase-map',
    ];
    const isFunctional =
      functionalPrefixes.some((p) => path === p || path.startsWith(p + '/')) ||
      path === '/app' ||
      path === '/app.html';

    if (isFunctional) {
      const cleanPath = path.replace(/^\/app(\.html)?/, '');
      const redirectPath = cleanPath === '' ? '/dashboard' : cleanPath;
      return Response.redirect(
        `https://app.thenewfuse.com${redirectPath}${url.search}${url.hash}`,
        301
      );
    }
  }

  // 3. App Domain Specific Logic
  if (isAppDomain) {
    // Serve known visualization HTML assets directly on app domain.
    // Without this, the SPA shell captures these paths and hides the visualization surfaces.
    if (path === '/visualizations/dashboard') {
      return context.env.ASSETS.fetch(
        new Request(new URL('/visualizations/dashboard.html' + url.search, url.origin))
      );
    }

    const isStaticAsset = path.includes('.') && !path.endsWith('.html');
    const isVisualizationHtmlAsset = path.startsWith('/visualizations/') && path.endsWith('.html');

    // Static assets (CSS, JS, images) and explicit visualization HTML -> let Cloudflare serve them
    if (isStaticAsset || isVisualizationHtmlAsset) {
      return context.env.ASSETS.fetch(context.request);
    }

    // All non-asset routes on app domains should resolve through the SPA shell.
    // Always fetch app.html directly to avoid Clean URL 308 redirect loops.
    let appResponse = await context.env.ASSETS.fetch(new Request(new URL('/app.html', url.origin)));

    // Return the app shell content with a 200 status.
    const newHeaders = new Headers(appResponse.headers);
    newHeaders.set('Content-Type', 'text/html; charset=utf-8');
    newHeaders.set('X-TNF-Routing', 'SPA-App');

    return new Response(appResponse.body, {
      status: 200,
      headers: newHeaders,
    });
  }

  // 4. Final Fallback - Normal Cloudflare serving
  const response = await context.env.ASSETS.fetch(context.request);

  // If still 404, serve the appropriate SPA root
  if (response.status === 404) {
    const rootPath = isLandingDomain ? '/' : '/app.html';
    return context.env.ASSETS.fetch(new Request(new URL(rootPath, url.origin)));
  }

  return response;
}
