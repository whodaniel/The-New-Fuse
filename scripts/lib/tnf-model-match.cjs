#!/usr/bin/env node

/**
 * TNF Model Recommendation
 *
 * Real, minimal first step toward "route tasks to the optimal LLM model
 * based on public benchmarking data" (raised 2026-07-23 as foundationally
 * related to DIRECTIVES.md D22's agent-delegation check — see
 * scripts/lib/tnf-agent-match.cjs, which answers "which agent persona,"
 * while this answers "which underlying model").
 *
 * Uses data/llm-intel/ranking-recommendations.json, produced by
 * scripts/llm-intel/llm-ranking-optimizer.cjs from real NVIDIA NGC model
 * health/latency data. This is genuinely real (not simulated) data — but
 * it is currently GENERAL model health/latency/priority ranking only, not
 * task-category-specific. The per-category benchmark sources
 * (scripts/llm-intel/llm-arena-intel-collector.cjs — LM Arena coding/vision/
 * hard-prompts, Aider, Artificial Analysis, Open LLM Leaderboard) all
 * successfully fetch raw data but their parsed `rankings` arrays are empty
 * for every source — that parsing step was never implemented or is broken,
 * and the whole file is stale (2+ months old as of this writing). Fixing
 * those scrapers is tracked separately; this module does not pretend to
 * do task-category-aware routing it can't actually back with real data.
 *
 * Usage:
 *   const { recommendModel } = require('./lib/tnf-model-match.cjs');
 *   const top = recommendModel({ limit: 3 });
 *   // -> [{ model: 'z-ai/glm-5.1', compositeRank: 1, latencyMs: 3912, healthStatus: 'live' }, ...]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_RECOMMENDATIONS_PATH = path.join(
  REPO_ROOT,
  'data',
  'llm-intel',
  'ranking-recommendations.json'
);

const STALE_WARNING_MS = 24 * 60 * 60 * 1000; // 1 day

function loadRankingData(recommendationsPath = DEFAULT_RECOMMENDATIONS_PATH) {
  if (!fs.existsSync(recommendationsPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(recommendationsPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {object} [options]
 * @param {number} [options.limit] - max results (default 5)
 * @param {boolean} [options.includeUnhealthy] - include non-"live" models (default false)
 * @param {string} [options.recommendationsPath] - override the data file path (for tests)
 * @returns {{ models: Array<{model: string, compositeRank: number, latencyMs: number|null, healthStatus: string}>, stale: boolean, generatedAt: string|null }}
 */
function recommendModel(options = {}) {
  const { limit = 5, includeUnhealthy = false, recommendationsPath } = options;
  const data = loadRankingData(recommendationsPath);

  if (!data || !Array.isArray(data.compositeScores)) {
    return { models: [], stale: true, generatedAt: null };
  }

  const generatedAt = data.generatedAt || null;
  const stale = !generatedAt || Date.now() - new Date(generatedAt).getTime() > STALE_WARNING_MS;

  const candidates = data.compositeScores
    .filter((entry) => includeUnhealthy || entry.healthStatus === 'live')
    .sort((a, b) => (a.compositeRank ?? Infinity) - (b.compositeRank ?? Infinity))
    .slice(0, limit)
    .map((entry) => ({
      model: entry.nvidiaId,
      compositeRank: entry.compositeRank,
      latencyMs: entry.latencyMs ?? null,
      healthStatus: entry.healthStatus,
    }));

  return { models: candidates, stale, generatedAt };
}

module.exports = { recommendModel, loadRankingData };
