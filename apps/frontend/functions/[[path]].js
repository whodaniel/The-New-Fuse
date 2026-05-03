export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const host = url.hostname;

  const isLandingDomain = host === 'thenewfuse.com' || host === 'www.thenewfuse.com';
  const isAppDomain = !isLandingDomain; // Treat everything else as app subdomain

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
    if (path === '/pricing' || path === '/features' || path === '/docs' || path.startsWith('/docs/')) {
      return context.env.ASSETS.fetch(context.request);
    }

    // Functional routes on landing domain -> redirect to app subdomain
    const functionalPrefixes = ['/auth', '/login', '/register', '/dashboard', '/agents', '/workflows', '/settings', '/workspace', '/tasks', '/chat', '/admin', '/agency', '/mcp-hub', '/knowledge-hub', '/a2a-control', '/hub', '/resources', '/hosting', '/spaces', '/space', '/marketplace', '/suggestions', '/goals', '/plans', '/timeline', '/analytics', '/onboarding'];
    const isFunctional = functionalPrefixes.some(p => path === p || path.startsWith(p + '/')) || path === '/app' || path === '/app.html';

    if (isFunctional) {
      const cleanPath = path.replace(/^\/app(\.html)?/, '');
      const redirectPath = cleanPath === '' ? '/dashboard' : cleanPath;
      return Response.redirect(`https://app.thenewfuse.com${redirectPath}${url.search}${url.hash}`, 301);
    }
  }

  // 3. App Domain Specific Logic
  if (isAppDomain) {
    // Static assets (CSS, JS, images) -> let Cloudflare serve them
    if (path.includes('.') && !path.endsWith('.html')) {
      return context.env.ASSETS.fetch(context.request);
    }

    // Landing-only routes on app domain -> redirect to main site
    if (path === '/pricing' || path === '/features' || path === '/docs' || path.startsWith('/docs/')) {
      return Response.redirect(`https://thenewfuse.com${path}${url.search}`, 301);
    }

    // SPA routes on app domain -> serve app.html content
    // We avoid fetching /app.html directly to prevent 308 loops (Clean URLs).
    // Instead, we fetch /app which Cloudflare should resolve to app.html.
    // If that fails, we fallback to /app.html but handle the response carefully.
    const functionalPrefixes = ['/auth', '/login', '/register', '/dashboard', '/agents', '/workflows', '/settings', '/workspace', '/tasks', '/chat', '/admin', '/agency', '/mcp-hub', '/knowledge-hub', '/a2a-control', '/hub', '/resources', '/hosting', '/spaces', '/space', '/marketplace', '/suggestions', '/goals', '/plans', '/timeline', '/analytics', '/onboarding'];
    const isFunctional = functionalPrefixes.some(p => path === p || path.startsWith(p + '/')) || path === '/app' || path === '/app.html' || path === '/';

    if (isFunctional) {
      // Fetch the app shell. We use the /app path which is the "Clean URL" target for app.html.
      let appResponse = await context.env.ASSETS.fetch(new Request(new URL('/app', url.origin)));
      
      // If /app returns 404 (e.g. Clean URLs disabled), try /app.html
      if (appResponse.status === 404 || appResponse.status === 308) {
        appResponse = await context.env.ASSETS.fetch(new Request(new URL('/app.html', url.origin)));
      }

      // If we got a redirect (308/301), we follow it once internally or return the target content.
      if (appResponse.status === 308 || appResponse.status === 301) {
        const loc = appResponse.headers.get('location');
        appResponse = await context.env.ASSETS.fetch(new Request(new URL(loc, url.origin)));
      }

      // Return the app shell content with a 200 status
      return new Response(appResponse.body, {
        status: 200,
        headers: {
          ...Object.fromEntries(appResponse.headers),
          'Content-Type': 'text/html; charset=utf-8',
          'X-TNF-Routing': 'SPA-App'
        }
      });
    }
  }

  // 4. Final Fallback - Normal Cloudflare serving
  const response = await context.env.ASSETS.fetch(context.request);
  
  // If still 404, serve the appropriate SPA root
  if (response.status === 404) {
    const rootPath = isLandingDomain ? '/' : '/app';
    return context.env.ASSETS.fetch(new Request(new URL(rootPath, url.origin)));
  }

  return response;
}
