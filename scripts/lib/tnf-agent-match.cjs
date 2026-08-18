#!/usr/bin/env node

/**
 * TNF Agent Capability Matcher
 *
 * Real, minimal implementation of DIRECTIVES.md D22 ("Delegation-First
 * Check"). Not the full DACC/A2A delegation layer described in
 * docs/protocols/DACC_PROTOCOL_MASTER_MANUAL.md and
 * DACC_POML_MCP_A2A_INTEGRATION_BLUEPRINT.md — that requires a Python
 * runtime, an Orchestrator, and a real A2A client, none of which exist here.
 * This is a first, honest step using what the repo actually has today: the
 * ~190 `.claude/agents/*.md` personas, matched by simple token overlap
 * against their `description` frontmatter (most already read as a trigger
 * condition, e.g. "MUST BE USED to..." — a de facto matching signal that was
 * never parsed by code before this).
 *
 * Usage:
 *   const { findBestMatch, loadAgentRoster } = require('./lib/tnf-agent-match.cjs');
 *   const matches = findBestMatch('optimize this blog post for SEO', { limit: 3 });
 *   // -> [{ name: 'seo-optimizer-agent', score: 0.42, description: '...' }, ...]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'agents');

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has',
  'have', 'in', 'into', 'is', 'it', 'its', 'must', 'of', 'on', 'or', 'over',
  'that', 'the', 'this', 'to', 'used', 'via', 'with', 'without', 'you',
  'your', 'their', 'they', 'will', 'can', 'should', 'not', 'no',
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    const data = yaml.load(match[1]);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Loads every agent persona's matchable metadata from disk. Re-read on each
 * call rather than cached/persisted — ~190 small files is cheap, and this
 * avoids a stale index if agents are added/removed/edited between calls.
 */
function loadAgentRoster(agentsDir = DEFAULT_AGENTS_DIR) {
  if (!fs.existsSync(agentsDir)) return [];

  const roster = [];
  for (const file of fs.readdirSync(agentsDir)) {
    if (!file.endsWith('.md')) continue;
    const fullPath = path.join(agentsDir, file);
    let content;
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }
    const frontmatter = parseFrontmatter(content);
    if (!frontmatter || !frontmatter.name) continue;

    const tools = Array.isArray(frontmatter.tools)
      ? frontmatter.tools.map(String)
      : typeof frontmatter.tools === 'string'
        ? frontmatter.tools.split(',').map((t) => t.trim())
        : [];

    roster.push({
      name: String(frontmatter.name),
      description: String(frontmatter.description || ''),
      tools,
      file,
    });
  }
  return roster;
}

/**
 * Simple token-overlap score between a task description and an agent's
 * roster entry. Deliberately not ML/embeddings — inspectable, dependency-free
 * beyond js-yaml (already a repo dependency), matching the style of
 * scripts/lib/tnf-port-reaper.cjs and scripts/lib/tnf-heartbeat-filter.cjs.
 */
function scoreMatch(taskTokens, agent) {
  const descTokens = new Set(tokenize(agent.description));
  if (descTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of taskTokens) {
    if (descTokens.has(token)) overlap += 1;
  }
  // Normalize by the smaller set so short, precise descriptions aren't
  // penalized relative to long ones.
  const denominator = Math.min(taskTokens.size, descTokens.size) || 1;
  return overlap / denominator;
}

/**
 * @param {string} taskText - free-text description of the work to be done
 * @param {object} [options]
 * @param {number} [options.limit] - max results to return (default 5)
 * @param {number} [options.minScore] - drop matches below this score (default 0.15)
 * @param {string} [options.agentsDir] - override the agents directory (for tests)
 * @returns {Array<{name: string, score: number, description: string, tools: string[]}>}
 */
function findBestMatch(taskText, options = {}) {
  const { limit = 5, minScore = 0.15, agentsDir } = options;
  const taskTokens = new Set(tokenize(taskText));
  if (taskTokens.size === 0) return [];

  const roster = loadAgentRoster(agentsDir);
  const scored = roster
    .map((agent) => ({
      name: agent.name,
      description: agent.description,
      tools: agent.tools,
      score: scoreMatch(taskTokens, agent),
    }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

module.exports = { findBestMatch, loadAgentRoster, tokenize };
