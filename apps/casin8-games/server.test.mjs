import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

const cwd = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games';

async function waitForHealth(baseUrl, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await delay(150);
  }
  throw new Error('server did not become healthy in time');
}

function startServer(port) {
  const proc = spawn('node', ['server.js'], {
    cwd,
    env: { ...process.env, PORT: String(port) },
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
    headers: { 'content-type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json();
  return { res, json };
}

test('session -> play -> ledger -> reveal flow', async (t) => {
  const port = 4010 + Math.floor(Math.random() * 400);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc, getStderr } = startServer(port);

  t.after(() => {
    proc.kill('SIGTERM');
  });

  await waitForHealth(baseUrl);

  const created = await api(baseUrl, '/api/session', {
    method: 'POST',
    body: { playerName: 'Tester', clientSeed: 'seed-12345', tableId: 'qa-table' },
  });
  assert.equal(created.res.status, 201);
  assert.equal(created.json.ok, true);
  const sessionId = created.json.session.sessionId;
  assert.ok(sessionId);

  const played = await api(baseUrl, '/api/play', {
    method: 'POST',
    body: {
      sessionId,
      game: 'roulette',
      bet: 10,
      options: { type: 'straight', number: 17 },
    },
  });
  assert.equal(played.res.status, 200);
  assert.equal(played.json.ok, true);
  assert.ok(typeof played.json.round.delta === 'number');
  assert.ok(played.json.round.receipt.serverSeedHash);

  const ledger = await api(baseUrl, `/api/ledger?sessionId=${encodeURIComponent(sessionId)}`);
  assert.equal(ledger.res.status, 200);
  assert.equal(ledger.json.ok, true);
  assert.ok(Array.isArray(ledger.json.ledger));
  assert.ok(ledger.json.ledger.length >= 1);

  const reveal = await api(baseUrl, '/api/session/reveal-rotate', {
    method: 'POST',
    body: { sessionId },
  });
  assert.equal(reveal.res.status, 200);
  assert.equal(reveal.json.ok, true);
  assert.ok(reveal.json.reveal.previousServerSeed);
  assert.ok(reveal.json.reveal.nextServerSeedHash);

  const table = await api(baseUrl, '/api/table/events?tableId=qa-table');
  assert.equal(table.res.status, 200);
  assert.equal(table.json.ok, true);
  assert.ok(Array.isArray(table.json.events));

  assert.equal(getStderr(), '');
});
