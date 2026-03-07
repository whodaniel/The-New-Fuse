import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const cwd = import.meta.dirname || process.cwd();
const TEST_API_TOKEN = 'test-token';

async function waitForHealth(baseUrl, timeoutMs = 8000) {
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
      CASIN8_API_TOKENS: JSON.stringify({
        [TEST_API_TOKEN]: ['admin', 'poker', 'risk', 'compliance'],
      }),
      CASIN8_STRIPE_WEBHOOK_SECRET: 'stripe-secret-test',
      CASIN8_PAYPAL_WEBHOOK_SECRET: 'paypal-secret-test',
      CASIN8_RESERVE_ATTESTATION_SECRET: 'reserve-attestation-secret-test',
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
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${TEST_API_TOKEN}`,
      ...(opts.headers || {}),
    },
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

test('payments + compliance + webhook + sponsorship settle credit flow', async (t) => {
  const port = 4600 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc, getStderr } = startServer(port);
  const playerId = `p-risk-${Date.now()}`;
  const agentId = `ag-${Date.now()}`;
  const sponsorId = `sp-${Date.now()}`;
  const positionId = `pos-${Date.now()}`;
  const eventId = `ev-${Date.now()}`;
  t.after(() => proc.kill('SIGTERM'));
  await waitForHealth(baseUrl);

  const blockedDeposit = await api(baseUrl, '/api/cashier/deposit', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 1000,
      idempotencyKey: 'dep-risk-1',
      source: 'fiat-bridge',
    },
  });
  assert.equal(blockedDeposit.res.status, 403);

  const compliance = await api(baseUrl, '/api/compliance/upsert', {
    method: 'POST',
    body: {
      playerId,
      kycStatus: 'approved',
      countryCode: 'US',
      amlRiskLevel: 'low',
    },
  });
  assert.equal(compliance.res.status, 200);
  assert.equal(compliance.json.ok, true);

  const intent = await api(baseUrl, '/api/payments/intent', {
    method: 'POST',
    body: {
      provider: 'stripe',
      playerId,
      fiatCurrency: 'USD',
      fiatAmountMinor: 4999,
      tokenUnits: '2500',
      ledgerId: 'default',
    },
  });
  assert.equal(intent.res.status, 201);
  const orderId = intent.json.order.orderId;
  assert.ok(orderId);

  const ev = { eventId: `evt-st-${Date.now()}`, orderId, status: 'paid' };
  const sig = webhookSig('stripe-secret-test', ev);
  const webhook = await fetch(`${baseUrl}/api/payments/webhook/stripe`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-casin8-signature': sig.header,
    },
    body: sig.raw,
  });
  const webhookJson = await webhook.json();
  assert.equal(webhook.status, 200);
  assert.equal(webhookJson.ok, true);
  assert.equal(webhookJson.order.status, 'paid');

  const dupeWebhook = await fetch(`${baseUrl}/api/payments/webhook/stripe`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-casin8-signature': sig.header,
    },
    body: sig.raw,
  });
  const dupeJson = await dupeWebhook.json();
  assert.equal(dupeWebhook.status, 200);
  assert.equal(dupeJson.duplicate, true);

  const wallet = await api(
    baseUrl,
    `/api/cashier/wallet?ledgerId=default&playerId=${encodeURIComponent(playerId)}`
  );
  assert.equal(wallet.res.status, 200);
  assert.equal(wallet.json.wallet.availableUnits, '2500');

  const agent = await api(baseUrl, '/api/agents/register', {
    method: 'POST',
    body: { agentId, ownerId: 'owner-1', tier: 'B', style: 'tight_aggressive' },
  });
  assert.equal(agent.res.status, 201);

  const pos = await api(baseUrl, '/api/sponsorships/open', {
    method: 'POST',
    body: {
      positionId,
      agentId,
      stakeForSaleBps: 7000,
      markupBps: 11000,
      maxExposureUnits: 50000,
    },
  });
  assert.equal(pos.res.status, 201);
  const funded = await api(baseUrl, '/api/sponsorships/fund', {
    method: 'POST',
    body: { positionId, sponsorId, principalUnits: 1000 },
  });
  assert.equal(funded.res.status, 200);
  const closed = await api(baseUrl, '/api/sponsorships/close', {
    method: 'POST',
    body: { positionId },
  });
  assert.equal(closed.res.status, 200);

  const settleCredit = await api(baseUrl, '/api/sponsorships/settle-and-credit', {
    method: 'POST',
    body: {
      positionId,
      eventId,
      buyInUnits: 1000,
      prizeUnits: 1600,
      rakeUnits: 20,
      ledgerId: 'default',
      sponsorPlayerMap: { [sponsorId]: 'player-sponsor-1' },
    },
  });
  assert.equal(settleCredit.res.status, 200);
  assert.equal(Array.isArray(settleCredit.json.credits), true);

  const sim = await api(baseUrl, '/api/sponsorships/simulate', {
    method: 'POST',
    body: {
      runs: 120,
      stakeForSaleBps: 7000,
      principalUnits: 1000,
      buyInUnits: 1000,
      roiBpsMean: 300,
      roiBpsStdDev: 2800,
    },
  });
  assert.equal(sim.res.status, 200);
  assert.equal(sim.json.ok, true);
  assert.ok(['low', 'medium', 'high'].includes(sim.json.simulation.outputs.exploitRisk));

  const actionContract = await api(baseUrl, '/api/agents/action-contract');
  assert.equal(actionContract.res.status, 200);
  assert.equal(actionContract.json.ok, true);
  assert.equal(actionContract.json.contract.endpoint, '/api/strategy/decide');

  assert.equal(getStderr(), '');
});

test('treasury policy circuit breaker enforces reserve/withdraw/settle caps', async (t) => {
  const port = 4900 + Math.floor(Math.random() * 200);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc, getStderr } = startServer(port);
  const playerId = `p-treasury-${Date.now()}`;
  t.after(() => proc.kill('SIGTERM'));
  await waitForHealth(baseUrl);

  const compliance = await api(baseUrl, '/api/compliance/upsert', {
    method: 'POST',
    body: {
      playerId,
      kycStatus: 'approved',
      countryCode: 'US',
      amlRiskLevel: 'low',
    },
  });
  assert.equal(compliance.res.status, 200);

  const policySet = await api(baseUrl, '/api/risk/treasury-policy', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      enabled: true,
      liabilityCapUnits: '50',
      pendingWithdrawalCapUnits: '20',
      maxPayoutPerSettlementUnits: '30',
      maxWithdrawalPerRequestUnits: '100',
      maxUtilizationBps: 9000,
      autoTripMs: 60000,
      manualTrip: false,
      clearTrip: true,
    },
  });
  assert.equal(policySet.res.status, 200);
  assert.equal(policySet.json.policy.liabilityCapUnits, '50');

  const deposit = await api(baseUrl, '/api/cashier/deposit', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 200,
      idempotencyKey: `dep-${Date.now()}`,
      source: 'fiat-bridge',
    },
  });
  assert.equal(deposit.res.status, 200);

  const reserveA = await api(baseUrl, '/api/cashier/reserve', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 40,
      idempotencyKey: `rsv-a-${Date.now()}`,
      context: 'table-buyin',
    },
  });
  assert.equal(reserveA.res.status, 200);

  const reserveB = await api(baseUrl, '/api/cashier/reserve', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 20,
      idempotencyKey: `rsv-b-${Date.now()}`,
      context: 'table-buyin',
    },
  });
  assert.equal(reserveB.res.status, 423);
  assert.equal(reserveB.json.error.includes('Treasury circuit breaker'), true);
  assert.equal(Array.isArray(reserveB.json.reasons), true);

  const policyState = await api(baseUrl, '/api/risk/treasury-policy?ledgerId=default');
  assert.equal(policyState.res.status, 200);
  assert.equal(policyState.json.state.tripped, true);

  const policyClear = await api(baseUrl, '/api/risk/treasury-policy', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      clearTrip: true,
      liabilityCapUnits: '500',
      maxPayoutPerSettlementUnits: '30',
      maxWithdrawalPerRequestUnits: '100',
    },
  });
  assert.equal(policyClear.res.status, 200);
  assert.equal(policyClear.json.policy.manualTrip, false);

  const withdrawTooLarge = await api(baseUrl, '/api/cashier/withdraw-request', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 120,
      idempotencyKey: `wd-${Date.now()}`,
    },
  });
  assert.equal(withdrawTooLarge.res.status, 423);
  assert.equal(
    withdrawTooLarge.json.reasons.includes('TREASURY_WITHDRAWAL_PER_REQUEST_CAP_EXCEEDED'),
    true
  );

  const policyClear2 = await api(baseUrl, '/api/risk/treasury-policy', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      clearTrip: true,
      liabilityCapUnits: '500',
      maxPayoutPerSettlementUnits: '30',
      maxWithdrawalPerRequestUnits: '100',
    },
  });
  assert.equal(policyClear2.res.status, 200);

  const settleTooLarge = await api(baseUrl, '/api/cashier/settle', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      reservedUsedUnits: 0,
      payoutUnits: 40,
      idempotencyKey: `stl-${Date.now()}`,
      context: 'hand-settlement',
    },
  });
  assert.equal(settleTooLarge.res.status, 423);
  assert.equal(
    settleTooLarge.json.reasons.includes('TREASURY_PAYOUT_PER_SETTLEMENT_CAP_EXCEEDED'),
    true
  );

  assert.equal(getStderr(), '');
});

test('cashier attestation is deterministic and balanced', async (t) => {
  const port = 5100 + Math.floor(Math.random() * 200);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc, getStderr } = startServer(port);
  const playerId = `p-att-${Date.now()}`;
  t.after(() => proc.kill('SIGTERM'));
  await waitForHealth(baseUrl);

  const compliance = await api(baseUrl, '/api/compliance/upsert', {
    method: 'POST',
    body: {
      playerId,
      kycStatus: 'approved',
      countryCode: 'US',
      amlRiskLevel: 'low',
    },
  });
  assert.equal(compliance.res.status, 200);

  const deposit = await api(baseUrl, '/api/cashier/deposit', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 1000,
      idempotencyKey: `att-dep-${Date.now()}`,
      source: 'fiat-bridge',
    },
  });
  assert.equal(deposit.res.status, 200);

  const reserve = await api(baseUrl, '/api/cashier/reserve', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 300,
      idempotencyKey: `att-rsv-${Date.now()}`,
      context: 'table-buyin',
    },
  });
  assert.equal(reserve.res.status, 200);

  const settle = await api(baseUrl, '/api/cashier/settle', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      reservedUsedUnits: 300,
      payoutUnits: 450,
      idempotencyKey: `att-stl-${Date.now()}`,
      context: 'hand-settlement',
    },
  });
  assert.equal(settle.res.status, 200);

  const withdraw = await api(baseUrl, '/api/cashier/withdraw-request', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 200,
      idempotencyKey: `att-wd-${Date.now()}`,
    },
  });
  assert.equal(withdraw.res.status, 200);

  const att1 = await api(baseUrl, '/api/cashier/attestation?ledgerId=default');
  assert.equal(att1.res.status, 200);
  assert.equal(att1.json.ok, true);
  assert.equal(att1.json.attestation.invariants.totalsMatchDerived, true);
  assert.equal(att1.json.attestation.invariants.nonNegativeWallets, true);
  assert.equal(att1.json.attestation.entriesCount >= 4, true);
  assert.equal(typeof att1.json.digest, 'string');

  const att2 = await api(baseUrl, '/api/cashier/attestation?ledgerId=default');
  assert.equal(att2.res.status, 200);
  assert.equal(att2.json.digest, att1.json.digest);
  assert.deepEqual(att2.json.attestation, att1.json.attestation);

  assert.equal(getStderr(), '');
});

test('reserve attestation publication creates signed auditor artifacts', async (t) => {
  const port = 5300 + Math.floor(Math.random() * 200);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc, getStderr } = startServer(port);
  const playerId = `p-pub-${Date.now()}`;
  t.after(() => proc.kill('SIGTERM'));
  await waitForHealth(baseUrl);

  const compliance = await api(baseUrl, '/api/compliance/upsert', {
    method: 'POST',
    body: {
      playerId,
      kycStatus: 'approved',
      countryCode: 'US',
      amlRiskLevel: 'low',
    },
  });
  assert.equal(compliance.res.status, 200);

  const deposit = await api(baseUrl, '/api/cashier/deposit', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      playerId,
      amountUnits: 900,
      idempotencyKey: `pub-dep-${Date.now()}`,
      source: 'fiat-bridge',
    },
  });
  assert.equal(deposit.res.status, 200);

  const published = await api(baseUrl, '/api/cashier/attestation/publish', {
    method: 'POST',
    body: {
      ledgerId: 'default',
      periodStartIso: '2026-02-01T00:00:00.000Z',
      periodEndIso: '2026-02-28T00:00:00.000Z',
      reportLabel: 'month-end',
      actor: 'ops-bot',
    },
  });
  assert.equal(published.res.status, 201);
  assert.equal(published.json.artifact.payload.sequence, 1);
  assert.equal(published.json.artifact.signature.signed, true);
  assert.equal(typeof published.json.artifact.signature.value, 'string');

  const history = await api(baseUrl, '/api/cashier/attestation/history?ledgerId=default&limit=5');
  assert.equal(history.res.status, 200);
  assert.equal(Array.isArray(history.json.artifacts), true);
  assert.equal(history.json.artifacts.length >= 1, true);
  assert.equal(history.json.artifacts[0].digest, published.json.artifact.digest);

  const verify = await api(baseUrl, '/api/cashier/attestation/verify', {
    method: 'POST',
    body: {
      artifact: published.json.artifact,
    },
  });
  assert.equal(verify.res.status, 200);
  assert.equal(verify.json.verification.ok, true);

  const tampered = JSON.parse(JSON.stringify(published.json.artifact));
  tampered.payload.reportLabel = 'tampered';
  const verifyTampered = await api(baseUrl, '/api/cashier/attestation/verify', {
    method: 'POST',
    body: {
      artifact: tampered,
    },
  });
  assert.equal(verifyTampered.res.status, 200);
  assert.equal(verifyTampered.json.verification.ok, false);

  assert.equal(getStderr(), '');
});
