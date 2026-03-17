export interface Env {
  FRONTEND_URL: string;
  BACKEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const isAssetRequest =
      path.startsWith('/assets/') || /\.[a-z0-9]+$/i.test(path) || path.startsWith('/static/');

    // Route to Railway Backend for API requests
    if (path.startsWith('/api/')) {
      console.log(`[Gateway] Routing to Backend: ${path}`);
      const backendUrl = new URL(env.BACKEND_URL);
      url.hostname = backendUrl.hostname;
      url.protocol = backendUrl.protocol;
      url.port = backendUrl.port;

      const newRequest = new Request(url.toString(), request);
      const res = await fetch(newRequest, {
        cf: { cacheTtl: 0, cacheEverything: false },
      });
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'no-store');
      return new Response(res.body, { status: res.status, headers });
    }

    // Route to Cloudflare Pages for Frontend
    console.log(`[Gateway] Routing to Frontend: ${path}`);
    const frontendUrl = new URL(env.FRONTEND_URL);
    url.hostname = frontendUrl.hostname;
    url.protocol = frontendUrl.protocol;
    url.port = frontendUrl.port;

    const newRequest = new Request(url.toString(), request);
    const res = await fetch(newRequest, {
      cf: isAssetRequest
        ? { cacheEverything: true, cacheTtl: 60 * 60 * 24 }
        : { cacheEverything: false },
    });
    if (!isAssetRequest) {
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'no-cache');
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  },
};
