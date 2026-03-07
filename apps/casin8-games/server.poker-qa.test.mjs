import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const cwd = import.meta.dirname || process.cwd();
const TEST_API_TOKEN = 'test-token';

async function waitForHealth(baseUrl, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {}
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
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  proc.stderr.on('data', (buf) => {
    stderr += String(buf);
  });
  return { proc, getStderr: () => stderr };
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
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { res, json };
}

function id(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

test('rule correctness: cash table actions enforce turn and bet constraints', async (t) => {
  const port = 4500 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc, getStderr } = startServer(port);
  t.after(async () => {
    await stopServer(proc);
  });
  await waitForHealth(baseUrl);

  const tableId = id('qa-rules-cash');
  const init = await api(baseUrl, '/api/table/state/init', {
    method: 'POST',
    body: {
      tableId,
      handId: id('hand'),
      seats: [
        { seat: 0, stack: 150 },
        { seat: 1, stack: 150 },
        { seat: 2, stack: 150 },
      ],
      smallBlind: 10,
      bigBlind: 20,
    },
  });
  assert.equal(init.res.status, 201);
  const actingSeat = init.json.snapshot.actingSeat;

  const badCheck = await api(baseUrl, '/api/table/action', {
    method: 'POST',
    body: {
      tableId,
      idempotencyKey: id('k'),
      type: 'player.action',
      seat: actingSeat,
      action: 'check',
      amount: 0,
    },
  });
  assert.equal(badCheck.res.status, 400);
  assert.match(String(badCheck.json?.error || ''), /Cannot check while facing a bet/);

  const call = await api(baseUrl, '/api/table/action', {
    method: 'POST',
    body: {
      tableId,
      idempotencyKey: id('k'),
      type: 'player.action',
      seat: actingSeat,
      action: 'call',
      amount: 0,
    },
  });
  assert.equal(call.res.status, 200);
  assert.equal(call.json.accepted, true);

  const stateAfter = await api(baseUrl, `/api/table/state?tableId=${encodeURIComponent(tableId)}`);
  assert.equal(stateAfter.res.status, 200);
  const nextSeat = stateAfter.json.snapshot.actingSeat;

  const tooSmallRaise = await api(baseUrl, '/api/table/action', {
    method: 'POST',
    body: {
      tableId,
      idempotencyKey: id('k'),
      type: 'player.action',
      seat: nextSeat,
      action: 'raise',
      amount: Number(stateAfter.json.snapshot.currentBet || 0) + 1,
    },
  });
  assert.equal(tooSmallRaise.res.status, 400);
  assert.match(String(tooSmallRaise.json?.error || ''), /Raise must be at least/);
  assert.equal(getStderr(), '');
});

