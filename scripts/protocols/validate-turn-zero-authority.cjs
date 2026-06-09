#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode=')) || '--mode=local';
const mode = modeArg.split('=')[1] || 'local';

const repoRoot = process.cwd();
const canonicalRel = 'docs/protocols/TURN_ZERO_MANDATE.md';
const canonicalPath = path.join(repoRoot, canonicalRel);

function fail(message) {
  console.error(`[turn-zero-authority] BLOCKED (${mode}): ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`[turn-zero-authority] OK (${mode}): ${message}`);
}

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

if (!fs.existsSync(canonicalPath)) {
  fail(`canonical Turn Zero file missing: ${canonicalRel}`);
}

const canonical = read(canonicalRel);
if (!canonical.includes('Protocol ID: TNF_TURN_ZERO_CANONICAL')) {
  fail(`missing canonical protocol marker in ${canonicalRel}`);
}
if (!canonical.includes('TNF is the primary autonomous system and control plane')) {
  fail(`missing TNF control-plane boundary statement in ${canonicalRel}`);
}

const requiredReferences = [
  'docs/core/AGENTS.md',
  'docs/TNF_SESSION_ONBOARDING.md',
  'scripts/tnf-onboard.cjs',
  '.agent/SYSTEM_PROMPT.md',
  '.agent/context/resource-map.md',
  '.agent/context/agent-onboarding.md',
  '.agent/workflows/frontload.md',
];

for (const rel of requiredReferences) {
  if (!fs.existsSync(path.join(repoRoot, rel))) {
    fail(`required file missing: ${rel}`);
  }
  const content = read(rel);
  if (!content.includes(canonicalRel)) {
    fail(`${rel} does not reference canonical Turn Zero source (${canonicalRel})`);
  }
}

const livingStateRel = 'docs/protocols/LIVING_STATE.md';
const livingState = read(livingStateRel);
if (livingState.includes('Codify "Turn Zero" Mandate in `GEMINI.md`.')) {
  fail(`${livingStateRel} still claims GEMINI.md as canonical Turn Zero source`);
}

const runtimeInstructionFiles = [
  '.agent/SYSTEM_PROMPT.md',
  '.agent/context/resource-map.md',
  '.agent/context/agent-onboarding.md',
  '.agent/workflows/frontload.md',
  'scripts/tnf-onboard.cjs',
  'docs/TNF_SESSION_ONBOARDING.md',
  'docs/core/AGENTS.md',
];

const forbiddenRuntimePatterns = [
  {
    pattern: /Read this file FIRST/,
    reason: 'resource map cannot precede Turn Zero',
  },
  {
    pattern: /ws:\/\/localhost:3001\/ws/,
    reason: 'relay endpoint must be environment-configurable',
  },
  {
    pattern: /Handoff updated[`*_\s-]*.*\.agent\/handoff_notes\.txt/i,
    reason: 'legacy handoff cannot be a quality gate',
  },
  {
    pattern: /echo\s+"Session \$\(date\).*\.agent\/handoff_notes\.txt/,
    reason: 'runtime prompt cannot write legacy handoff notes',
  },
  {
    pattern: /\/Users\/danielgoldberg\//,
    reason: 'runtime instructions cannot contain personal absolute paths',
  },
  {
    pattern: /Desktop\/A1-Inter-LLM-Com\/The-New-Fuse/,
    reason: 'runtime instructions cannot contain personal workspace paths',
  },
];

for (const rel of runtimeInstructionFiles) {
  const content = read(rel);
  for (const { pattern, reason } of forbiddenRuntimePatterns) {
    if (pattern.test(content)) {
      fail(`${rel} violates Turn Zero runtime guard (${reason})`);
    }
  }
}

const requiredPrompt =
  'Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md.';
for (const rel of ['.agent/SYSTEM_PROMPT.md', '.agent/context/agent-onboarding.md', '.agent/workflows/frontload.md', 'scripts/tnf-onboard.cjs']) {
  const content = read(rel);
  if (!content.includes(requiredPrompt)) {
    fail(`${rel} does not expose the repository-relative raw-agent onboarding prompt`);
  }
}

ok('canonical Turn Zero authority and references are aligned');
