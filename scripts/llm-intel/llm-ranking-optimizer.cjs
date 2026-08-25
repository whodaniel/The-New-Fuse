#!/usr/bin/env node
/**
 * TNF Open Runtime — model observation + operator-policy ranking surface.
 *
 * The former public implementation embedded TNF-specific provider/model
 * ranking preferences. Those hosted optimization defaults are not required for
 * interoperability and no longer live here.
 *
 * This public tool remains useful:
 *   1. normalize current model observations;
 *   2. expose health/latency/arena evidence without promoting it to authority;
 *   3. optionally apply an OPERATOR-SUPPLIED local policy file;
 *   4. never modify provider configuration.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = process.env.TNF_REPO_ROOT || path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(REPO_ROOT, 'data', 'llm-intel');
const INTEL_FILE = path.join(DATA_DIR, 'arena-intel.json');
const OUT_FILE = path.join(DATA_DIR, 'ranking-recommendations.json'); // compatibility path
const REPORT_FILE = path.join(DATA_DIR, 'ranking-report-latest.md');
const POLICY_FILE = process.env.TNF_LOCAL_LLM_POLICY_FILE
  ? path.resolve(process.env.TNF_LOCAL_LLM_POLICY_FILE)
  : null;

function readJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return fallback; }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function normalizeName(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._/-]/g, '');
}

function collectObservations(intel) {
  const latest = intel.snapshots?.[0];
  if (!latest) return [];

  const byModel = new Map();
  const ensure = (id) => {
    if (!byModel.has(id)) {
      byModel.set(id, {
        model: id,
        arenaObservations: [],
        health: null,
        latencyMs: null,
        evidenceState: 'reported',
      });
    }
    return byModel.get(id);
  };

  for (const arena of latest.arenaData || []) {
    if (arena.status !== 'success') continue;
    for (const row of arena.rankings || []) {
      const id = normalizeName(row.model);
      if (!id) continue;
      ensure(id).arenaObservations.push({
        sourceType: arena.sourceType || 'unknown',
        source: arena.source || arena.name || null,
        rank: Number.isFinite(Number(row.rank)) ? Number(row.rank) : null,
        score: Number.isFinite(Number(row.score)) ? Number(row.score) : null,
      });
    }
  }

  for (const health of latest.nvidiaHealth || []) {
    const id = normalizeName(health.model);
    if (!id) continue;
    const row = ensure(id);
    row.health = health.status || 'unknown';
    row.latencyMs = Number.isFinite(Number(health.latencyMs)) ? Number(health.latencyMs) : null;
  }

  return [...byModel.values()].sort((a, b) => a.model.localeCompare(b.model));
}

function loadOperatorPolicy() {
  if (!POLICY_FILE) return null;
  const policy = readJson(POLICY_FILE, null);
  if (!policy || typeof policy !== 'object') {
    throw new Error(`TNF_LOCAL_LLM_POLICY_FILE is unreadable/invalid: ${POLICY_FILE}`);
  }
  if (policy.owner !== 'operator' && policy.owner !== 'user') {
    throw new Error('Local LLM policy must declare owner="operator" or owner="user"');
  }
  return policy;
}

function averageNumeric(values) {
  const nums = values.filter((v) => Number.isFinite(Number(v))).map(Number);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Generic operator-owned policy evaluator.
 *
 * TNF supplies no hidden/default optimized weights here. Every numeric weight
 * must come from the local policy file. Unknown dimensions contribute zero.
 */
