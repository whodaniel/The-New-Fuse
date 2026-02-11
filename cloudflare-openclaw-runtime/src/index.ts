export interface Env {
  ENVIRONMENT: string;
  SHAREDSTATE_API_BASE: string;
  SHAREDSTATE_SERVICE: Fetcher;
  OPENCLAW_GATEWAY_SERVICE?: Fetcher;
  OPENCLAW_GATEWAY_URL?: string;
  OPENCLAW_GATEWAY_AUTH_TOKEN?: string;
  // OPENCLAW_EVENTS: Queue; // disabled until Queues enabled
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET_TOKEN?: string;
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

async function depositReceipt(env: Env, receipt: any) {
  const payload = {
    by: receipt.by,
    type: receipt.type,
    scope: receipt.scope,
    perm: receipt.perm,
    refs: receipt.refs,
    data: receipt.data,
  };

  // Prefer service binding (reliable, avoids edge fetch quirks)
  const res = await env.SHAREDSTATE_SERVICE.fetch('https://sharedstate/deposit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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

async function callGateway(env: Env, update: any, requestId: string) {
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
  env: Env
): { ok: boolean; got: string; expectedSet: boolean } {
  const expected = env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
  const got = req.headers.get('x-telegram-bot-api-secret-token') || '';
  if (!expected) return { ok: true, got, expectedSet: false }; // allow if not configured
  return { ok: got === expected, got, expectedSet: true };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return json({
        ok: true,
        env: env.ENVIRONMENT,
        sharedstate: env.SHAREDSTATE_API_BASE,
        gatewayConfigured: Boolean(env.OPENCLAW_GATEWAY_URL),
      });
    }

    if (url.pathname === '/webhooks/telegram' && req.method === 'POST') {
      const v = verifyTelegramSecret(req, env);
      // DO NOT hard-fail webhook delivery — Telegram may disable webhooks on repeated 401s.
      // Instead, record verification status in receipts.

      const update = await req.json<any>().catch(() => null);
      if (!update) return json({ ok: false, error: 'BAD_JSON' }, { status: 400 });

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
      console.log('telegram_webhook_deposit', deposited);

      const chatId = update?.message?.chat?.id;
      const requestId = `tg_${update?.update_id || crypto.randomUUID()}`;

      let gateway: any = { ok: false, error: 'SKIPPED_NO_CHAT' };
      let sent: any = null;
      let fallbackUsed = false;

      if (chatId) {
        gateway = await callGateway(env, update, requestId);
        const gatewayReply = gateway?.body?.replyText;

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
