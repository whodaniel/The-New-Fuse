/**
 * Verifies a Stripe webhook signature and returns the parsed event.
 * Mirrors the manual HMAC-SHA256 verification already used in
 * apps/api/src/modules/billing/stripe.controller.ts, using Workers-native
 * Web Crypto instead of Node's `crypto` module.
 */
async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300
): Promise<{ ok: true; event: any } | { ok: false; reason: string }> {
  if (!signatureHeader) return { ok: false, reason: 'missing Stripe-Signature header' };

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    })
  );
  const timestamp = parts['t'];
  const v1 = parts['v1'];
  if (!timestamp || !v1) return { ok: false, reason: 'malformed Stripe-Signature header' };

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) {
    return { ok: false, reason: 'timestamp outside tolerance' };
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`)
  );
  const expectedHex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (expectedHex.length !== v1.length) return { ok: false, reason: 'signature mismatch' };
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  if (diff !== 0) return { ok: false, reason: 'signature mismatch' };

  try {
    return { ok: true, event: JSON.parse(rawBody) };
  } catch {
    return { ok: false, reason: 'body is not valid JSON' };
  }
}

/**
 * Handles POST /webhooks/stripe entirely at the edge: verifies the
 * signature, and on checkout.session.completed writes a row into Supabase
 * (service-role key bypasses RLS; the table has no other write path).
 */
async function handleStripeWebhook(request: Request, env: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await request.text();
  const result = await verifyStripeSignature(
    rawBody,
    request.headers.get('Stripe-Signature'),
    env.STRIPE_WEBHOOK_SECRET
  );

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.reason }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { event } = result;

  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object ?? {};
    try {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/stripe_purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          stripe_event_id: event.id,
          customer_email: session.customer_details?.email ?? null,
          product_name: session.line_items?.data?.[0]?.description ?? null,
          amount_total: session.amount_total ?? null,
          currency: session.currency ?? null,
          payment_status: session.payment_status ?? null,
          raw_event: event,
        }),
      });
      if (!res.ok) {
        console.error('Supabase insert failed:', res.status, await res.text());
      }
    } catch (err) {
      console.error('Supabase insert error:', err);
    }
  }

  // Always 200 once the signature is verified, even for event types we
  // don't act on yet — only a bad signature should make Stripe retry.
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight for ALL requests (must be first)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Stripe webhooks are handled entirely at the edge, before the generic
    // GCP proxy below — see docs/webhooks/integrations/stripe.md.
    if (url.pathname === '/webhooks/stripe') {
      return handleStripeWebhook(request, env);
    }

    // The public API now proxies to the core API server, whose routes are
    // mounted at /api/* without URI versioning. Preserve unversioned client
    // paths and normalize legacy /api/v1/* or /v1/* callers back to /api/*.
    if (url.pathname.startsWith('/api/v1/')) {
      url.pathname = url.pathname.replace('/api/v1/', '/api/');
    } else if (url.pathname === '/api/v1') {
      url.pathname = '/api';
    }

    if (url.pathname.startsWith('/v1/') || url.pathname === '/v1') {
      url.pathname = url.pathname.replace(/^\/v1/, '/api');
    }

    // Construct the target URL on GCP Cloud Run
    const targetUrl = new URL(env.GCP_API_URL);
    targetUrl.pathname = url.pathname;
    targetUrl.search = url.search;

    // Create a new request based on the original, but with the target URL
    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    });

    try {
      // Fetch from GCP Cloud Run
      const response = await fetch(newRequest);

      // Create a new response to allow modifying headers
      const newResponse = new Response(response.body, response);

      // Force CORS injection to support browser-based clients
      if (origin) {
        newResponse.headers.set('Access-Control-Allow-Origin', origin);
      } else {
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
      }

      newResponse.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD'
      );
      newResponse.headers.set('Access-Control-Allow-Headers', '*');
      newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

      return newResponse;
    } catch (error) {
      console.error('Proxy fetch failed:', error);
      return new Response(
        JSON.stringify({
          error: 'Proxy Fetch Failed',
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
          },
        }
      );
    }
  },
};
