import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const cwd = import.meta.dirname || process.cwd();

async function waitForHealth(baseUrl, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await delay(120);
  }
  throw new Error('server did not become healthy in time');
}

function startServer(port) {
  const dataDir = path.join(cwd, '.data-tests', `port-${port}`);
  const proc = spawn('node', ['server.js'], {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
      CASIN8_DATA_DIR: dataDir,
      CASIN8_ALLOW_INSECURE_DEV_BYPASS: '1',
      CASIN8_STRIPE_WEBHOOK_SECRET: 'stripe-secret-test',
      CASIN8_PAYPAL_WEBHOOK_SECRET: 'paypal-secret-test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  proc.stderr.on('data', (buf) => {
    stderr += String(buf);
  });
  return { proc, getStderr: () => stderr };
}

async function api(baseUrl, pathName, opts = {}) {
  const res = await fetch(`${baseUrl}${pathName}`, {
    method: opts.method || 'GET',
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json();
  return { res, json };
}

function webhookSig(secret, payloadObj) {
  const ts = Math.floor(Date.now() / 1000);
  const raw = JSON.stringify(payloadObj);
  const sig = crypto.createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex');
  return { raw, header: `t=${ts},v1=${sig}` };
}

test('Swarm G/H/I persistence + provider webhook normalization + sponsorship product APIs', async (t) => {
  const port = 9100 + Math.floor(Math.random() * 400);
  const baseUrl = `http://127.0.0.1:${port}`;
  const run1 = startServer(port);
  t.after(() => run1.proc.kill('SIGTERM'));
  await waitForHealth(baseUrl);

  const playerId = `p-${Date.now()}`;
  const sponsorId = `s-${Date.now()}`;
  const orderId = `ord-${Date.now()}`;
  const positionId = `pos-${Date.now()}`;

  const compliance = await api(baseUrl, '/api/compliance/upsert', {
    method: 'POST',
    body: { playerId, kycStatus: 'approved', countryCode: 'US', amlRiskLevel: 'low' },
  });
  assert.equal(compliance.res.status, 200);

  const deposit = await api(baseUrl, '/api/cashier/deposit', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId: sponsorId,
      amountUnits: 5000,
      idempotencyKey: `dep-${positionId}`,
      source: 'manual-test',
    },
  });
  assert.equal(deposit.res.status, 200);

  const intent = await api(baseUrl, '/api/payments/intent', {
    method: 'POST',
    body: {
      provider: 'stripe',
      playerId,
      orderId,
      fiatCurrency: 'USD',
      fiatAmountMinor: 999,
      tokenUnits: '500',
      ledgerId: 'default',
    },
  });
  assert.equal(intent.res.status, 201);
  assert.equal(intent.json.order.orderId, orderId);

  const stripeWebhookPayload = {
    id: `evt-${Date.now()}`,
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: { orderId },
        charges: {
          data: [
            {
              outcome: { risk_level: 'normal', risk_score: 12 },
              payment_method_details: {
                card: { checks: { cvc_check: 'pass', address_postal_code_check: 'pass' } },
              },
            },
          ],
        },
      },
    },
  };
  const sig = webhookSig('stripe-secret-test', stripeWebhookPayload);
  const webhook1 = await fetch(`${baseUrl}/api/payments/webhook/stripe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-casin8-signature': sig.header },
    body: sig.raw,
  });
  const webhookJson1 = await webhook1.json();
  assert.equal(webhook1.status, 200);
  assert.equal(webhookJson1.ok, true);
  assert.equal(webhookJson1.order.providerFraudSignals.riskLevel, 'normal');

  const open = await api(baseUrl, '/api/sponsorships/open', {
    method: 'POST',
    body: {
      positionId,
      agentId: `agent-${Date.now()}`,
      stakeForSaleBps: 7000,
      markupBps: 11000,
      maxExposureUnits: 500000,
    },
  });
  assert.equal(open.res.status, 201);

  const oneClick = await api(baseUrl, '/api/sponsorships/one-click-fund', {
    method: 'POST',
    body: {
      positionId,
      sponsorId,
      playerId: sponsorId,
      principalUnits: 300,
      ledgerId: 'default',
      idempotencyKey: `ocf-${positionId}-1`,
    },
  });
  assert.equal(oneClick.res.status, 200);

  const market = await api(baseUrl, '/api/sponsorships/marketplace?limit=20');
  assert.equal(market.res.status, 200);
  assert.equal(Array.isArray(market.json.positions), true);

  const analytics = await api(
    baseUrl,
    `/api/sponsorships/sponsor-analytics?sponsorId=${encodeURIComponent(sponsorId)}`
  );
  assert.equal(analytics.res.status, 200);
  assert.equal(analytics.json.sponsorId, sponsorId);

  run1.proc.kill('SIGTERM');
  await delay(350);

  const run2 = startServer(port);
  t.after(() => run2.proc.kill('SIGTERM'));
  await waitForHealth(baseUrl);

  const webhookReplay = await fetch(`${baseUrl}/api/payments/webhook/stripe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-casin8-signature': sig.header },
    body: sig.raw,
  });
  const replayJson = await webhookReplay.json();
  assert.equal(webhookReplay.status, 200);
  assert.equal(replayJson.duplicate, true);

  const orderRead = await api(
    baseUrl,
    `/api/payments/order?orderId=${encodeURIComponent(orderId)}`
  );
  assert.equal(orderRead.res.status, 200);
  assert.equal(orderRead.json.order.status, 'paid');

  const market2 = await api(baseUrl, '/api/sponsorships/marketplace?limit=20');
  assert.equal(market2.res.status, 200);
  assert.equal(
    market2.json.positions.some((p) => p.positionId === positionId),
    true
  );

  assert.equal(run1.getStderr(), '');
  assert.equal(run2.getStderr(), '');
});
