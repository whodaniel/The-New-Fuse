import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const cwd = import.meta.dirname || process.cwd();
const TEST_API_TOKEN = 'test-token';
const dataDirByPort = new Map();

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
  let dataDir = dataDirByPort.get(port);
  if (!dataDir) {
    dataDir = path.join(
      cwd,
      '.data-tests',
      `port-${port}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    );
    dataDirByPort.set(port, dataDir);
  }
  const proc = spawn('node', ['server.js'], {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
      CASIN8_DATA_DIR: dataDir,
      CASIN8_API_TOKENS: JSON.stringify({
        [TEST_API_TOKEN]: ['admin', 'poker', 'risk', 'compliance'],
      }),
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

test('table hints endpoint returns actionable guidance', async (t) => {
  const port = 5200 + Math.floor(Math.random() * 200);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc, getStderr } = startServer(port);
  t.after(() => proc.kill('SIGTERM'));

  await waitForHealth(baseUrl);

  const init = await api(baseUrl, '/api/table/state/init', {
    method: 'POST',
    body: {
      tableId: 'hints-table',
      handId: 'hints-hand-1',
      seats: [{ seat: 0 }, { seat: 1 }],
      actingSeat: 0,
      pot: 30,
    },
  });
  assert.equal(init.res.status, 201);
  assert.equal(init.json.ok, true);

  const hints = await api(baseUrl, '/api/table/hints', {
    method: 'POST',
    body: {
      tableId: 'hints-table',
      seat: 0,
      toCallUnits: 10,
      potUnits: 30,
      stackUnits: 200,
      legalActions: ['fold', 'check', 'call', 'raise'],
      handStrength: 0.55,
    },
  });
  assert.equal(hints.res.status, 200);
  assert.equal(hints.json.ok, true);
  assert.equal(typeof hints.json.hint.potOddsPct, 'number');
  assert.equal(typeof hints.json.hint.requiredEquityThresholdPct, 'number');
  assert.ok(
    ['fold', 'check', 'call', 'bet', 'raise'].includes(hints.json.hint.recommendedActionBucket)
  );
  assert.equal(typeof hints.json.hint.raiseSizingBands.minUnits, 'number');

  assert.equal(getStderr(), '');
});

test('hands history and replay endpoints return persisted settled hands', async (t) => {
  const port = 5400 + Math.floor(Math.random() * 200);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc, getStderr } = startServer(port);
  t.after(() => proc.kill('SIGTERM'));

  await waitForHealth(baseUrl);

  const tableId = `hands-table-${Date.now()}`;
  const handId = `hands-hand-${Date.now()}`;

  const init = await api(baseUrl, '/api/table/state/init', {
    method: 'POST',
    body: {
      tableId,
      handId,
      seats: [{ seat: 0 }, { seat: 1 }],
      actingSeat: 0,
      pot: 40,
    },
  });
  assert.equal(init.res.status, 201);
  assert.equal(init.json.ok, true);

  const settle = await api(baseUrl, '/api/table/settle', {
    method: 'POST',
    body: {
      tableId,
      winnerSeat: 0,
      payoutUnits: 40,
    },
  });
  assert.equal(settle.res.status, 200);
  assert.equal(settle.json.ok, true);
  assert.equal(settle.json.snapshot.settled, true);

  const list = await api(baseUrl, `/api/hands?tableId=${encodeURIComponent(tableId)}&limit=10`);
  assert.equal(list.res.status, 200);
  assert.equal(list.json.ok, true);
  assert.ok(Array.isArray(list.json.hands));
  assert.ok(list.json.hands.some((row) => row.handId === handId));

  const hand = await api(baseUrl, `/api/hands/${encodeURIComponent(handId)}`);
  assert.equal(hand.res.status, 200);
  assert.equal(hand.json.ok, true);
  assert.equal(hand.json.hand.handId, handId);
  assert.equal(hand.json.hand.tableId, tableId);

  const replay = await api(baseUrl, `/api/hands/${encodeURIComponent(handId)}/replay`);
  assert.equal(replay.res.status, 200);
  assert.equal(replay.json.ok, true);
  assert.equal(replay.json.replay.handId, handId);
  assert.ok(Array.isArray(replay.json.replay.phases));
  assert.ok(replay.json.replay.phases.length >= 5);

  assert.equal(getStderr(), '');
});