function applyOperatorPolicy(observations, policy) {
  const weights = policy.weights && typeof policy.weights === 'object' ? policy.weights : {};
  const preferred = new Set((policy.preferredModels || []).map(normalizeName));
  const excluded = new Set((policy.excludedModels || []).map(normalizeName));
  const eligibleHealth = Array.isArray(policy.eligibleHealth)
    ? new Set(policy.eligibleHealth.map((v) => String(v).toLowerCase()))
    : null;

  return observations
    .filter((obs) => !excluded.has(obs.model))
    .filter((obs) => !eligibleHealth || eligibleHealth.has(String(obs.health || 'unknown').toLowerCase()))
    .map((obs) => {
      const arenaScore = averageNumeric(obs.arenaObservations.map((x) => x.score));
      const arenaRank = averageNumeric(obs.arenaObservations.map((x) => x.rank));
      const components = {
        arenaScore: arenaScore == null ? 0 : arenaScore * Number(weights.arenaScore || 0),
        arenaRank: arenaRank == null ? 0 : arenaRank * Number(weights.arenaRank || 0),
        latencyMs: obs.latencyMs == null ? 0 : obs.latencyMs * Number(weights.latencyMs || 0),
        healthLive: obs.health === 'live' ? Number(weights.healthLive || 0) : 0,
        healthTimeout: obs.health === 'timeout' ? Number(weights.healthTimeout || 0) : 0,
        preferred: preferred.has(obs.model) ? Number(weights.preferred || 0) : 0,
      };
      const score = Object.values(components).reduce((a, b) => a + b, 0);
      return { model: obs.model, score, components, observation: obs };
    })
    .sort((a, b) => b.score - a.score || a.model.localeCompare(b.model));
}

function markdown(output) {
  const lines = [
    '# TNF Open Runtime — Model Observation Report',
    '',
    `Generated: ${output.generatedAt}`,
    '',
    '> Observations are not provider authority. Hosted TNF optimization is not published here.',
    '',
    `Policy: ${output.localPolicy ? `operator-supplied (${output.localPolicy.path})` : 'none — observations only'}`,
    '',
    '## Observations',
    '',
    '| Model | Health | Latency | Arena reports |',
    '| --- | --- | ---: | ---: |',
  ];
  for (const obs of output.observations.slice(0, 100)) {
    lines.push(`| \`${obs.model}\` | ${obs.health || 'unknown'} | ${obs.latencyMs ?? '-'} | ${obs.arenaObservations.length} |`);
  }

  if (output.localRanking) {
    lines.push('', '## Operator-policy ranking', '', '| Rank | Model | Score |', '| ---: | --- | ---: |');
    output.localRanking.slice(0, 100).forEach((row, index) => {
      lines.push(`| ${index + 1} | \`${row.model}\` | ${Number(row.score).toFixed(3)} |`);
    });
    lines.push('', '> Ranking is produced solely from the local operator policy file and current observations.');
  } else {
    lines.push('', 'No ranking was produced. Set `TNF_LOCAL_LLM_POLICY_FILE` to an operator-owned JSON policy to rank locally.');
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const startedAt = new Date().toISOString();
  const intel = readJson(INTEL_FILE, { spec: 'tnf/llm-arena-intel/0.1', snapshots: [] });
  if (!intel.snapshots?.length) {
    console.error(JSON.stringify({ ok: false, error: 'No intel data. Run tnf:llm:collect first.' }, null, 2));
    process.exit(1);
  }

  const observations = collectObservations(intel);
  const policy = loadOperatorPolicy();
  const localRanking = policy ? applyOperatorPolicy(observations, policy) : null;

  const output = {
    spec: 'tnf/open-model-observation/0.2',
    generatedAt: startedAt,
    intelSnapshotId: intel.snapshots[0]?.id || null,
    evidenceState: 'reported',
    observations,
    recommendations: [],
    localPolicy: policy ? { path: POLICY_FILE, owner: policy.owner, id: policy.id || null } : null,
    localRanking,
    hostedOptimizationPublished: false,
    note: policy
      ? 'Local ranking uses only operator-supplied weights/preferences. No TNF hosted optimization weights are embedded.'
      : 'Observations only. Supply TNF_LOCAL_LLM_POLICY_FILE for inspectable local ranking, or use an optional hosted policy contract.',
  };

  writeJson(OUT_FILE, output);
  fs.writeFileSync(REPORT_FILE, markdown(output), 'utf8');
  console.log(JSON.stringify({
    ok: true,
    observations: observations.length,
    localPolicyApplied: Boolean(policy),
    localRankingCount: localRanking?.length || 0,
    output: path.relative(REPO_ROOT, OUT_FILE),
  }, null, 2));
}

try { main(); } catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
}
