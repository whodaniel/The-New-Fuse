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
    await delay(150);
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

test('session -> poker play -> ledger -> reveal flow + agent ops', async (t) => {
  const port = 4010 + Math.floor(Math.random() * 400);
  const runTag = `qa-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
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
      game: 'poker',
      bet: 10,
      options: {},
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

  const registered = await api(baseUrl, '/api/agents/register', {
    method: 'POST',
    body: {
      agentId: 'agent-it-1',
      ownerId: 'owner-it',
      tier: 'B',
      style: 'tight_aggressive',
    },
  });
  assert.equal(registered.res.status, 201);
  assert.equal(registered.json.ok, true);

  const strat = await api(baseUrl, '/api/strategy/profile', {
    method: 'POST',
    body: {
      agentId: 'agent-it-1',
      temperament: 'tight_aggressive',
      maxRiskBps: 700,
    },
  });
  assert.equal(strat.res.status, 201);
  assert.equal(strat.json.ok, true);

  const decision = await api(baseUrl, '/api/strategy/decide', {
    method: 'POST',
    body: {
      agentId: 'agent-it-1',
      bankrollUnits: 1000,
      legalActions: ['fold', 'check', 'call', 'raise'],
      handStrength: 0.66,
      potUnits: 80,
      toCallUnits: 10,
    },
  });
  assert.equal(decision.res.status, 200);
  assert.equal(decision.json.ok, true);
  assert.equal(typeof decision.json.executable, 'boolean');

  const sim = await api(baseUrl, '/api/sim/equity', {
    method: 'POST',
    body: {
      seed: 'sim-seed-1',
      iterations: 500,
      boardCards: ['Ah', 'Kd', '7c'],
      players: [{ playerId: 'agent-it-1' }, { playerId: 'v1' }],
    },
  });
  assert.equal(sim.res.status, 200);
  assert.equal(sim.json.ok, true);
  assert.equal(Array.isArray(sim.json.simulation.players), true);

  const nurtureInit = await api(baseUrl, '/api/agents/nurture/init', {
    method: 'POST',
    body: {
      agentId: 'agent-it-1',
      ownerId: 'owner-it',
      objective: 'cash_nlhe_6max',
      distributed: true,
    },
  });
  assert.equal(nurtureInit.res.status, 201);
  assert.equal(nurtureInit.json.ok, true);

  const nurtureEpisode = await api(baseUrl, '/api/agents/nurture/episode', {
    method: 'POST',
    body: {
      agentId: 'agent-it-1',
      bb100: 1.4,
      exploitabilityProxy: 48,
      policyEntropy: 0.31,
      showdownErrorRateBps: 8,
      decisionLatencyMsP95: 220,
      legalActionViolationBps: 0,
      bankrollVolatilityBps: 900,
      autoEvaluate: true,
    },
  });
  assert.equal(nurtureEpisode.res.status, 200);
  assert.equal(nurtureEpisode.json.ok, true);
  assert.equal(typeof nurtureEpisode.json.coachCard.stage, 'string');

  const nurtureState = await api(baseUrl, '/api/agents/nurture/state?agentId=agent-it-1');
  assert.equal(nurtureState.res.status, 200);
  assert.equal(nurtureState.json.ok, true);
  assert.equal(nurtureState.json.program.agentId, 'agent-it-1');

  const swarm = await api(baseUrl, '/api/swarm/status');
  assert.equal(swarm.res.status, 200);
  assert.equal(swarm.json.ok, true);
  assert.ok(typeof swarm.json.status === 'object');

  const tableInit = await api(baseUrl, '/api/table/state/init', {
    method: 'POST',
    body: {
      tableId: 'qa-table',
      handId: 'qa-hand-1',
      seats: [{ seat: 0 }, { seat: 1 }],
      actingSeat: 0,
      pot: 0,
    },
  });
  assert.equal(tableInit.res.status, 201);
  assert.equal(tableInit.json.ok, true);
  assert.equal(tableInit.json.snapshot.handId, 'qa-hand-1');

  const tableAction = await api(baseUrl, '/api/table/action', {
    method: 'POST',
    body: {
      tableId: 'qa-table',
      idempotencyKey: 'qa-k-1',
      type: 'player.action',
      seat: tableInit.json.snapshot.actingSeat,
      action: 'fold',
      amount: 0,
    },
  });
  assert.equal(tableAction.res.status, 200);
  assert.equal(tableAction.json.ok, true);
  assert.equal(tableAction.json.accepted, true);
  assert.equal(typeof tableAction.json.snapshot.currentBet, 'number');
  assert.equal(tableAction.json.snapshot.pot >= 0, true);

  const tableState = await api(baseUrl, '/api/table/state?tableId=qa-table');
  assert.equal(tableState.res.status, 200);
  assert.equal(tableState.json.ok, true);
  assert.equal(typeof tableState.json.snapshot.currentBet, 'number');

  const tableInitForSettle = await api(baseUrl, '/api/table/state/init', {
    method: 'POST',
    body: {
      tableId: 'qa-table-settle',
      handId: 'qa-hand-settle',
      seats: [{ seat: 0 }, { seat: 1 }],
      actingSeat: 0,
      pot: 50,
    },
  });
  assert.equal(tableInitForSettle.res.status, 201);

  const tableSettle = await api(baseUrl, '/api/table/settle', {
    method: 'POST',
    body: { tableId: 'qa-table-settle', winnerSeat: 0, payoutUnits: 50 },
  });
  assert.equal([200, 409].includes(tableSettle.res.status), true);
  if (tableSettle.res.status === 200) {
    assert.equal(tableSettle.json.ok, true);
    assert.equal(tableSettle.json.snapshot.terminal, true);
  } else {
    assert.equal(tableSettle.json.ok, false);
  }

  const tableAuto = await api(baseUrl, '/api/table/round/auto', {
    method: 'POST',
    body: {
      tableId: 'qa-table-auto',
      handId: 'qa-hand-auto',
      seats: [{ seat: 0 }, { seat: 1 }],
      maxActions: 4,
    },
  });
  assert.equal(tableAuto.res.status, 200);
  assert.equal(tableAuto.json.ok, true);
  assert.equal(Array.isArray(tableAuto.json.timeline), true);
  if (tableAuto.json.timeline.length > 0) {
    assert.equal(typeof tableAuto.json.timeline[0].agentId, 'string');
    assert.equal(typeof tableAuto.json.timeline[0].policy, 'object');
  }

  const sngCreate = await api(baseUrl, '/api/sng/create', {
    method: 'POST',
    body: { tournamentId: `qa-sng-${runTag}`, maxPlayers: 6, buyInUnits: 100 },
  });
  assert.equal(sngCreate.res.status, 201);
  assert.equal(sngCreate.json.ok, true);

  const sponsorshipOpen = await api(baseUrl, '/api/sponsorships/open', {
    method: 'POST',
    body: {
      positionId: `qa-pos-${runTag}`,
      agentId: 'agent-it-1',
      stakeForSaleBps: 7000,
      markupBps: 11000,
      maxExposureUnits: 1000000,
    },
  });
  assert.equal(sponsorshipOpen.res.status, 201);
  assert.equal(sponsorshipOpen.json.ok, true);

  const sponsorshipFund = await api(baseUrl, '/api/sponsorships/fund', {
    method: 'POST',
    body: {
      positionId: `qa-pos-${runTag}`,
      sponsorId: 'sponsor-it-1',
      principalUnits: 500,
    },
  });
  assert.equal(sponsorshipFund.res.status, 200);
  assert.equal(sponsorshipFund.json.ok, true);

  const sponsorshipClose = await api(baseUrl, '/api/sponsorships/close', {
    method: 'POST',
    body: { positionId: `qa-pos-${runTag}` },
  });
  assert.equal(sponsorshipClose.res.status, 200);
  assert.equal(sponsorshipClose.json.ok, true);

  const sponsorshipSettle = await api(baseUrl, '/api/sponsorships/settle', {
    method: 'POST',
    body: {
      positionId: `qa-pos-${runTag}`,
      eventId: `qa-event-${runTag}`,
      buyInUnits: 100,
      prizeUnits: 250,
      rakeUnits: 5,
    },
  });
  assert.equal(sponsorshipSettle.res.status, 200);
  assert.equal(sponsorshipSettle.json.ok, true);

  const sponsorshipClaim = await api(baseUrl, '/api/sponsorships/claim', {
    method: 'POST',
    body: {
      positionId: `qa-pos-${runTag}`,
      sponsorId: 'sponsor-it-1',
      creditToCashier: true,
      playerId: 'sponsor-it-1',
      ledgerId: 'default',
      idempotencyKey: 'qa-claim-1',
    },
  });
  assert.equal(sponsorshipClaim.res.status, 200);
  assert.equal(sponsorshipClaim.json.ok, true);
  assert.equal(sponsorshipClaim.json.claim.claimedUnits !== undefined, true);

  const sponsorshipHistory = await api(
    baseUrl,
    `/api/sponsorships/history?positionId=${encodeURIComponent(`qa-pos-${runTag}`)}`
  );
  assert.equal(sponsorshipHistory.res.status, 200);
  assert.equal(sponsorshipHistory.json.ok, true);
  assert.equal(Array.isArray(sponsorshipHistory.json.settlements), true);

  const cashierEntries = await api(
    baseUrl,
    '/api/cashier/entries?ledgerId=default&playerId=sponsor-it-1'
  );
  assert.equal(cashierEntries.res.status, 200);
  assert.equal(cashierEntries.json.ok, true);
  assert.equal(Array.isArray(cashierEntries.json.entries), true);

  const v2Table = await api(baseUrl, '/api/v2/holdem/tables', {
    method: 'POST',
    body: {
      tableId: 'v2-table-1',
      mode: 'cash',
      maxSeats: 6,
      smallBlind: 50,
      bigBlind: 100,
      ante: 10,
      seats: [
        { playerId: 'hv2-a', seat: 0, stack: 3000 },
        { playerId: 'hv2-b', seat: 1, stack: 3000 },
        { playerId: 'hv2-c', seat: 2, stack: 1200 },
      ],
    },
  });
  assert.equal(v2Table.res.status, 201);
  assert.equal(v2Table.json.ok, true);

  const v2Start = await api(baseUrl, '/api/v2/holdem/hands/start', {
    method: 'POST',
    body: {
      tableId: 'v2-table-1',
      handId: 'v2-hand-1',
      idempotencyKey: 'v2-start-1',
    },
  });
  assert.equal(v2Start.res.status, 200);
  assert.equal(v2Start.json.ok, true);
  assert.equal(v2Start.json.table.hand.handId, 'v2-hand-1');

  const actingSeat = v2Start.json.table.hand.actingSeat;
  const actingPlayer = v2Start.json.table.seats.find((row) => row.seat === actingSeat)?.playerId;
  const v2Resume = await api(baseUrl, '/api/v2/holdem/resume', {
    method: 'POST',
    body: { tableId: 'v2-table-1', playerId: actingPlayer },
  });
  assert.equal(v2Resume.res.status, 200);
  const v2Action = await api(baseUrl, '/api/v2/holdem/actions', {
    method: 'POST',
    body: {
      tableId: 'v2-table-1',
      playerId: actingPlayer,
      action: 'call',
      idempotencyKey: 'v2-a1',
      resumeToken: v2Resume.json.resume.token,
    },
  });
  assert.equal(v2Action.res.status, 200);
  assert.equal(v2Action.json.ok, true);

  const v2Replay = await api(baseUrl, '/api/v2/holdem/replay?tableId=v2-table-1');
  assert.equal(v2Replay.res.status, 200);
  assert.equal(v2Replay.json.ok, true);
  assert.equal(Array.isArray(v2Replay.json.events), true);

  const v2Tournament = await api(baseUrl, '/api/v2/tournaments', {
    method: 'POST',
    body: {
      tournamentId: 'v2-mtt-1',
      type: 'mtt',
      maxPlayers: 12,
      tableSize: 6,
      buyInUnits: 1000,
      rebuy: { enabled: true, maxPerPlayer: 1, untilLevelInclusive: 3, chipsPerRebuy: 12000 },
      addon: { enabled: true, level: 3, chips: 20000 },
    },
  });
  assert.equal(v2Tournament.res.status, 201);
  assert.equal(v2Tournament.json.ok, true);

  const v2Reg1 = await api(baseUrl, '/api/v2/tournaments/register', {
    method: 'POST',
    body: { tournamentId: 'v2-mtt-1', playerId: 'tv2-1' },
  });
  const v2Reg2 = await api(baseUrl, '/api/v2/tournaments/register', {
    method: 'POST',
    body: { tournamentId: 'v2-mtt-1', playerId: 'tv2-2' },
  });
  assert.equal(v2Reg1.res.status, 200);
  assert.equal(v2Reg2.res.status, 200);

  const v2StartT = await api(baseUrl, '/api/v2/tournaments/start', {
    method: 'POST',
    body: { tournamentId: 'v2-mtt-1' },
  });
  assert.equal(v2StartT.res.status, 200);
  assert.equal(v2StartT.json.ok, true);

  const v2Clock = await api(baseUrl, '/api/v2/tournaments/clock', {
    method: 'POST',
    body: { tournamentId: 'v2-mtt-1', seconds: 600 },
  });
  assert.equal(v2Clock.res.status, 200);
  assert.equal(v2Clock.json.ok, true);

  const v2State = await api(baseUrl, '/api/v2/tournaments/state?tournamentId=v2-mtt-1');
  assert.equal(v2State.res.status, 200);
  assert.equal(v2State.json.ok, true);
  assert.equal(Array.isArray(v2State.json.eventLog), true);

  assert.equal(getStderr(), '');
});
