export interface Env {
  ENVIRONMENT?: string;
  ZEROCLAW_PRIMARY_URL: string;
  ZEROCLAW_SECONDARY_URL: string;
  TNF_WEBHOOK_SECRET?: string;
}

type ChatPayload = {
  message: string;
  system_prompt?: string;
  conversation_id?: string;
  user_id?: string;
  [key: string]: unknown;
};

type BackendAttempt = {
  endpoint: string;
  status: number;
  rawText: string;
};

type BackendResult = {
  ok: boolean;
  status: number;
  rawText: string;
  parsed: unknown;
  endpoint: string;
  attempts: BackendAttempt[];
};

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function normalizeBase(base: string): string {
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

async function callEndpoint(
  baseUrl: string,
  endpoint: string,
  payload: ChatPayload
): Promise<{ ok: boolean; status: number; rawText: string; parsed: unknown; endpoint: string }> {
  const url = `${normalizeBase(baseUrl)}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    rawText,
    parsed,
    endpoint,
  };
}

async function callApiChat(baseUrl: string, payload: ChatPayload): Promise<BackendResult> {
  const attempts: BackendAttempt[] = [];

  for (const endpoint of ['/api/chat', '/webhook']) {
    const result = await callEndpoint(baseUrl, endpoint, payload);
    attempts.push({
      endpoint: result.endpoint,
      status: result.status,
      rawText: result.rawText,
    });

    if (result.ok) {
      return {
        ...result,
        attempts,
      };
    }
  }

  const lastAttempt = attempts[attempts.length - 1];
  let parsed: unknown = null;
  try {
    parsed = lastAttempt?.rawText ? JSON.parse(lastAttempt.rawText) : null;
  } catch {
    parsed = null;
  }

  return {
    ok: false,
    status: lastAttempt?.status ?? 502,
    rawText: lastAttempt?.rawText ?? '',
    parsed,
    endpoint: lastAttempt?.endpoint ?? '/api/chat',
    attempts,
  };
}

function isLocalEnvironment(value: string | undefined): boolean {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return ['local', 'localhost', 'devlocal', 'test'].includes(normalized);
}

function isLocalRuntimeRequest(req: Request, env: Env): boolean {
  if (isLocalEnvironment(env.ENVIRONMENT)) return true;
  try {
    const hostname = new URL(req.url).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function missingRequiredConfig(env: Env, localRuntime: boolean): string[] {
  const missing: string[] = [];
  if (!env.ZEROCLAW_PRIMARY_URL) missing.push('ZEROCLAW_PRIMARY_URL');
  if (!env.ZEROCLAW_SECONDARY_URL) missing.push('ZEROCLAW_SECONDARY_URL');
  if (!localRuntime && !env.TNF_WEBHOOK_SECRET) missing.push('TNF_WEBHOOK_SECRET');
  return missing;
}

function unauthorized(req: Request, env: Env, localRuntime: boolean): boolean {
  if (!env.TNF_WEBHOOK_SECRET) return !localRuntime;
  return req.headers.get('x-tnf-webhook-secret') !== env.TNF_WEBHOOK_SECRET;
}

function isValidPayload(body: unknown): body is ChatPayload {
  if (!body || typeof body !== 'object') return false;
  const maybe = body as Record<string, unknown>;
  return typeof maybe.message === 'string' && maybe.message.trim().length > 0;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const localRuntime = isLocalRuntimeRequest(req, env);
    const missingConfig = missingRequiredConfig(env, localRuntime);

    if (url.pathname === '/health') {
      const healthy = missingConfig.length === 0;
      return json(
        {
          ok: healthy,
          relay: 'cloudflare-zeroclaw-relay',
          env: env.ENVIRONMENT || 'unknown',
          localRuntime,
          primaryConfigured: Boolean(env.ZEROCLAW_PRIMARY_URL),
          secondaryConfigured: Boolean(env.ZEROCLAW_SECONDARY_URL),
          secretConfigured: Boolean(env.TNF_WEBHOOK_SECRET),
          secretRequired: !localRuntime,
          missingConfig,
        },
        { status: healthy ? 200 : 503 }
      );
    }

    if (missingConfig.length > 0) {
      return json(
        {
          ok: false,
          error: 'MISCONFIGURED_MISSING_CONFIG',
          missing: missingConfig,
        },
        { status: 503 }
      );
    }

    if (url.pathname !== '/webhook' || req.method !== 'POST') {
      return json({ error: 'not_found' }, { status: 404 });
    }

    if (unauthorized(req, env, localRuntime)) {
      return json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!isValidPayload(body)) {
      return json({ error: 'message_required' }, { status: 400 });
    }

    const primary = await callApiChat(env.ZEROCLAW_PRIMARY_URL, body);
    if (primary.ok) {
      return json({
        routed_to: 'primary',
        endpoint: primary.endpoint,
        status: primary.status,
        response: primary.parsed ?? primary.rawText,
      });
    }

    const secondary = await callApiChat(env.ZEROCLAW_SECONDARY_URL, body);
    if (secondary.ok) {
      return json({
        routed_to: 'secondary',
        primary_error: {
          endpoint: primary.endpoint,
          status: primary.status,
          body: primary.rawText.slice(0, 800),
          attempts: primary.attempts.map((attempt) => ({
            endpoint: attempt.endpoint,
            status: attempt.status,
            body: attempt.rawText.slice(0, 300),
          })),
        },
        endpoint: secondary.endpoint,
        status: secondary.status,
        response: secondary.parsed ?? secondary.rawText,
      });
    }

    return json(
      {
        error: 'all_backends_failed',
        primary: {
          endpoint: primary.endpoint,
          status: primary.status,
          body: primary.rawText.slice(0, 800),
          attempts: primary.attempts.map((attempt) => ({
            endpoint: attempt.endpoint,
            status: attempt.status,
            body: attempt.rawText.slice(0, 300),
          })),
        },
        secondary: {
          endpoint: secondary.endpoint,
          status: secondary.status,
          body: secondary.rawText.slice(0, 800),
          attempts: secondary.attempts.map((attempt) => ({
            endpoint: attempt.endpoint,
            status: attempt.status,
            body: attempt.rawText.slice(0, 300),
          })),
        },
      },
      { status: 502 }
    );
  },
};
