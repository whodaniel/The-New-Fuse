export interface Env {
  FRONTEND_URL: string;
  BACKEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route to Railway Backend for API requests
    if (path.startsWith('/api/')) {
      console.log(`[Gateway] Routing to Backend: ${path}`);
      const backendUrl = new URL(env.BACKEND_URL);
      url.hostname = backendUrl.hostname;
      url.protocol = backendUrl.protocol;
      url.port = backendUrl.port;

      const newRequest = new Request(url.toString(), request);
      return fetch(newRequest);
    }

    // Route to Cloudflare Pages for Frontend
    console.log(`[Gateway] Routing to Frontend: ${path}`);
    const frontendUrl = new URL(env.FRONTEND_URL);
    url.hostname = frontendUrl.hostname;
    url.protocol = frontendUrl.protocol;
    url.port = frontendUrl.port;

    const newRequest = new Request(url.toString(), request);
    return fetch(newRequest);
  },
};
