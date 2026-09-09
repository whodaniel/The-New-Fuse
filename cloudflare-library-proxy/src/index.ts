// Reverse proxy for library.thenewfuse.com -> the virtual-library Cloud Run
// service. See wrangler.toml for why this Worker exists.
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const targetUrl = new URL(env.GCP_TARGET_URL);
    targetUrl.pathname = url.pathname;
    targetUrl.search = url.search;

    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    });

    try {
      return await fetch(newRequest);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Proxy Fetch Failed',
          message: error instanceof Error ? error.message : String(error),
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
