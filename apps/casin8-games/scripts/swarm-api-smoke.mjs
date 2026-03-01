#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import process from 'node:process';

const argv = new Set(process.argv.slice(2));
const spawnServer = argv.has('--spawn');
const port = Number(process.env.SMOKE_PORT || 4312);
const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${port}`;
const serverPath = path.resolve(process.cwd(), 'server.js');

function isJsonLike(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

async function call({ method = 'GET', endpoint, body }) {
  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Keep raw text for diagnostics.
  }
  return { ok: res.ok, status: res.status, json, text, endpoint, method };
}

function assertResult(result, predicate, label) {
  if (!result.ok) {
    throw new Error(`${label} failed HTTP ${result.status}: ${result.text}`);
  }
  if (!predicate(result.json)) {
    throw new Error(`${label} failed predicate: ${JSON.stringify(result.json)}`);
  }
}

async function waitForHealth() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const out = await call({ endpoint: '/api/health' });
      if (out.ok) return;
    } catch {
      // retry
    }
    await sleep(250);
  }
  throw new Error('Server health check timed out');
}

async function main() {
  let child = null;
  if (spawnServer) {
    child = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORT: String(port) },
      stdio: 'ignore',
    });
    await waitForHealth();
  }

  try {
    const checks = [];
    const push = async (label, req, pred) => {
      const out = await call(req);
      assertResult(out, pred, label);
      checks.push({ label, status: out.status });
    };

    await push(
      'health',
      { endpoint: '/api/health' },
      (j) => isJsonLike(j) && j.ok === true && j.status === 'ok'
    );

    await push(
      'fair commit',
      { method: 'POST', endpoint: '/api/fair/commit', body: { sessionId: 'smoke-session-1' } },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.commit) && !!j.commit.serverSeedHash
    );

    await push(
      'fair rotate',
      { method: 'POST', endpoint: '/api/fair/rotate', body: { sessionId: 'smoke-session-1' } },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.reveal) && isJsonLike(j.next)
    );

    await push(
      'agent register',
      {
        method: 'POST',
        endpoint: '/api/agents/register',
        body: { agentId: 'agent-smoke-1', ownerId: 'owner-smoke-1', tier: 'B', style: 'tight_aggressive' },
      },
      (j) => isJsonLike(j) && j.ok === true && j.agent?.agentId === 'agent-smoke-1'
    );

    await push(
      'agent policy',
      {
        method: 'POST',
        endpoint: '/api/agents/policy-check',
        body: { agentId: 'agent-smoke-1', action: 'call', amountUnits: '10', bankrollUnits: '1000' },
      },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.policy)
    );

    await push(
      'sponsorship open',
      {
        method: 'POST',
        endpoint: '/api/sponsorships/open',
        body: { positionId: 'pos-smoke-1', agentId: 'agent-smoke-1', stakeForSaleBps: 7000, markupBps: 11000, maxExposureUnits: '100000' },
      },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.position) && j.position.positionId === 'pos-smoke-1'
    );

    await push(
      'sponsorship fund',
      {
        method: 'POST',
        endpoint: '/api/sponsorships/fund',
        body: { positionId: 'pos-smoke-1', sponsorId: 'sponsor-1', principalUnits: '10000' },
      },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.funding)
    );

    await push(
      'cashier deposit',
      {
        method: 'POST',
        endpoint: '/api/cashier/deposit',
        body: { playerId: 'player-smoke-1', amountUnits: '50000', idempotencyKey: 'dep-smoke-1' },
      },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.result)
    );

    await push(
      'cashier wallet',
      { endpoint: '/api/cashier/wallet?ledgerId=default&playerId=player-smoke-1' },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.wallet)
    );

    await push(
      'sng create',
      {
        method: 'POST',
        endpoint: '/api/sng/create',
        body: { tournamentId: 'sng-smoke-1', maxPlayers: 6, buyInUnits: '100' },
      },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.sng) && j.sng.tournamentId === 'sng-smoke-1'
    );

    await push(
      'mtt create',
      {
        method: 'POST',
        endpoint: '/api/mtt/create',
        body: { tournamentId: 'mtt-smoke-1', maxPlayers: 50, tableMaxSeats: 6, buyInUnits: '100' },
      },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.mtt) && j.mtt.tournamentId === 'mtt-smoke-1'
    );

    await push(
      'realtime mutation',
      {
        method: 'POST',
        endpoint: '/api/realtime/mutation',
        body: { tableId: 'lobby-1', idempotencyKey: 'mut-smoke-1', mutationType: 'player-action', payload: { action: 'check' } },
      },
      (j) => isJsonLike(j) && j.ok === true && isJsonLike(j.result)
    );

    await push(
      'realtime feed',
      { endpoint: '/api/realtime/feed?tableId=lobby-1&since=0' },
      (j) => isJsonLike(j) && j.ok === true && Array.isArray(j.events)
    );

    console.log('Swarm API smoke passed:');
    for (const row of checks) {
      console.log(`- ${row.label}: ${row.status}`);
    }
  } finally {
    if (child) {
      child.kill('SIGTERM');
      await sleep(100);
    }
  }
}

main().catch((err) => {
  console.error(`Swarm API smoke failed: ${err?.message || err}`);
  process.exit(1);
});
