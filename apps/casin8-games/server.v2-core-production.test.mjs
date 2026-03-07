import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const cwd = import.meta.dirname || process.cwd();
const TEST_API_TOKEN = 'test-token';

async function waitForHealth(baseUrl, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error('server did not become healthy in time');
}

function startServer(port, opts = {}) {
  const proc = spawn('node', ['server.js'], {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
      CASIN8_API_TOKENS: JSON.stringify({
        [TEST_API_TOKEN]: ['admin', 'poker', 'risk', 'compliance'],
      }),
      ...(opts.dataDir ? { CASIN8_DATA_DIR: opts.dataDir } : {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { proc };
}

async function stopServer(proc) {
  if (!proc || proc.killed) return;
  proc.kill('SIGTERM');
  await new Promise((resolve) => proc.once('exit', resolve));
}

async function api(baseUrl, pathName, opts = {}) {
  const res = await fetch(`${baseUrl}${pathName}`, {
    method: opts.method || 'GET',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${TEST_API_TOKEN}`,
      ...(opts.headers || {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

test('v2 holdem resume token + stale cursor + reconnect semantics', async (t) => {
  const port = 6400 + Math.floor(Math.random() * 220);
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'casin8-v2-core-'));
  const { proc } = startServer(port, { dataDir });
  t.after(async () => {
    await stopServer(proc);
    await rm(dataDir, { recursive: true, force: true });
  });
  await waitForHealth(baseUrl);

  const tableId = `v2-core-${Date.now()}`;
  const created = await api(baseUrl, '/api/v2/holdem/tables', {
    method: 'POST',
    body: {
      tableId,
      mode: 'cash',
      maxSeats: 6,
      smallBlind: 25,
      bigBlind: 50,
      seats: [
        { playerId: 'p1', seat: 0, stack: 2000 },
        { playerId: 'p2', seat: 1, stack: 2000 },
        { playerId: 'p3', seat: 2, stack: 2000 },
      ],
    },
  });
  assert.equal(created.res.status, 201);

  const straddle = await api(baseUrl, '/api/v2/holdem/straddle', {
    method: 'POST',
    body: { tableId, playerId: 'p3', amount: 100 },
  });
  assert.equal(straddle.res.status, 200);

  const started = await api(baseUrl, '/api/v2/holdem/hands/start', {
    method: 'POST',
    body: { tableId, handId: 'v2-h-1', idempotencyKey: 'v2-start-1' },
  });
  assert.equal(started.res.status, 200);
  const actingSeat = started.json.table.hand.actingSeat;
  const actingPlayer = started.json.table.seats.find((s) => s.seat === actingSeat).playerId;

  const resume = await api(baseUrl, '/api/v2/holdem/resume', {
    method: 'POST',
    body: { tableId, playerId: actingPlayer },
  });
  assert.equal(resume.res.status, 200);
  const token = resume.json.resume.token;

  const stale = await api(baseUrl, '/api/v2/holdem/actions', {
    method: 'POST',
    body: {
      tableId,
      playerId: actingPlayer,
      action: 'call',
      idempotencyKey: 'v2-a-stale',
      expectedReplayCursor: 1,
      resumeToken: token,
    },
  });
  assert.equal(stale.res.status, 409);
  assert.equal(stale.json.error, 'STALE_REPLAY_CURSOR');

  const okAction = await api(baseUrl, '/api/v2/holdem/actions', {
    method: 'POST',
    body: {
      tableId,
      playerId: actingPlayer,
      action: 'call',
      idempotencyKey: 'v2-a-ok',
      expectedReplayCursor: resume.json.resume.replayCursor,
      resumeToken: token,
    },
  });
  assert.equal(okAction.res.status, 200);

  const disconnect = await api(baseUrl, '/api/v2/holdem/connection', {
    method: 'POST',
    body: { tableId, playerId: 'p2', connected: false },
  });
  assert.equal(disconnect.res.status, 200);

  const disconnectedAction = await api(baseUrl, '/api/v2/holdem/actions', {
    method: 'POST',
    body: {
      tableId,
      playerId: 'p2',
      action: 'check',
      idempotencyKey: 'v2-a-disc',
      resumeToken: (
        await api(baseUrl, '/api/v2/holdem/resume', {
          method: 'POST',
          body: { tableId, playerId: 'p2' },
        })
      ).json.resume.token,
    },
  });
  assert.equal(disconnectedAction.res.status, 400);
});

test('v2 tournament pause/resume + recovery export/import', async (t) => {
  const port = 6650 + Math.floor(Math.random() * 200);
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'casin8-v2-mtt-'));
  const { proc } = startServer(port, { dataDir });
  t.after(async () => {
    await stopServer(proc);
    await rm(dataDir, { recursive: true, force: true });
  });
  await waitForHealth(baseUrl);

  const tournamentId = `mtt-core-${Date.now()}`;
  const created = await api(baseUrl, '/api/v2/tournaments', {
    method: 'POST',
    body: { tournamentId, type: 'mtt', maxPlayers: 18, tableSize: 6, buyInUnits: 1000 },
  });
  assert.equal(created.res.status, 201);

  for (let i = 1; i <= 8; i += 1) {
    const out = await api(baseUrl, '/api/v2/tournaments/register', {
      method: 'POST',
      body: { tournamentId, playerId: `tp${i}` },
    });
    assert.equal(out.res.status, 200);
  }

  const started = await api(baseUrl, '/api/v2/tournaments/start', {
    method: 'POST',
    body: { tournamentId },
  });
  assert.equal(started.res.status, 200);

  const paused = await api(baseUrl, '/api/v2/tournaments/pause', {
    method: 'POST',
    body: { tournamentId, reason: 'ops' },
  });
  assert.equal(paused.res.status, 200);
  assert.equal(paused.json.tournament.status, 'paused');

  const resumed = await api(baseUrl, '/api/v2/tournaments/resume', {
    method: 'POST',
    body: { tournamentId, reason: 'ops_done' },
  });
  assert.equal(resumed.res.status, 200);
  assert.equal(resumed.json.tournament.status, 'running');

  const exported = await api(
    baseUrl,
    `/api/v2/tournaments/recovery/export?tournamentId=${encodeURIComponent(tournamentId)}`
  );
  assert.equal(exported.res.status, 200);
  assert.equal(typeof exported.json.recovery, 'object');

  const cloneId = `${tournamentId}-clone`;
  const recoveryClone = {
    ...exported.json.recovery,
    tournamentId: cloneId,
  };
  const imported = await api(baseUrl, '/api/v2/tournaments/recovery/import', {
    method: 'POST',
    body: { recovery: recoveryClone },
  });
  assert.equal(imported.res.status, 201);
  assert.equal(imported.json.tournament.tournamentId, cloneId);
});

test('v2 holdem + tournament state persist across restart', async (t) => {
  const port = 6820 + Math.floor(Math.random() * 140);
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'casin8-v2-persist-'));
  let server = startServer(port, { dataDir });
  t.after(async () => {
    await stopServer(server.proc);
    await rm(dataDir, { recursive: true, force: true });
  });
  await waitForHealth(baseUrl);

  const tableId = `v2-persist-${Date.now()}`;
  const tournamentId = `v2-persist-mtt-${Date.now()}`;

  const createdTable = await api(baseUrl, '/api/v2/holdem/tables', {
    method: 'POST',
    body: {
      tableId,
      mode: 'cash',
      maxSeats: 6,
      smallBlind: 25,
      bigBlind: 50,
      seats: [
        { playerId: 'a1', seat: 0, stack: 5000 },
        { playerId: 'a2', seat: 1, stack: 5000 },
      ],
    },
  });
  assert.equal(createdTable.res.status, 201);

  const startHand = await api(baseUrl, '/api/v2/holdem/hands/start', {
    method: 'POST',
    body: { tableId, handId: 'persist-h1', idempotencyKey: 'persist-start-1' },
  });
  assert.equal(startHand.res.status, 200);

  const createdTournament = await api(baseUrl, '/api/v2/tournaments', {
    method: 'POST',
    body: { tournamentId, type: 'mtt', maxPlayers: 18, tableSize: 6 },
  });
  assert.equal(createdTournament.res.status, 201);

  const registered = await api(baseUrl, '/api/v2/tournaments/register', {
    method: 'POST',
    body: { tournamentId, playerId: 'tt-1' },
  });
  assert.equal(registered.res.status, 200);

  await stopServer(server.proc);
  server = startServer(port, { dataDir });
  await waitForHealth(baseUrl);

  const tableState = await api(
    baseUrl,
    `/api/v2/holdem/state?tableId=${encodeURIComponent(tableId)}`
  );
  assert.equal(tableState.res.status, 200);
  assert.equal(tableState.json.table.tableId, tableId);
  assert.equal(tableState.json.table.hand.handId, 'persist-h1');

  const tournamentState = await api(
    baseUrl,
    `/api/v2/tournaments/state?tournamentId=${encodeURIComponent(tournamentId)}`
  );
  assert.equal(tournamentState.res.status, 200);
  assert.equal(tournamentState.json.tournament.tournamentId, tournamentId);
  assert.equal(Array.isArray(tournamentState.json.tournament.players), true);
  assert.equal(tournamentState.json.tournament.players.length, 1);
});