test('rule correctness: SNG + MTT lifecycle endpoints stay consistent', async (t) => {
  const port = 4800 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc } = startServer(port);
  t.after(async () => {
    await stopServer(proc);
  });
  await waitForHealth(baseUrl);

  const sngId = id('sng');
  const sngCreate = await api(baseUrl, '/api/sng/create', {
    method: 'POST',
    body: { tournamentId: sngId, maxPlayers: 6, buyInUnits: 100 },
  });
  assert.equal(sngCreate.res.status, 201);
  for (let i = 1; i <= 6; i += 1) {
    const out = await api(baseUrl, '/api/sng/register', {
      method: 'POST',
      body: { tournamentId: sngId, playerId: `sng-p${i}` },
    });
    assert.equal(out.res.status, 200);
  }
  for (let i = 6; i >= 2; i -= 1) {
    const out = await api(baseUrl, '/api/sng/eliminate', {
      method: 'POST',
      body: { tournamentId: sngId, playerId: `sng-p${i}`, finishPosition: i },
    });
    assert.equal(out.res.status, 200);
  }
  const sngPayouts = await api(
    baseUrl,
    `/api/sng/payouts?tournamentId=${encodeURIComponent(sngId)}`
  );
  assert.equal(sngPayouts.res.status, 200);
  const totalSngPaid = sngPayouts.json.payouts.reduce(
    (sum, row) => sum + BigInt(row.payoutUnits),
    0n
  );
  assert.equal(totalSngPaid, 600n);

  const mttId = id('mtt');
  const mttCreate = await api(baseUrl, '/api/mtt/create', {
    method: 'POST',
    body: { tournamentId: mttId, maxPlayers: 8, tableMaxSeats: 4, buyInUnits: 50 },
  });
  assert.equal(mttCreate.res.status, 201);
  for (let i = 1; i <= 8; i += 1) {
    const out = await api(baseUrl, '/api/mtt/register', {
      method: 'POST',
      body: { tournamentId: mttId, playerId: `mtt-p${i}` },
    });
    assert.equal(out.res.status, 200);
  }
  const started = await api(baseUrl, '/api/mtt/start', {
    method: 'POST',
    body: { tournamentId: mttId },
  });
  assert.equal(started.res.status, 200);
  assert.equal(started.json.mtt.status, 'running');
  for (let i = 8; i >= 2; i -= 1) {
    const out = await api(baseUrl, '/api/mtt/eliminate', {
      method: 'POST',
      body: { tournamentId: mttId, playerId: `mtt-p${i}`, finishPosition: i },
    });
    assert.equal(out.res.status, 200);
  }
  const mttState = await api(baseUrl, `/api/mtt/state?tournamentId=${encodeURIComponent(mttId)}`);
  assert.equal(mttState.res.status, 200);
  assert.equal(mttState.json.mtt.status, 'complete');
  assert.equal(mttState.json.mtt.activePlayers, 1);
});

test('concurrency: duplicate actions and stale reconnect action are rejected', async (t) => {
  const port = 5100 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc } = startServer(port);
  t.after(async () => {
    await stopServer(proc);
  });
  await waitForHealth(baseUrl);

  const tableId = id('qa-race');
  const init = await api(baseUrl, '/api/table/state/init', {
    method: 'POST',
    body: {
      tableId,
      handId: id('hand'),
      seats: [
        { seat: 0, stack: 100 },
        { seat: 1, stack: 100 },
      ],
      smallBlind: 5,
      bigBlind: 10,
    },
  });
  assert.equal(init.res.status, 201);
  const actingSeat = init.json.snapshot.actingSeat;
  const expectedCursor = init.json.snapshot.cursor;
  const idempotencyKey = id('dup');

  const [a, b] = await Promise.all([
    api(baseUrl, '/api/table/action', {
      method: 'POST',
      body: {
        tableId,
        idempotencyKey,
        type: 'player.action',
        seat: actingSeat,
        action: 'call',
        amount: 0,
        expectedCursor,
      },
    }),
    api(baseUrl, '/api/table/action', {
      method: 'POST',
      body: {
        tableId,
        idempotencyKey,
        type: 'player.action',
        seat: actingSeat,
        action: 'call',
        amount: 0,
        expectedCursor,
      },
    }),
  ]);
  console.log('test results:', {
    a: a.json,
    a_status: a.res.status,
    b: b.json,
    b_status: b.res.status,
  });
  const accepted = [a, b].filter((row) => row.json?.accepted === true);
  const rejected = [a, b].filter((row) => row.json?.accepted === false);
  assert.equal(accepted.length, 1);
  assert.equal(rejected.length, 1);
  assert.match(String(rejected[0].json?.reason || ''), /DUPLICATE_IDEMPOTENCY_KEY/);

  const stale = await api(baseUrl, '/api/table/action', {
    method: 'POST',
    body: {
      tableId,
      idempotencyKey: id('stale'),
      type: 'player.action',
      seat: actingSeat,
      action: 'fold',
      amount: 0,
      expectedCursor,
    },
  });
  assert.equal(stale.res.status, 409);
  assert.match(String(stale.json?.error || ''), /STALE_ACTION/);
});

