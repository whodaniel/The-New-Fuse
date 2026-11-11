interface Env {
  GCP_API_URL: string;
  CORS_ALLOWED_ORIGINS?: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const DEFAULT_ALLOWED_ORIGINS = [
  'https://app.thenewfuse.com',
  'https://thenewfuse.com',
  'https://www.thenewfuse.com',
  'https://production.thenewfuse-main.pages.dev',
] as const;

const CORS_ALLOW_METHODS = 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS';
const CORS_ALLOW_HEADERS =
  'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Request-ID, X-Client-IP, x-api-key';

const UPSTREAM_CORS_HEADERS = [
  'Access-Control-Allow-Origin',
  'Access-Control-Allow-Credentials',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Headers',
  'Access-Control-Max-Age',
  'Access-Control-Expose-Headers',
] as const;

function normalizeOrigin(value: string): string | null {
  const candidate = value.trim();
  if (!candidate || candidate.includes('*')) return null;

  try {
    const parsed = new URL(candidate);
    if (
      (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      parsed.username ||
      parsed.password ||
      parsed.origin === 'null'
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function allowedOrigins(env: Env): Set<string> {
  const configured = env.CORS_ALLOWED_ORIGINS?.trim();
  const candidates = configured ? configured.split(',') : DEFAULT_ALLOWED_ORIGINS;

  return new Set(
    candidates
      .map((candidate) => normalizeOrigin(candidate))
      .filter((candidate): candidate is string => candidate !== null)
  );
}

function allowedRequestOrigin(request: Request, env: Env): string | null {
  const requestOrigin = request.headers.get('Origin');
  if (!requestOrigin) return null;

  const normalized = normalizeOrigin(requestOrigin);
  return normalized && allowedOrigins(env).has(normalized) ? normalized : null;
}

function appendVaryOrigin(headers: Headers): void {
  const vary = headers.get('Vary');
  if (!vary) {
    headers.set('Vary', 'Origin');
    return;
  }

  const values = vary.split(',').map((value) => value.trim().toLowerCase());
  if (!values.includes('*') && !values.includes('origin')) {
    headers.set('Vary', `${vary}, Origin`);
  }
}

function stripUpstreamCors(headers: Headers): void {
  for (const header of UPSTREAM_CORS_HEADERS) {
    headers.delete(header);
  }
}

function applyCorsToResponse(response: Response, request: Request, env: Env): Response {
  stripUpstreamCors(response.headers);
  appendVaryOrigin(response.headers);

  const origin = allowedRequestOrigin(request, env);
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

function corsPreflightResponse(request: Request, env: Env): Response {
  const headers = new Headers();
  appendVaryOrigin(headers);

  const origin = allowedRequestOrigin(request, env);
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
    headers.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
    headers.set('Access-Control-Max-Age', '86400');
  }

  return new Response(null, { status: 204, headers });
}

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
async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
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

function isEdgeFallbackPath(pathname: string): boolean {
  return (
    pathname === '/health' ||
    pathname === '/api/health' ||
    pathname === '/api/system/health' ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/billing/membership/me' ||
    pathname === '/api/billing/stripe/config' ||
    pathname === '/api/billing/stripe/checkout' ||
    pathname === '/api/billing/stripe/checkout-session' ||
    pathname === '/api/pricing'
  );
}

function formatSupabaseUser(supaUser: Record<string, any>) {
  const userMeta =
    supaUser.user_metadata && typeof supaUser.user_metadata === 'object'
      ? (supaUser.user_metadata as Record<string, unknown>)
      : {};
  const appMeta =
    supaUser.app_metadata && typeof supaUser.app_metadata === 'object'
      ? (supaUser.app_metadata as Record<string, unknown>)
      : {};
  const rawRole = String(appMeta.role ?? userMeta.role ?? supaUser.role ?? 'USER');
  const role =
    rawRole.toLowerCase() === 'authenticated' || rawRole.toLowerCase() === 'anon' || !rawRole
      ? 'USER'
      : rawRole;
  const roles = Array.isArray(appMeta.roles)
    ? appMeta.roles.map((r: unknown) => String(r))
    : Array.isArray(userMeta.roles)
      ? userMeta.roles.map((r: unknown) => String(r))
      : [role];
  const email = String(supaUser.email ?? userMeta.email ?? '');
  const name = String(userMeta.full_name ?? userMeta.name ?? (email || 'User'));
  return {
    id: String(supaUser.id),
    email,
    name,
    role,
    roles,
    emailVerified: Boolean(supaUser.email_confirmed_at || supaUser.confirmed_at),
  };
}

async function verifySupabaseAccessToken(
  accessToken: string,
  env: Env
): Promise<ReturnType<typeof formatSupabaseUser> | null> {
  if (!accessToken || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const baseUrl = env.SUPABASE_URL.replace(/\/+$/, '');
  try {
    const res = await fetch(`${baseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    const rawUser = (await res.json()) as Record<string, any>;
    if (!rawUser?.id) return null;
    return formatSupabaseUser(rawUser);
  } catch {
    return null;
  }
}

function extractBearerToken(request: Request, body?: Record<string, unknown>): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const candidate = body?.accessToken ?? body?.access_token ?? body?.token;
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }
  return null;
}

async function handleEdgeAuthFallback(
  request: Request,
  pathname: string,
  bodyText: string,
  env: Env
): Promise<Response | null> {
  const jsonResponse = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-TNF-Edge-Auth': 'supabase-fallback',
      },
    });

  if (
    request.method === 'GET' &&
    (pathname === '/health' || pathname === '/api/health' || pathname === '/api/system/health')
  ) {
    return jsonResponse({
      status: 'ok',
      mode: 'edge-fallback',
      timestamp: new Date().toISOString(),
    });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  let parsedBody: Record<string, unknown> = {};
  if (bodyText) {
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed === 'object') {
        parsedBody = parsed as Record<string, unknown>;
      }
    } catch {
      /* ignore invalid JSON */
    }
  }

  if (request.method === 'GET' && pathname === '/api/auth/me') {
    const token = extractBearerToken(request);
    if (!token) return jsonResponse({ message: 'Unauthorized' }, 401);
    const user = await verifySupabaseAccessToken(token, env);
    if (!user) return jsonResponse({ message: 'Invalid or expired token' }, 401);
    return jsonResponse(user, 200);
  }

  if (
    request.method === 'GET' &&
    (pathname === '/api/auth/session' || pathname === '/api/auth/status')
  ) {
    const token = extractBearerToken(request);
    if (!token) return jsonResponse({ authenticated: false, user: null }, 200);
    const user = await verifySupabaseAccessToken(token, env);
    if (!user) return jsonResponse({ authenticated: false, user: null }, 401);
    return jsonResponse({ authenticated: true, user }, 200);
  }

  if (request.method === 'POST' && pathname === '/api/auth/supabase') {
    const token = extractBearerToken(request, parsedBody);
    if (!token) return jsonResponse({ message: 'accessToken is required' }, 400);
    const user = await verifySupabaseAccessToken(token, env);
    if (!user) return jsonResponse({ message: 'Invalid Supabase access token' }, 401);
    return jsonResponse(
      {
        accessToken: token,
        access_token: token,
        token,
        user,
      },
      200
    );
  }

  if (request.method === 'POST' && pathname === '/api/auth/login') {
    const email = typeof parsedBody.email === 'string' ? parsedBody.email.trim() : '';
    const password = typeof parsedBody.password === 'string' ? parsedBody.password : '';
    if (!email || !password) {
      return jsonResponse({ message: 'Email and password are required' }, 400);
    }
    const baseUrl = env.SUPABASE_URL.replace(/\/+$/, '');
    try {
      const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        return jsonResponse({ message: 'Invalid email or password' }, 401);
      }
      const data = (await res.json()) as Record<string, any>;
      const accessToken = String(data.access_token || '');
      const refreshToken = data.refresh_token ? String(data.refresh_token) : null;
      if (!accessToken || !data.user?.id) {
        return jsonResponse({ message: 'Authentication failed' }, 401);
      }
      const user = formatSupabaseUser(data.user);
      return jsonResponse(
        {
          accessToken,
          access_token: accessToken,
          token: accessToken,
          refreshToken,
          refresh_token: refreshToken,
          user,
        },
        200
      );
    } catch {
      return null;
    }
  }

  if (request.method === 'POST' && pathname === '/api/auth/refresh') {
    const refreshToken =
      typeof parsedBody.refreshToken === 'string'
        ? parsedBody.refreshToken.trim()
        : typeof parsedBody.refresh_token === 'string'
          ? parsedBody.refresh_token.trim()
          : '';
    if (!refreshToken) {
      return jsonResponse({ message: 'Refresh token required' }, 401);
    }
    const baseUrl = env.SUPABASE_URL.replace(/\/+$/, '');
    try {
      const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        return jsonResponse({ message: 'Invalid or expired refresh token' }, 401);
      }
      const data = (await res.json()) as Record<string, any>;
      const accessToken = String(data.access_token || '');
      if (!accessToken) {
        return jsonResponse({ message: 'Invalid refresh response' }, 401);
      }
      const nextRefresh = data.refresh_token ? String(data.refresh_token) : refreshToken;
      return jsonResponse(
        {
          accessToken,
          access_token: accessToken,
          token: accessToken,
          refreshToken: nextRefresh,
          refresh_token: nextRefresh,
          user: data.user?.id ? formatSupabaseUser(data.user) : undefined,
        },
        200
      );
    } catch {
      return null;
    }
  }

  if (request.method === 'POST' && pathname === '/api/auth/logout') {
    return jsonResponse({ success: true }, 200);
  }

  if (request.method === 'GET' && pathname === '/api/billing/membership/me') {
    const token = extractBearerToken(request);
    if (!token) return jsonResponse({ message: 'Unauthorized' }, 401);
    const user = await verifySupabaseAccessToken(token, env);
    if (!user) return jsonResponse({ message: 'Unauthorized' }, 401);
    return jsonResponse(
      {
        found: true,
        active: true,
        tier: 'PRO',
        userId: user.id,
      },
      200
    );
  }

  if (request.method === 'GET' && pathname === '/api/billing/stripe/config') {
    return jsonResponse(
      {
        checkoutEnabled: { PRO: false, ENTERPRISE: false },
        commercialSalesEnabled: false,
        mode: 'prelaunch-access-vr',
      },
      200
    );
  }

  if (
    request.method === 'POST' &&
    (pathname === '/api/billing/stripe/checkout' ||
      pathname === '/api/billing/stripe/checkout-session')
  ) {
    return jsonResponse(
      {
        prelaunch: true,
        commercialSalesEnabled: false,
        url: '/dashboard?access=early_access',
        message:
          'Early Access Beta: Commercial billing is paused ($0.00). Your workspace access is unlocked!',
      },
      200
    );
  }

  if (request.method === 'GET' && pathname === '/api/pricing') {
    return jsonResponse(
      {
        plans: [
          { id: 'STARTER', name: 'Starter', priceMonthly: 0, currency: 'USD' },
          { id: 'PRO', name: 'Pro', priceMonthly: 29, currency: 'USD' },
          { id: 'ENTERPRISE', name: 'Enterprise', priceMonthly: 99, currency: 'USD' },
        ],
      },
      200
    );
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env, _ctx: WorkerExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight for ALL requests (must be first)
    if (request.method === 'OPTIONS') {
      return corsPreflightResponse(request, env);
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

    const canFallbackAtEdge = isEdgeFallbackPath(url.pathname);
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const bufferedBodyText =
      canFallbackAtEdge && hasBody ? await request.text().catch(() => '') : '';

    // Create a new request based on the original, but with the target URL
    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: canFallbackAtEdge ? (hasBody ? bufferedBodyText : null) : request.body,
      redirect: 'manual',
    });

    try {
      // Fetch from GCP Cloud Run
      const response = await fetch(newRequest);

      if (response.status >= 500 && canFallbackAtEdge) {
        const fallbackResponse = await handleEdgeAuthFallback(
          request,
          url.pathname,
          bufferedBodyText,
          env
        );
        if (fallbackResponse) {
          return applyCorsToResponse(fallbackResponse, request, env);
        }
      }

      if (request.method === 'GET' && url.pathname === '/api/billing/membership/me') {
        const commercialSalesEnabled =
          String((env as unknown as Record<string, unknown>).COMMERCIAL_SALES_ENABLED || '')
            .trim()
            .toLowerCase() === 'true';

        if (response.status === 401) {
          const token = extractBearerToken(request);
          const supaUser = token ? await verifySupabaseAccessToken(token, env) : null;
          if (supaUser) {
            const bridged = new Response(
              JSON.stringify({
                found: true,
                active: true,
                tier: 'STARTER',
                prelaunch: !commercialSalesEnabled,
                userId: supaUser.id,
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            );
            return applyCorsToResponse(bridged, request, env);
          }
        }

        if (response.status === 200 && !commercialSalesEnabled) {
          try {
            const raw = (await response.clone().json()) as Record<string, any>;
            const inner = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
            if (inner && inner.active === false && inner.found !== false) {
              const patchedPayload =
                raw?.data && typeof raw.data === 'object'
                  ? { ...raw, data: { ...inner, active: true, prelaunch: true } }
                  : { ...inner, active: true, prelaunch: true };
              const patchedResponse = new Response(JSON.stringify(patchedPayload), {
                status: 200,
                headers: response.headers,
              });
              patchedResponse.headers.set('Content-Type', 'application/json');
              return applyCorsToResponse(patchedResponse, request, env);
            }
          } catch {
            /* fall through to normal response */
          }
        }
      }

      // Create a new response to allow modifying headers
      const newResponse = new Response(response.body, response);

      return applyCorsToResponse(newResponse, request, env);
    } catch (error) {
      if (canFallbackAtEdge) {
        const fallbackResponse = await handleEdgeAuthFallback(
          request,
          url.pathname,
          bufferedBodyText,
          env
        );
        if (fallbackResponse) {
          return applyCorsToResponse(fallbackResponse, request, env);
        }
      }
      console.error('Proxy fetch failed:', error);
      return applyCorsToResponse(
        new Response(
          JSON.stringify({
            error: 'Proxy Fetch Failed',
            message: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
        request,
        env
      );
    }
  },
};
