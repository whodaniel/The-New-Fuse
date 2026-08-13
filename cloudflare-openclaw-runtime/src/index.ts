export interface Env {
  ENVIRONMENT: string;
  SHAREDSTATE_API_BASE: string;
  SHAREDSTATE_SERVICE: Fetcher;
  OPENCLAW_GATEWAY_SERVICE?: Fetcher;
  SHAREDSTATE_AUTH_TOKEN?: string;
  OPENCLAW_GATEWAY_URL?: string;
  OPENCLAW_GATEWAY_AUTH_TOKEN?: string;
  // OPENCLAW_EVENTS: Queue; // disabled until Queues enabled
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET_TOKEN?: string;
}

interface Receipt {
  by: string;
  type: string;
  scope: unknown;
  perm: unknown;
  refs: unknown;
  data: unknown;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    chat?: { id: number; type: string };
    from?: { id: number; username?: string };
    text?: string;
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
  if (!env.SHAREDSTATE_API_BASE) missing.push('SHAREDSTATE_API_BASE');
  if (!env.SHAREDSTATE_AUTH_TOKEN && !localRuntime) missing.push('SHAREDSTATE_AUTH_TOKEN');
  if (!env.TELEGRAM_WEBHOOK_SECRET_TOKEN && !localRuntime) {
    missing.push('TELEGRAM_WEBHOOK_SECRET_TOKEN');
  }
  if (!env.TELEGRAM_BOT_TOKEN && !localRuntime) missing.push('TELEGRAM_BOT_TOKEN');

  const hasGatewayService = Boolean(env.OPENCLAW_GATEWAY_SERVICE);
  const hasGatewayUrl = Boolean(env.OPENCLAW_GATEWAY_URL);
  if (!hasGatewayService && !hasGatewayUrl)
    missing.push('OPENCLAW_GATEWAY_SERVICE|OPENCLAW_GATEWAY_URL');
  if (hasGatewayUrl && !env.OPENCLAW_GATEWAY_AUTH_TOKEN && !localRuntime) {
    missing.push('OPENCLAW_GATEWAY_AUTH_TOKEN');
  }

  return missing;
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

async function depositReceipt(env: Env, receipt: Receipt) {
  const payload = {
    by: receipt.by,
    type: receipt.type,
    scope: receipt.scope,
    perm: receipt.perm,
    refs: receipt.refs,
    data: receipt.data,
  };

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (env.SHAREDSTATE_AUTH_TOKEN) {
    headers['x-auth-token'] = env.SHAREDSTATE_AUTH_TOKEN;
  }

  // Prefer service binding (reliable, avoids edge fetch quirks)
  const res = await env.SHAREDSTATE_SERVICE.fetch('https://sharedstate/deposit', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, via: 'service', contentType: ct, body };
  }
  const text = await res.text().catch(() => '');
  return {
    ok: res.ok,
    status: res.status,
    via: 'service',
    contentType: ct,
    text: text.slice(0, 500),
  };
}

async function telegramSendMessage(env: Env, chatId: number | string, text: string) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: 'NO_TELEGRAM_BOT_TOKEN' };
  }
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

async function callGateway(env: Env, update: unknown, requestId: string) {
  const hasService = Boolean(env.OPENCLAW_GATEWAY_SERVICE);
  const hasUrl = Boolean(env.OPENCLAW_GATEWAY_URL);
  if (!hasService && !hasUrl) {
    return { ok: false, status: 0, error: 'NO_GATEWAY_TARGET' };
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-request-id': requestId,
  };

  if (env.OPENCLAW_GATEWAY_AUTH_TOKEN) {
    headers['authorization'] = `Bearer ${env.OPENCLAW_GATEWAY_AUTH_TOKEN}`;
  }

  const requestBody = JSON.stringify({
    channel: 'telegram',
    requestId,
    update,
  });

  let res: Response;
  if (env.OPENCLAW_GATEWAY_SERVICE) {
    res = await env.OPENCLAW_GATEWAY_SERVICE.fetch('https://openclaw-gateway/v1/ingress/telegram', {
      method: 'POST',
      headers,
      body: requestBody,
    });
  } else {
    res = await fetch(env.OPENCLAW_GATEWAY_URL as string, {
      method: 'POST',
      headers,
      body: requestBody,
    });
  }

  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body };
}

function verifyTelegramSecret(
  req: Request,
  env: Env,
  localRuntime: boolean
): { ok: boolean; got: string; expectedSet: boolean } {
  const expected = env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
  const got = req.headers.get('x-telegram-bot-api-secret-token') || '';
  if (!expected) {
    return { ok: localRuntime, got, expectedSet: false };
  }
  return { ok: got === expected, got, expectedSet: true };
}