test('settlement integrity: persists across restart and settlement retries are idempotent', async (t) => {
  const port = 5400 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  let instance = startServer(port);
  t.after(async () => {
    await stopServer(instance.proc);
  });
  await waitForHealth(baseUrl);

  const s1 = await api(baseUrl, '/api/session', {
    method: 'POST',
    body: { playerName: id('p1'), clientSeed: 'seed-a', tableId: id('settle-table') },
  });
  const s2 = await api(baseUrl, '/api/session', {
    method: 'POST',
    body: { playerName: id('p2'), clientSeed: 'seed-b', tableId: s1.json.session.tableId },
  });
  assert.equal(s1.res.status, 201);
  assert.equal(s2.res.status, 201);

  const tableId = s1.json.session.tableId;
  const init = await api(baseUrl, '/api/table/state/init', {
    method: 'POST',
    body: {
      tableId,
      handId: id('hand'),
      seats: [
        { seat: 0, stack: 1000 },
        { seat: 1, stack: 1000 },
      ],
      sessionBySeat: { 0: s1.json.session.sessionId, 1: s2.json.session.sessionId },
      smallBlind: 10,
      bigBlind: 20,
    },
  });
  assert.equal(init.res.status, 201);

  const fold = await api(baseUrl, '/api/table/action', {
    method: 'POST',
    body: {
      tableId,
      idempotencyKey: id('fold'),
      type: 'player.action',
      seat: init.json.snapshot.actingSeat,
      action: 'fold',
      amount: 0,
      expectedCursor: init.json.snapshot.cursor,
    },
  });
  assert.equal(fold.res.status, 200);
  assert.equal(fold.json.snapshot.terminal, true);
  assert.equal(fold.json.snapshot.settled, true);

  const winnerBeforeRestart = await api(
    baseUrl,
    `/api/session?sessionId=${encodeURIComponent(s1.json.session.sessionId)}`
  );
  const loserBeforeRestart = await api(
    baseUrl,
    `/api/session?sessionId=${encodeURIComponent(s2.json.session.sessionId)}`
  );
  assert.equal(winnerBeforeRestart.res.status, 200);
  assert.equal(loserBeforeRestart.res.status, 200);

  await stopServer(instance.proc);
  instance = startServer(port);
  await waitForHealth(baseUrl);

  const winnerAfterRestart = await api(
    baseUrl,
    `/api/session?sessionId=${encodeURIComponent(s1.json.session.sessionId)}`
  );
  const loserAfterRestart = await api(
    baseUrl,
    `/api/session?sessionId=${encodeURIComponent(s2.json.session.sessionId)}`
  );
  assert.equal(winnerAfterRestart.res.status, 200);
  assert.equal(loserAfterRestart.res.status, 200);
  assert.equal(winnerAfterRestart.json.session.bankroll, winnerBeforeRestart.json.session.bankroll);
  assert.equal(loserAfterRestart.json.session.bankroll, loserBeforeRestart.json.session.bankroll);

  const retryTableId = id('retry-settle');
  const retryInit = await api(baseUrl, '/api/table/state/init', {
    method: 'POST',
    body: {
      tableId: retryTableId,
      handId: id('retry-hand'),
      seats: [
        { seat: 0, stack: 100 },
        { seat: 1, stack: 100 },
      ],
      smallBlind: 5,
      bigBlind: 10,
    },
  });
  assert.equal(retryInit.res.status, 201);

  const settleKey = id('settle-key');
  const settleA = await api(baseUrl, '/api/table/settle', {
    method: 'POST',
    body: { tableId: retryTableId, winnerSeat: 0, payoutUnits: 30, idempotencyKey: settleKey },
  });
  const settleB = await api(baseUrl, '/api/table/settle', {
    method: 'POST',
    body: { tableId: retryTableId, winnerSeat: 0, payoutUnits: 30, idempotencyKey: settleKey },
  });
  assert.equal(settleA.res.status, 200);
  assert.equal(settleB.res.status, 200);
  assert.equal(settleB.json.duplicate, true);
});

