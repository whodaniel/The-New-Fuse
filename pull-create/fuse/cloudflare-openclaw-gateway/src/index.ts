export interface Env {
  ENVIRONMENT: string;
  GATEWAY_AUTH_TOKEN?: string;
  EXECUTOR_URL?: string;
  EXECUTOR_AUTH_TOKEN?: string;
}

type IngressBody = {
  channel: 'telegram';
  requestId: string;
  idempotencyKey?: string;
  sessionId?: string;
  update: any;
};

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

function buildRequestId(body: Partial<IngressBody>) {
  return body.requestId || `req_${crypto.randomUUID()}`;
}

function validateIngressBody(
  body: any
): { ok: true; value: IngressBody } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'BAD_JSON' };
  if (body.channel !== 'telegram') return { ok: false, error: 'UNSUPPORTED_CHANNEL' };
  if (!body.update || typeof body.update !== 'object')
    return { ok: false, error: 'UPDATE_REQUIRED' };
  const requestId = buildRequestId(body);
  return {
    ok: true,
    value: {
      channel: 'telegram',
      requestId,
      idempotencyKey: body.idempotencyKey,
      sessionId: body.sessionId,
      update: body.update,
    },
  };
}

async function callExecutor(env: Env, payload: IngressBody) {
  if (!env.EXECUTOR_URL) {
    return { ok: false, status: 503, error: 'EXECUTOR_UNAVAILABLE', body: null as any };
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-request-id': payload.requestId,
  };
  if (payload.idempotencyKey) headers['x-idempotency-key'] = payload.idempotencyKey;
  if (env.EXECUTOR_AUTH_TOKEN) headers['authorization'] = `Bearer ${env.EXECUTOR_AUTH_TOKEN}`;

  const res = await fetch(env.EXECUTOR_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => '');

  return { ok: res.ok, status: res.status, error: res.ok ? null : 'EXECUTOR_ERROR', body };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return json({
        ok: true,
        env: env.ENVIRONMENT,
        authConfigured: Boolean(env.GATEWAY_AUTH_TOKEN),
        executorConfigured: Boolean(env.EXECUTOR_URL),
      });
    }

    if (url.pathname === '/v1/ingress/telegram' && req.method === 'POST') {
      if (!authorized(req, env)) {
        return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
      }

      const rawBody = await req.json<any>().catch(() => null);
      const validated = validateIngressBody(rawBody);
      if (!validated.ok) {
        return json({ ok: false, error: validated.error }, { status: 400 });
      }

      const payload = validated.value;
      const execResult = await callExecutor(env, payload);

      if (!execResult.ok) {
        return json(
          {
            ok: false,
            error: execResult.error,
            requestId: payload.requestId,
            status: execResult.status,
            executorBody: execResult.body,
          },
          { status: execResult.status || 502 }
        );
      }

      const replyText = execResult?.body?.replyText;
      if (typeof replyText !== 'string' || replyText.trim().length === 0) {
        return json(
          {
            ok: false,
            error: 'EXECUTOR_BAD_RESPONSE',
            requestId: payload.requestId,
            executorBody: execResult.body,
          },
          { status: 502 }
        );
      }

      return json({
        ok: true,
        requestId: payload.requestId,
        replyText,
        metadata: {
          channel: payload.channel,
          idempotencyKey: payload.idempotencyKey || null,
        },
      });
    }

    return json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  },
};
