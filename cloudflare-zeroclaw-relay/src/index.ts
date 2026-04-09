export interface Env {
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

type BackendResult = {
  ok: boolean;
  status: number;
  rawText: string;
  parsed: unknown;
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

async function callApiChat(baseUrl: string, payload: ChatPayload): Promise<BackendResult> {
  const url = `${normalizeBase(baseUrl)}/api/chat`;
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
  };
}

function unauthorized(req: Request, env: Env): boolean {
  if (!env.TNF_WEBHOOK_SECRET) return false;
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

    if (url.pathname === '/health') {
      return json({
        ok: true,
        relay: 'cloudflare-zeroclaw-relay',
        primaryConfigured: Boolean(env.ZEROCLAW_PRIMARY_URL),
        secondaryConfigured: Boolean(env.ZEROCLAW_SECONDARY_URL),
        secretRequired: Boolean(env.TNF_WEBHOOK_SECRET),
      });
    }

    if (url.pathname !== '/webhook' || req.method !== 'POST') {
      return json({ error: 'not_found' }, { status: 404 });
    }

    if (unauthorized(req, env)) {
      return json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!isValidPayload(body)) {
      return json({ error: 'message_required' }, { status: 400 });
    }

    if (!env.ZEROCLAW_PRIMARY_URL || !env.ZEROCLAW_SECONDARY_URL) {
      return json(
        {
          error: 'missing_config',
          required: ['ZEROCLAW_PRIMARY_URL', 'ZEROCLAW_SECONDARY_URL'],
        },
        { status: 500 }
      );
    }

    const primary = await callApiChat(env.ZEROCLAW_PRIMARY_URL, body);
    if (primary.ok) {
      return json({
        routed_to: 'primary',
        status: primary.status,
        response: primary.parsed ?? primary.rawText,
      });
    }

    const secondary = await callApiChat(env.ZEROCLAW_SECONDARY_URL, body);
    if (secondary.ok) {
      return json({
        routed_to: 'secondary',
        primary_error: {
          status: primary.status,
          body: primary.rawText.slice(0, 800),
        },
        status: secondary.status,
        response: secondary.parsed ?? secondary.rawText,
      });
    }

    return json(
      {
        error: 'all_backends_failed',
        primary: {
          status: primary.status,
          body: primary.rawText.slice(0, 800),
        },
        secondary: {
          status: secondary.status,
          body: secondary.rawText.slice(0, 800),
        },
      },
      { status: 502 }
    );
  },
};