test('fuzz and abuse resistance: malformed payloads and extreme bets', async (t) => {
  const port = 5700 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc } = startServer(port);
  t.after(async () => {
    await stopServer(proc);
  });
  await waitForHealth(baseUrl);

  const invalidJsonRes = await fetch(`${baseUrl}/api/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"playerName":',
  });
  const invalidJson = await invalidJsonRes.json();
  assert.equal(invalidJsonRes.status, 400);
  assert.match(String(invalidJson.error || ''), /Invalid JSON body/);

  const tooLargeRaw = 'a'.repeat(70_000);
  const tooLargeRes = await fetch(`${baseUrl}/api/fair/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: tooLargeRaw,
  });
  const tooLarge = await tooLargeRes.json();
  assert.equal(tooLargeRes.status, 400);
  assert.match(String(tooLarge.error || ''), /Payload too large/);

  const created = await api(baseUrl, '/api/session', {
    method: 'POST',
    body: { playerName: 'fuzzer', clientSeed: 'seed-fuzz', tableId: id('fuzz') },
  });
  const hugeBet = await api(baseUrl, '/api/play', {
    method: 'POST',
    body: {
      sessionId: created.json.session.sessionId,
      game: 'poker',
      bet: Number.MAX_SAFE_INTEGER,
    },
  });
  assert.equal(hugeBet.res.status, 400);
  assert.match(String(hugeBet.json.error || ''), /Insufficient bankroll/);

  for (let i = 0; i < 20; i += 1) {
    const payload = {
      sessionId: i % 2 === 0 ? created.json.session.sessionId : { nested: true },
      game: i % 3 === 0 ? null : 'poker',
      bet: i % 4 === 0 ? -1 : String(i),
      options: { junk: 'x'.repeat(i * 3) },
    };
    await api(baseUrl, '/api/play', { method: 'POST', body: payload });
  }
  const health = await api(baseUrl, '/api/health');
  assert.equal(health.res.status, 200);
});

test('fairness verification round-trip works for valid and invalid digests', async (t) => {
  const port = 6000 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc } = startServer(port);
  t.after(async () => {
    await stopServer(proc);
  });
  await waitForHealth(baseUrl);

  const sessionId = id('fair');
  const commit = await api(baseUrl, '/api/fair/commit', {
    method: 'POST',
    body: { sessionId },
  });
  assert.equal(commit.res.status, 201);
  assert.equal(typeof commit.json.commit.serverSeedHash, 'string');

  const rotated = await api(baseUrl, '/api/fair/rotate', {
    method: 'POST',
    body: { sessionId },
  });
  assert.equal(rotated.res.status, 200);
  assert.equal(rotated.json.reveal.previousServerSeedHash, commit.json.commit.serverSeedHash);

  const verifyOne = await api(baseUrl, '/api/fair/verify', {
    method: 'POST',
    body: {
      serverSeed: rotated.json.reveal.previousServerSeed,
      clientSeed: 'client-seed-1',
      nonce: 1,
      game: 'poker',
      bet: 25,
      options: { table: 'cash' },
    },
  });
  assert.equal(verifyOne.res.status, 200);
  assert.equal(verifyOne.json.verified, true);
  const digest = verifyOne.json.receipt.digest;

  const verifyGoodDigest = await api(baseUrl, '/api/fair/verify', {
    method: 'POST',
    body: {
      serverSeed: rotated.json.reveal.previousServerSeed,
      clientSeed: 'client-seed-1',
      nonce: 1,
      game: 'poker',
      bet: 25,
      options: { table: 'cash' },
      receiptDigest: digest,
    },
  });
  assert.equal(verifyGoodDigest.res.status, 200);
  assert.equal(verifyGoodDigest.json.verified, true);

  const verifyBadDigest = await api(baseUrl, '/api/fair/verify', {
    method: 'POST',
    body: {
      serverSeed: rotated.json.reveal.previousServerSeed,
      clientSeed: 'client-seed-1',
      nonce: 1,
      game: 'poker',
      bet: 25,
      options: { table: 'cash' },
      receiptDigest: `${digest.slice(0, -2)}00`,
    },
  });
  assert.equal(verifyBadDigest.res.status, 200);
  assert.equal(verifyBadDigest.json.verified, false);
});

