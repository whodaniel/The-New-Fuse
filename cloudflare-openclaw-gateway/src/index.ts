export interface Env {
  ENVIRONMENT: string;
  GATEWAY_AUTH_TOKEN?: string;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function authorized(req: Request, env: Env) {
  if (!env.GATEWAY_AUTH_TOKEN) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${env.GATEWAY_AUTH_TOKEN}`;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return json({
        ok: true,
        env: env.ENVIRONMENT,
        authConfigured: Boolean(env.GATEWAY_AUTH_TOKEN),
      });
    }

    if (url.pathname === '/v1/ingress/telegram' && req.method === 'POST') {
      if (!authorized(req, env)) {
        return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
      }

      const body = await req.json<any>().catch(() => null);
      const text = body?.update?.message?.text;
      const requestId = body?.requestId || '(missing)';

      const replyText =
        typeof text === 'string' && text.trim().length > 0
          ? `✅ Gateway contract live. requestId=${requestId}\nYou said: ${text}`
          : `✅ Gateway contract live. requestId=${requestId}`;

      return json({ ok: true, replyText, metadata: { channel: 'telegram', requestId } });
    }

    return json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  },
};
