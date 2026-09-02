// Reverse proxy for relay.thenewfuse.com -> the relay-server Cloud Run
// service, including WebSocket upgrade passthrough. See wrangler.toml for
// why this Worker exists.
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const targetUrl = new URL(env.GCP_TARGET_URL);
    targetUrl.pathname = url.pathname;
    targetUrl.search = url.search;
    // Cloud Run terminates WebSockets over the same https:// origin (the
    // upgrade happens over the existing HTTPS connection), so the target
    // scheme stays https/wss-over-https rather than being rewritten to ws:.

    const isWebSocketUpgrade = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';

    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: isWebSocketUpgrade ? undefined : request.body,
      redirect: 'manual',
    });

    try {
      const response = await fetch(newRequest);

      if (isWebSocketUpgrade && response.webSocket) {
        return new Response(null, {
          status: 101,
          webSocket: response.webSocket,
        });
      }

      return response;
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