test('texassolver intelligence crafts and applies agent traits', async (t) => {
  const port = 6300 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc } = startServer(port);
  t.after(async () => {
    await stopServer(proc);
  });
  await waitForHealth(baseUrl);

  const out = await api(baseUrl, '/api/strategy/traits/texassolver', {
    method: 'POST',
    body: {
      agentId: 'agent-ts-integ',
      ownerId: 'owner-ts',
      tier: 'B',
      applyToAgent: true,
      autoRegister: true,
      createProfile: true,
      solverDump: {
        strategy: {
          actions: ['fold', 'call', 'raise'],
          strategy: {
            AhKh: [0.05, 0.25, 0.7],
            QsQh: [0.1, 0.2, 0.7],
            '7c6c': [0.2, 0.5, 0.3],
          },
        },
      },
    },
  });
  assert.equal(out.res.status, 200);
  assert.equal(out.json.ok, true);
  assert.equal(typeof out.json.recommendation.recommended.style, 'string');
  assert.equal(typeof out.json.recommendation.recommended.maxRiskBps, 'number');
  assert.equal(typeof out.json.profile.temperament, 'string');
  assert.equal(typeof out.json.agent.styleConfig.vpipBps, 'number');
});

test('trait provider endpoint crafts CFR and risk-aware profiles', async (t) => {
  const port = 6350 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc } = startServer(port);
  t.after(async () => {
    await stopServer(proc);
  });
  await waitForHealth(baseUrl);

  const cfrOut = await api(baseUrl, '/api/strategy/traits/craft', {
    method: 'POST',
    body: {
      payloadVersion: 1,
      provider: 'cfr_profile',
      agentId: 'agent-cfr-integ',
      cfrProfile: {
        actionMix: {
          fold: 0.14,
          check: 0.12,
          call: 0.22,
          raise: 0.42,
          bet: 0.07,
          allin: 0.03,
        },
        exploitabilityBb100: 3.8,
        sampleHands: 28000,
      },
      createProfile: true,
      applyToAgent: true,
      autoRegister: true,
      ownerId: 'owner-cfr',
      tier: 'B',
      context: { gameType: 'mtt', phase: 'final_table' },
    },
  });
  assert.equal(cfrOut.res.status, 200);
  assert.equal(cfrOut.json.provider, 'cfr_profile');
  assert.equal(typeof cfrOut.json.recommendation.recommended.maxRiskBps, 'number');
  assert.equal(typeof cfrOut.json.profile.temperament, 'string');
  assert.equal(cfrOut.json.recommendation.phaseAdjustment.applied, true);
  assert.equal(cfrOut.json.recommendation.phaseAdjustment.phase, 'final_table');

  const riskOut = await api(baseUrl, '/api/strategy/traits/craft', {
    method: 'POST',
    body: {
      provider: 'risk_profile',
      agentId: 'agent-risk-integ',
      riskProfile: {
        riskScore: 88,
        collusionScore: 72,
        tiltIndexBps: 8000,
        abuseFlags: ['soft_play_cluster', 'rapid_dump_pattern'],
      },
      createProfile: true,
      applyToAgent: true,
      autoRegister: true,
      ownerId: 'owner-risk',
      tier: 'B',
    },
  });
  assert.equal(riskOut.res.status, 200);
  assert.equal(riskOut.json.provider, 'risk_profile');
  assert.equal(riskOut.json.recommendation.recommended.temperament, 'tight_passive');
  assert.equal(riskOut.json.recommendation.recommended.maxRiskBps < 1000, true);

  const badVersion = await api(baseUrl, '/api/strategy/traits/craft', {
    method: 'POST',
    body: {
      payloadVersion: 99,
      provider: 'risk_profile',
      agentId: 'agent-risk-bad-version',
      riskProfile: { riskScore: 20, collusionScore: 10, tiltIndexBps: 1200 },
    },
  });
  assert.equal(badVersion.res.status, 400);
  assert.match(String(badVersion.json.error || ''), /Unsupported payloadVersion/);

  const missingAgent = await api(baseUrl, '/api/strategy/traits/craft', {
    method: 'POST',
    body: {
      provider: 'risk_profile',
      agentId: 'agent-risk-missing',
      riskProfile: { riskScore: 40, collusionScore: 10, tiltIndexBps: 2000 },
      applyToAgent: true,
      autoRegister: false,
      createProfile: false,
    },
  });
  assert.equal(missingAgent.res.status, 400);
  assert.match(String(missingAgent.json.error || ''), /Agent not found/);
});