const worker = {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const localRuntime = isLocalRuntimeRequest(req, env);
    const missingConfig = missingRequiredConfig(env, localRuntime);

    if (url.pathname === '/health') {
      const healthy = missingConfig.length === 0;
      return json(
        {
          ok: healthy,
          env: env.ENVIRONMENT,
          localRuntime,
          sharedstate: env.SHAREDSTATE_API_BASE,
          gatewayConfigured: Boolean(env.OPENCLAW_GATEWAY_URL),
          gatewayServiceBound: Boolean(env.OPENCLAW_GATEWAY_SERVICE),
          authConfigured: {
            sharedstate: Boolean(env.SHAREDSTATE_AUTH_TOKEN),
            telegramWebhook: Boolean(env.TELEGRAM_WEBHOOK_SECRET_TOKEN),
            gateway: Boolean(env.OPENCLAW_GATEWAY_AUTH_TOKEN),
            telegramBot: Boolean(env.TELEGRAM_BOT_TOKEN),
          },
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

    if (url.pathname === '/webhooks/telegram' && req.method === 'POST') {
      const v = verifyTelegramSecret(req, env, localRuntime);
      if (!v.ok) {
        return json({ ok: false, error: 'UNAUTHORIZED_WEBHOOK' }, { status: 401 });
      }

      const update = await req.json<TelegramUpdate>().catch(() => null);
      if (!update) {
        return json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
      }

      const receipt = {
        by: 'openclaw-runtime',
        type: 'deposit',
        scope: { runtime: 'telegram', agent: 'webhook' },
        perm: { visibility: 'team', writeScope: 'sharedstate' },
        refs: [{ kind: 'task', ref: 'telegram-inbound' }],
        data: {
          kind: 'telegram.update',
          verification: { expectedSet: v.expectedSet, ok: v.ok, gotLen: v.got.length },
          update_id: update.update_id,
          message: update.message
            ? {
                message_id: update.message.message_id,
                date: update.message.date,
                chat: update.message.chat
                  ? { id: update.message.chat.id, type: update.message.chat.type }
                  : undefined,
                from: update.message.from
                  ? { id: update.message.from.id, username: update.message.from.username }
                  : undefined,
                text: update.message.text,
              }
            : undefined,
        },
      };

      const deposited = await depositReceipt(env, receipt);
      // console.log('telegram_webhook_deposit', deposited);

      const chatId = update?.message?.chat?.id;
      const requestId = `tg_${update?.update_id || crypto.randomUUID()}`;

      let gateway: { ok: boolean; status?: number; error?: string; body?: unknown } = {
        ok: false,
        error: 'SKIPPED_NO_CHAT',
      };
      let sent: { ok: boolean; status?: number; body?: unknown } | null = null;
      let fallbackUsed = false;

      if (chatId) {
        gateway = await callGateway(env, update, requestId);
        const gatewayReply = (gateway?.body as { replyText?: string })?.replyText;

        let outboundText: string;
        if (gateway.ok && typeof gatewayReply === 'string' && gatewayReply.trim().length > 0) {
          outboundText = gatewayReply;
        } else {
          fallbackUsed = true;
          outboundText =
            '⚠️ Gateway temporarily unavailable. Your message was received and logged; retrying path is active.';

          const stallReceipt = {
            by: 'openclaw-runtime',
            type: 'stall',
            scope: { runtime: 'telegram', agent: 'gateway-fallback' },
            perm: { visibility: 'team', writeScope: 'sharedstate' },
            refs: [{ kind: 'task', ref: 'gateway-down' }],
            data: {
              kind: 'gateway.failure',
              requestId,
              update_id: update?.update_id,
              gatewayStatus: gateway?.status,
              gatewayError: gateway?.error || null,
            },
          };
          await depositReceipt(env, stallReceipt);
        }

        sent = await telegramSendMessage(env, chatId, outboundText);

        const outboundReceipt = {
          by: 'openclaw-runtime',
          type: 'state_change',
          scope: { runtime: 'telegram', agent: 'webhook' },
          perm: { visibility: 'team', writeScope: 'sharedstate' },
          refs: [{ kind: 'task', ref: 'telegram-outbound' }],
          data: {
            kind: 'telegram.send',
            requestId,
            update_id: update?.update_id,
            chat_id: chatId,
            sendOk: Boolean(sent?.ok),
            sendStatus: sent?.status,
            fallbackUsed,
            gatewayOk: Boolean(gateway?.ok),
            gatewayStatus: gateway?.status,
          },
        };
        await depositReceipt(env, outboundReceipt);
      }

      return json({
        ok: true,
        deposited: { ok: deposited.ok, status: deposited.status, via: deposited.via },
        gateway: { ok: gateway?.ok, status: gateway?.status, fallbackUsed },
        sent: { ok: sent?.ok, status: sent?.status },
      });
    }

    return json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  },
};

export default worker;
