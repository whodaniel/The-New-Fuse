#!/usr/bin/env node
/**
 * check-skill-cited-paths.cjs — every path a skill cites must exist.
 *
 * A SKILL.md that tells an agent to open `scripts/improver/scan.js` when the
 * file is `scan.cjs`, or cites a sibling skill that was never propagated,
 * teaches agents to run into walls. This is the honest-guard-review Q3
 * failure ("looked in the wrong place") applied to the skill corpus itself.
 *
 * Scope: `.agent/skills/<name>/SKILL.md` — the repo's primary agent-instruction
 * root (the surface wired via AGENTS.md for codex/opencode/kilo/jules).
 *
 * Ratchet (honest-guard Q5 — a check that fails by default on day one trains
 * operators to ignore it): citations that were already broken before
 * 2026-09-06 are recorded in data/harness/skill-cited-paths-baseline.json.
 * The gate fails on any cited path NOT in the baseline. Regenerate the
 * baseline with --update-baseline only after actually fixing citations.
 *
 * Outcomes (TNF honest-guard: distinguishable, never silently empty):
 *   exit 0  — every cited repo path resolves (or is a documented baseline
 *             entry); home-relative absences are NOTE, never FAIL.
 *   exit 1  — at least one cited repo path does not exist and is not in the
 *             baseline. Each finding names the skill, the cited path, and the
 *             fix (correct or delete the citation).
 *   exit 2  — cannot run (skill root or baseline missing/malformed). Distinct
 *             from "nothing wrong".
 *
 * Wiring:
 *   package.json → "test:skills:cited-paths": "node scripts/harness/check-skill-cited-paths.cjs"
 *
 * Precedent: scripts/harness/assimilation-scan.cjs asserts specific skill
 * paths exist; scripts/harness/check-command-surface (ratchet + --update)
 * is the baseline pattern.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SKILL_DIR = path.join(ROOT, '.agent', 'skills');
const BASELINE_PATH = path.join(ROOT, 'data', 'harness', 'skill-cited-paths-baseline.json');

// Repo-root-relative path prefixes that count as "cited repo path" when they
// appear in a SKILL.md. Deliberately conservative: only prefixes that are
// unambiguous filesystem references, never bare words or URLs.
const REPO_PREFIXES = [
  'scripts/',
  'docs/',
  'packages/',
  'apps/',
  'data/',
  'config/',
  '.agent/',
  '.skills/',
  '.claude/',
  '.github/',
  '.husky/',
];

// Characters that may trail a cited path due to prose punctuation.
// (quote / apostrophe / backtick are added via char codes to keep this file
// free of nested escape sequences; '…' is prose ellipsis)
const TRIM_TRAILING = '.,;:!?)}]>' + '"…' + String.fromCharCode(39, 96);

function loadJsonSafe(abs) {
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch {
    return null;
  }
}

function extractCitedPaths(text) {
  const found = new Set();
  // Split into tokens on whitespace and markdown delimiters, then keep tokens
  // that start with a known repo prefix or `~/`.
  const tokens = text.split(/[\s<>()[\]{}|]+/);
  for (const raw of tokens) {
    let token = raw.replace(/^["'`]+|["'`]+$/g, '');
    // Strip trailing prose punctuation repeatedly (e.g. `path).` or `path",`).
    let changed = true;
    while (changed && token.length > 0) {
      changed = false;
      while (token.length > 0 && TRIM_TRAILING.includes(token[token.length - 1])) {
        token = token.slice(0, -1);
        changed = true;
      }
      // Strip a trailing :<digits> (cited line number, e.g. cli.ts:4020).
      const lineRef = token.match(/:\d+$/);
      if (lineRef) {
        token = token.slice(0, -lineRef[0].length);
        changed = true;
      }
      // Strip a trailing * (markdown bold / glob tails like `dir/**`).
      if (token.endsWith('*')) {
        token = token.replace(/\*+$/, '');
        changed = true;
      }
    }
    if (!token) continue;
    if (token.startsWith('~/')) {
      found.add(token);
      continue;
    }
    for (const prefix of REPO_PREFIXES) {
      if (token.startsWith(prefix)) {
        found.add(token);
        break;
      }
    }
  }
  return [...found];
}

function staticPartOf(rel) {
  // For globs (`dir/**`, `file-*.json`) and shell-variable tails
  // (`scripts/protocols/$g.cjs`), only the static prefix can be verified.
  const metaIdx = rel.search(/[*?[$]/);
  const staticPart = metaIdx >= 0 ? rel.slice(0, metaIdx) : rel;
  return staticPart.replace(/\/$/, '');
}

function pathExistsRepoRel(rel) {
  return fs.existsSync(path.join(ROOT, staticPartOf(rel)));
}

function pathExistsHomeRel(rel) {
  const home = process.env.HOME || '';
  if (!home) return false;
  return fs.existsSync(path.join(home, rel.slice(2)));
}

function baselineKey(skillRel, cited) {
  return `${skillRel} -> ${cited}`;
}

function loadBaseline() {
  const raw = loadJsonSafe(BASELINE_PATH);
  if (raw === null) return null;
  if (!raw || typeof raw !== 'object' || !raw.knownStale || typeof raw.knownStale !== 'object') {
    return null;
  }
  return raw;
}

function collectViolations() {
  const violations = []; // { skill, cited }
  const homeNotes = [];
  const skillDirs = fs
    .readdirSync(SKILL_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const name of skillDirs) {
    const skillMd = path.join(SKILL_DIR, name, 'SKILL.md');
    if (!fs.existsSync(skillMd)) continue;
    const skillRel = `.agent/skills/${name}/SKILL.md`;
    const text = fs.readFileSync(skillMd, 'utf8');
    for (const cited of extractCitedPaths(text)) {
      if (cited.startsWith('~/')) {
        if (!pathExistsHomeRel(cited)) {
          homeNotes.push(
            `${skillRel} cites "${cited}" (home-relative, absent on this machine — optional by definition)`
          );
        }
        continue;
      }
      if (!pathExistsRepoRel(cited)) {
        violations.push({ skill: skillRel, cited });
      }
    }
  }
  return { violations, homeNotes, checkedSkills: skillDirs.length };
}

function main() {
  const updateBaseline = process.argv.includes('--update-baseline');

  if (!fs.existsSync(SKILL_DIR)) {
    console.error(
      `[check-skill-cited-paths] CANNOT RUN: skill root not found at ${SKILL_DIR}. ` +
        `Fix: run from a TNF repository checkout (expected .agent/skills/).`
    );
    process.exit(2);
  }

  const { violations, homeNotes, checkedSkills } = collectViolations();
  if (checkedSkills === 0) {
    console.error(
      `[check-skill-cited-paths] CANNOT RUN: no SKILL.md files found under ${SKILL_DIR}. ` +
        `Fix: this checker validates .agent/skills/<name>/SKILL.md; if the skill root moved, update SKILL_DIR.`
    );
    process.exit(2);
  }

  const baseline = loadBaseline();
  if (baseline === null && !updateBaseline) {
    console.error(
      `[check-skill-cited-paths] CANNOT RUN: baseline missing or malformed at ${BASELINE_PATH}. ` +
        `Fix: regenerate with "node scripts/harness/check-skill-cited-paths.cjs --update-baseline" ` +
        `(after verifying each entry is genuinely pre-existing rot, not a new break).`
    );
    process.exit(2);
  }

  if (updateBaseline) {
    const knownStale = {};
    for (const v of violations) {
      knownStale[baselineKey(v.skill, v.cited)] =
        'pre-existing rot recorded 2026-09-06 when the gate was wired; triage queued, not yet fixed';
    }
    const payload = {
      schemaVersion: 1,
      description:
        'Known-stale path citations in .agent/skills SKILL.md files, tolerated by check-skill-cited-paths.cjs so pre-existing rot does not cry wolf. The gate FAILS on any citation not listed here. Regenerate with --update-baseline only after fixing citations — never to silence a new break.',
      generatedAt: new Date().toISOString(),
      count: Object.keys(knownStale).length,
      knownStale,
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log(
      `[check-skill-cited-paths] baseline updated: ${Object.keys(knownStale).length} known-stale citation(s) recorded at data/harness/skill-cited-paths-baseline.json`
    );
    process.exit(0);
  }

  for (const note of homeNotes) console.log(`[check-skill-cited-paths] NOTE: ${note}`);

  const knownStale = baseline.knownStale || {};
  const fresh = [];
  const tolerated = [];
  for (const v of violations) {
    const key = baselineKey(v.skill, v.cited);
    if (Object.prototype.hasOwnProperty.call(knownStale, key)) tolerated.push(v);
    else fresh.push(v);
  }
  for (const v of tolerated) {
    console.log(`[check-skill-cited-paths] KNOWN-STALE (baselined): ${v.skill} cites "${v.cited}"`);
  }

  if (fresh.length > 0) {
    console.error(
      `[check-skill-cited-paths] FAIL: ${fresh.length} cited path(s) do not exist and are not in the baseline. Every finding names the fix:`
    );
    for (const f of fresh) {
      console.error(`  - ${f.skill}`);
      console.error(`      cites: ${f.cited}`);
      console.error(
        `      fix:   correct the citation to the real path, or delete the reference (the cited file does not exist in this repository)`
      );
    }
    console.error(
      `\n[check-skill-cited-paths] A skill that points at absent files converts guidance into a wall. ` +
        `Correct the citations above, then re-run: npm run test:skills:cited-paths`
    );
    process.exit(1);
  }

  console.log(
    `[check-skill-cited-paths] PASS: ${checkedSkills} skills checked; all cited repo paths resolve ` +
      `(${tolerated.length} baselined known-stale, ${homeNotes.length} optional home-relative note(s)).`
  );
  process.exit(0);
}

main();
