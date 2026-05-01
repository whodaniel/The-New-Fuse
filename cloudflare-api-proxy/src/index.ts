export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight for ALL requests (must be first)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // AUTH FIX: Rewrite /api/auth/* → /api/v1/auth/*
    // The Cloud Run gateway uses NestJS URI versioning (default v1),
    // so all routes are at /api/v1/auth/*. Clients calling /api/auth/* get 404.
    // This rewrite ensures unversioned auth paths reach the correct versioned routes.
    if (url.pathname.startsWith('/api/auth/')) {
      url.pathname = url.pathname.replace('/api/auth/', '/api/v1/auth/');
    }
    // Also handle /api/auth (no trailing slash) → /api/v1/auth
    if (url.pathname === '/api/auth') {
      url.pathname = '/api/v1/auth';
    }

    // General back-compat: rewrite /api/{resource}/* → /api/v1/{resource}/*
    // for ALL unversioned API paths (agents, chat, workflows, etc.)
    // Skips paths already containing a version prefix (/api/v1/*, /api/v2/*)
    const unversionedMatch = url.pathname.match(/^\/api\/(?!v\d+|health)([^/?#]+)([/?#].*)?$/);
    if (unversionedMatch) {
      url.pathname = `/api/v1/${unversionedMatch[1]}${unversionedMatch[2] || ''}`;
    }

    // Back-compat: rewrite /v1/* → /api/v1/*
    if (url.pathname.startsWith('/v1/') || url.pathname === '/v1') {
      url.pathname = `/api${url.pathname}`;
    }

    // Construct the target URL on GCP Cloud Run
    const targetUrl = new URL(env.GCP_API_URL);
    targetUrl.pathname = url.pathname;
    targetUrl.search = url.search;

    // Create a new request based on the original, but with the target URL
    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    });

    try {
      // Fetch from GCP Cloud Run
      const response = await fetch(newRequest);

      // Create a new response to allow modifying headers
      const newResponse = new Response(response.body, response);

      // Force CORS injection to support browser-based clients
      if (origin) {
        newResponse.headers.set('Access-Control-Allow-Origin', origin);
      } else {
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
      }

      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
      newResponse.headers.set('Access-Control-Allow-Headers', '*');
      newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

      return newResponse;
    } catch (error) {
      console.error('Proxy fetch failed:', error);
      return new Response(JSON.stringify({
        error: 'Proxy Fetch Failed',
        message: error instanceof Error ? error.message : String(error),
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
      });
    }
  },
};