test('trait rollout canary + drift + slo endpoints operate', async (t) => {
  const port = 6400 + Math.floor(Math.random() * 250);
  const baseUrl = `http://127.0.0.1:${port}`;
  const { proc } = startServer(port);
  t.after(async () => {
    await stopServer(proc);
  });
  await waitForHealth(baseUrl);

  const craft = await api(baseUrl, '/api/strategy/traits/craft', {
    method: 'POST',
    body: {
      payloadVersion: 1,
      provider: 'cfr_profile',
      agentId: 'agent-rollout-1',
      cfrProfile: {
        actionMix: { fold: 0.1, check: 0.1, call: 0.25, raise: 0.45, bet: 0.07, allin: 0.03 },
        exploitabilityBb100: 2.9,
        sampleHands: 30000,
      },
      createProfile: true,
      applyToAgent: true,
      autoRegister: true,
      ownerId: 'owner-rollout',
      tier: 'B',
    },
  });
  assert.equal(craft.res.status, 200);
  const artifactId = craft.json?.recommendation?.lineage?.artifactId;
  assert.equal(typeof artifactId, 'string');

  for (let i = 0; i < 8; i += 1) {
    const out = await api(baseUrl, '/api/strategy/decide', {
      method: 'POST',
      body: {
        agentId: 'agent-rollout-1',
        legalActions: ['fold', 'check', 'call', 'raise'],
        handStrength: 0.55 + i * 0.02,
        potUnits: 120,
        toCallUnits: 18,
      },
    });
    assert.equal(out.res.status, 200);
  }

  const drift = await api(baseUrl, '/api/strategy/traits/drift?agentId=agent-rollout-1');
  assert.equal(drift.res.status, 200);
  assert.equal(typeof drift.json.drift.driftBps, 'number');

  const rollout = await api(baseUrl, '/api/strategy/traits/rollout', {
    method: 'POST',
    body: {
      rolloutId: 'rollout-test-1',
      agentIds: ['agent-rollout-1', 'agent-rollout-2', 'agent-rollout-3'],
      canaryPercent: 34,
      rollback: { maxLossBps: 450, maxVolatilityBps: 1800, maxFairnessAlerts: 2 },
    },
  });
  assert.equal(rollout.res.status, 201);
  assert.equal(rollout.json.rollout.canaryAgents.length >= 1, true);

  const evalOut = await api(baseUrl, '/api/strategy/traits/rollout/evaluate', {
    method: 'POST',
    body: {
      rolloutId: 'rollout-test-1',
      telemetry: { lossBps: 520, volatilityBps: 1700, fairnessAlerts: 0 },
    },
  });
  assert.equal(evalOut.res.status, 200);
  assert.equal(evalOut.json.rollback, true);
  assert.equal(evalOut.json.rollout.status, 'rolled_back');

  const rolloutState = await api(
    baseUrl,
    `/api/strategy/traits/rollout/state?rolloutId=${encodeURIComponent('rollout-test-1')}`
  );
  assert.equal(rolloutState.res.status, 200);
  assert.equal(rolloutState.json.rollout.rolloutId, 'rollout-test-1');

  const liveEval = await api(baseUrl, '/api/strategy/traits/rollout/evaluate-live', {
    method: 'POST',
    body: { rolloutId: 'rollout-test-1', windowMinutes: 15, lossBps: 100, volatilityBps: 900 },
  });
  assert.equal(liveEval.res.status, 200);
  assert.equal(typeof liveEval.json.live.fairnessAlerts, 'number');

  const dashboard = await api(baseUrl, '/api/strategy/traits/dashboard');
  assert.equal(dashboard.res.status, 200);
  assert.equal(Array.isArray(dashboard.json.rollouts), true);

  const freezeOn = await api(baseUrl, '/api/strategy/traits/policy/freeze', {
    method: 'POST',
    body: { freeze: true },
  });
  assert.equal(freezeOn.res.status, 200);
  assert.equal(freezeOn.json.freeze, true);

  const frozenCraft = await api(baseUrl, '/api/strategy/traits/craft', {
    method: 'POST',
    body: {
      provider: 'risk_profile',
      agentId: 'agent-frozen',
      riskProfile: { riskScore: 10, collusionScore: 5, tiltIndexBps: 1500 },
    },
  });
  assert.equal(frozenCraft.res.status, 400);
  assert.match(String(frozenCraft.json.error || ''), /frozen/i);

  const freezeOff = await api(baseUrl, '/api/strategy/traits/policy/freeze', {
    method: 'POST',
    body: { freeze: false },
  });
  assert.equal(freezeOff.res.status, 200);

  const revoke = await api(baseUrl, '/api/strategy/traits/policy/revoke-artifact', {
    method: 'POST',
    body: { artifactId },
  });
  assert.equal(revoke.res.status, 200);

  const revokedCraft = await api(baseUrl, '/api/strategy/traits/craft', {
    method: 'POST',
    body: {
      payloadVersion: 1,
      provider: 'cfr_profile',
      agentId: 'agent-rollout-1',
      provenance: { artifactId },
      cfrProfile: {
        actionMix: { fold: 0.1, check: 0.1, call: 0.25, raise: 0.45, bet: 0.07, allin: 0.03 },
        exploitabilityBb100: 2.9,
        sampleHands: 30000,
      },
    },
  });
  assert.equal(revokedCraft.res.status, 400);
  assert.match(String(revokedCraft.json.error || ''), /revoked/i);

  const slo = await api(baseUrl, '/api/strategy/traits/slo');
  assert.equal(slo.res.status, 200);
  assert.equal(typeof slo.json.slo.successRate, 'number');
});

