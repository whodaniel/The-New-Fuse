import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import worker from '../src/index.ts';

const originalFetch = globalThis.fetch;

const defaultEnv = {
  GCP_API_URL: 'https://upstream.example.test',
  STRIPE_WEBHOOK_SECRET: 'test-signing-secret',
  SUPABASE_URL: 'https://database.example.test',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
};

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

function invoke(request, env = {}) {
  return worker.fetch(request, { ...defaultEnv, ...env }, context);
}

function stubUpstream(responseFactory = () => new Response('upstream ok')) {
  const requests = [];
  globalThis.fetch = async (request) => {
    requests.push(request);
    return responseFactory(request);
  };
  return requests;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('credentialed CORS containment', { concurrency: false }, () => {
  test('allows a canonical production origin with an explicit preflight policy', async () => {
    const response = await invoke(
      new Request('https://api.thenewfuse.com/api/session', {
        method: 'OPTIONS',
        headers: { Origin: 'https://app.thenewfuse.com' },
      })
    );

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://app.thenewfuse.com');
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true');
    assert.equal(
      response.headers.get('Access-Control-Allow-Methods'),
      'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    assert.equal(
      response.headers.get('Access-Control-Allow-Headers'),
      'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Request-ID, X-Client-IP, x-api-key'
    );
    assert.equal(response.headers.get('Access-Control-Max-Age'), '86400');
    assert.equal(response.headers.get('Vary'), 'Origin');
    assert.ok(!response.headers.get('Access-Control-Allow-Headers').includes('*'));
  });

  test('returns no CORS permission headers to an unknown preflight origin', async () => {
    const response = await invoke(
      new Request('https://api.thenewfuse.com/api/session', {
        method: 'OPTIONS',
        headers: { Origin: 'https://attacker.example' },
      })
    );

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Methods'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), null);
  });

  test('replaces upstream wildcard CORS for an allowed response', async () => {
    const requests = stubUpstream(
      () =>
        new Response('proxied', {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Expose-Headers': '*',
            Vary: 'Accept-Encoding',
          },
        })
    );

    const response = await invoke(
      new Request('https://api.thenewfuse.com/api/v1/users?active=true', {
        headers: { Origin: 'https://thenewfuse.com' },
      })
    );

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'proxied');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://thenewfuse.com');
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true');
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), null);
    assert.equal(response.headers.get('Access-Control-Expose-Headers'), null);
    assert.equal(response.headers.get('Vary'), 'Accept-Encoding, Origin');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://upstream.example.test/api/users?active=true');
  });

  test('strips upstream CORS permission from an unknown origin while still proxying', async () => {
    const requests = stubUpstream(
      () =>
        new Response('proxied', {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
          },
        })
    );

    const response = await invoke(
      new Request('https://api.thenewfuse.com/api/users', {
        headers: { Origin: 'https://attacker.example' },
      })
    );

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'proxied');
    assert.equal(requests.length, 1);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
  });

  test('keeps originless non-browser traffic functional without credentialed CORS', async () => {
    const requests = stubUpstream(() => new Response('cli response', { status: 202 }));

    const response = await invoke(new Request('https://api.thenewfuse.com/api/jobs'));

    assert.equal(response.status, 202);
    assert.equal(await response.text(), 'cli response');
    assert.equal(requests.length, 1);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
  });

  test('uses a normalized configured allowlist as a replacement for defaults', async () => {
    stubUpstream();
    const env = {
      CORS_ALLOWED_ORIGINS: ' https://staging.thenewfuse.com/path , http://localhost:1420/ ',
    };

    const configuredResponse = await invoke(
      new Request('https://api.thenewfuse.com/api/users', {
        headers: { Origin: 'https://staging.thenewfuse.com' },
      }),
      env
    );
    const formerDefaultResponse = await invoke(
      new Request('https://api.thenewfuse.com/api/users', {
        headers: { Origin: 'https://app.thenewfuse.com' },
      }),
      env
    );

    assert.equal(
      configuredResponse.headers.get('Access-Control-Allow-Origin'),
      'https://staging.thenewfuse.com'
    );
    assert.equal(formerDefaultResponse.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(formerDefaultResponse.headers.get('Access-Control-Allow-Credentials'), null);
  });

  test('rejects malformed and wildcard override entries without broadening trust', async () => {
    stubUpstream();
    const env = {
      CORS_ALLOWED_ORIGINS: '*,https://*.thenewfuse.com,not-a-url,ftp://app.thenewfuse.com',
    };

    const response = await invoke(
      new Request('https://api.thenewfuse.com/api/users', {
        headers: { Origin: 'https://app.thenewfuse.com' },
      }),
      env
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
  });

  test('keeps proxy failures readable only to allowed browser origins', async () => {
    globalThis.fetch = async () => {
      throw new Error('upstream unavailable');
    };

    const allowedResponse = await invoke(
      new Request('https://api.thenewfuse.com/api/users', {
        headers: { Origin: 'https://www.thenewfuse.com' },
      })
    );
    const unknownResponse = await invoke(
      new Request('https://api.thenewfuse.com/api/users', {
        headers: { Origin: 'https://attacker.example' },
      })
    );

    assert.equal(allowedResponse.status, 502);
    assert.equal(
      allowedResponse.headers.get('Access-Control-Allow-Origin'),
      'https://www.thenewfuse.com'
    );
    assert.equal(allowedResponse.headers.get('Access-Control-Allow-Credentials'), 'true');
    assert.equal(unknownResponse.status, 502);
    assert.equal(unknownResponse.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(unknownResponse.headers.get('Access-Control-Allow-Credentials'), null);
  });

  test('preserves verified Stripe webhook handling ahead of the generic proxy', async () => {
    const body = JSON.stringify({ id: 'evt_test', type: 'customer.created', data: { object: {} } });
    const timestamp = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(defaultEnv.STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${timestamp}.${body}`)
    );
    const signatureHex = Array.from(new Uint8Array(signature), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    globalThis.fetch = async () => {
      assert.fail('generic upstream proxy must not handle Stripe webhooks');
    };
    const response = await invoke(
      new Request('https://api.thenewfuse.com/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://attacker.example',
          'Stripe-Signature': `t=${timestamp},v1=${signatureHex}`,
        },
        body,
      })
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { received: true });
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
  });
});
