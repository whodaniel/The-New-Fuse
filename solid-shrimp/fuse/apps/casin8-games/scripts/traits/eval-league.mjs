import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { craftTraitsFromProvider } from '../../swarm/agent-strategy/trait-providers.mjs';
import { buildStrategyProfile, chooseAction } from '../../swarm/agent-strategy/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..', '..');

function arg(name, fallback = null) {
  const ix = process.argv.indexOf(name);
  if (ix < 0 || ix + 1 >= process.argv.length) return fallback;
  return process.argv[ix + 1];
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function actionScore(action) {
  if (action === 'raise') return 1.2;
  if (action === 'call') return 0.8;
  if (action === 'check') return 0.45;
  if (action === 'fold') return 0.1;
  return 0.3;
}

function bestResponseAction(handStrength, toCallUnits, potUnits) {
  const pressure = potUnits > 0 ? toCallUnits / potUnits : 0;
  if (handStrength >= 0.7) return 'raise';
  if (handStrength >= 0.52 && pressure <= 0.35) return 'call';
  if (pressure < 0.08) return 'check';
  return 'fold';
}

const output = arg('--output', path.join(root, '.data', 'traits', 'league-report.json'));
const rounds = Math.max(100, Number(arg('--rounds', 2000)));
const seed = Number(arg('--seed', 1337));
const rand = mulberry32(seed);

const entrants = [
  {
    id: 'texassolver-baseline',
    provider: 'texassolver',
    payload: {
      solverDump: {
        strategy: {
          actions: ['fold', 'call', 'raise'],
          strategy: { AhKh: [0.06, 0.24, 0.7], QsQh: [0.1, 0.2, 0.7], '7c6c': [0.2, 0.5, 0.3] },
        },
      },
      context: { gameType: 'mtt', phase: 'middle' },
    },
  },
  {
    id: 'cfr-advanced',
    provider: 'cfr_profile',
    payload: {
      cfrProfile: {
        actionMix: { fold: 0.11, check: 0.12, call: 0.24, raise: 0.41, bet: 0.08, allin: 0.04 },
        exploitabilityBb100: 3.2,
        sampleHands: 50000,
      },
      context: { gameType: 'mtt', phase: 'late' },
    },
  },
  {
    id: 'risk-constrained',
    provider: 'risk_profile',
    payload: {
      riskProfile: {
        riskScore: 82,
        collusionScore: 66,
        tiltIndexBps: 7600,
        abuseFlags: ['soft_play_cluster'],
      },
      context: { gameType: 'mtt', phase: 'bubble' },
    },
  },
];

const scoreboard = new Map(
  entrants.map((e) => [
    e.id,
    { rounds: 0, wins: 0, actionValue: 0, recommendation: null, temperament: null, maxRiskBps: null },
  ])
);

for (const entrant of entrants) {
  const rec = craftTraitsFromProvider({
    provider: entrant.provider,
    agentId: entrant.id,
    ...entrant.payload,
  });
  const profile = buildStrategyProfile({
    agentId: entrant.id,
    temperament: rec.recommended.temperament,
    maxRiskBps: rec.recommended.maxRiskBps,
  });
  const bucket = scoreboard.get(entrant.id);
  bucket.recommendation = rec;
  bucket.temperament = profile.temperament;
  bucket.maxRiskBps = profile.maxRiskBps;
}

for (let i = 0; i < rounds; i += 1) {
  let bestId = '';
  let bestScore = -Infinity;
  for (const entrant of entrants) {
    const bucket = scoreboard.get(entrant.id);
    const rec = bucket.recommendation;
    const profile = buildStrategyProfile({
      agentId: entrant.id,
      temperament: bucket.temperament,
      maxRiskBps: bucket.maxRiskBps,
    });
    const handStrength = rand();
    const potUnits = 20 + Math.floor(rand() * 180);
    const toCallUnits = Math.floor(rand() * 40);
    const decision = chooseAction({
      profile,
      legalActions: ['fold', 'check', 'call', 'raise'],
      handStrength,
      potUnits,
      toCallUnits,
    });
    const score =
      handStrength * actionScore(decision.action) +
      (Number(rec.recommended.maxRiskBps || 800) / 10000) * 0.12 +
      rand() * 0.03;
    bucket.rounds += 1;
    bucket.actionValue += score;
    if (score > bestScore) {
      bestScore = score;
      bestId = entrant.id;
    }
  }
  if (bestId) scoreboard.get(bestId).wins += 1;
}

const rankings = [...scoreboard.entries()]
  .map(([id, row]) => ({
    id,
    rounds: row.rounds,
    wins: row.wins,
    winRate: row.rounds > 0 ? Number((row.wins / row.rounds).toFixed(4)) : 0,
    avgActionValue: row.rounds > 0 ? Number((row.actionValue / row.rounds).toFixed(6)) : 0,
    temperament: row.temperament,
    maxRiskBps: row.maxRiskBps,
    provider: row.recommendation?.source || 'unknown',
    exploitabilityProxyBb100: Number((Math.max(0, 1 - (row.wins / Math.max(1, row.rounds))) * 100).toFixed(4)),
  }))
  .sort((a, b) => b.winRate - a.winRate || b.avgActionValue - a.avgActionValue);

let bestResponseMismatch = 0;
let brSamples = 0;
for (let i = 0; i < Math.min(4000, rounds); i += 1) {
  const handStrength = rand();
  const potUnits = 20 + Math.floor(rand() * 180);
  const toCallUnits = Math.floor(rand() * 40);
  const entrant = entrants[i % entrants.length];
  const row = scoreboard.get(entrant.id);
  const profile = buildStrategyProfile({
    agentId: entrant.id,
    temperament: row.temperament,
    maxRiskBps: row.maxRiskBps,
  });
  const decision = chooseAction({
    profile,
    legalActions: ['fold', 'check', 'call', 'raise'],
    handStrength,
    potUnits,
    toCallUnits,
  });
  const br = bestResponseAction(handStrength, toCallUnits, potUnits);
  if (decision.action !== br) bestResponseMismatch += 1;
  brSamples += 1;
}
const exploitabilityProxyBb100 = brSamples > 0 ? Number(((bestResponseMismatch / brSamples) * 100).toFixed(4)) : 0;
const promotion = {
  promote: rankings[0]?.winRate >= 0.34 && exploitabilityProxyBb100 <= 62,
  reason:
    rankings[0]?.winRate >= 0.34 && exploitabilityProxyBb100 <= 62
      ? 'meets win-rate and exploitability proxy thresholds'
      : 'below promotion threshold',
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  rounds,
  seed,
  entrants: entrants.map((x) => ({ id: x.id, provider: x.provider })),
  rankings,
  exploitabilityProxyBb100,
  promotion,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ok: true, output, winner: rankings[0]?.id || null }, null, 2)}\n`);