test('trait control-plane state persists across restart', async (t) => {
  const port = 6460 + Math.floor(Math.random() * 250);
  const baseUrl = `http://127.0.0.1:${port}`;
  let instance = startServer(port);
  t.after(async () => {
    await stopServer(instance.proc);
  });
  await waitForHealth(baseUrl);

  const rollout = await api(baseUrl, '/api/strategy/traits/rollout', {
    method: 'POST',
    body: {
      rolloutId: 'persist-rollout-1',
      agentIds: ['a1', 'a2'],
      canaryPercent: 50,
    },
  });
  assert.equal(rollout.res.status, 201);

  const freeze = await api(baseUrl, '/api/strategy/traits/policy/freeze', {
    method: 'POST',
    body: { freeze: true },
  });
  assert.equal(freeze.res.status, 200);

  const revoke = await api(baseUrl, '/api/strategy/traits/policy/revoke-artifact', {
    method: 'POST',
    body: { artifactId: 'persist-artifact-1' },
  });
  assert.equal(revoke.res.status, 200);

  await stopServer(instance.proc);
  instance = startServer(port);
  await waitForHealth(baseUrl);

  const rolloutState = await api(
    baseUrl,
    `/api/strategy/traits/rollout/state?rolloutId=${encodeURIComponent('persist-rollout-1')}`
  );
  assert.equal(rolloutState.res.status, 200);
  assert.equal(rolloutState.json.rollout.rolloutId, 'persist-rollout-1');

  const dashboard = await api(baseUrl, '/api/strategy/traits/dashboard');
  assert.equal(dashboard.res.status, 200);
  assert.equal(dashboard.json.freeze, true);
  assert.equal(Number(dashboard.json.revokedArtifacts) >= 1, true);
});
