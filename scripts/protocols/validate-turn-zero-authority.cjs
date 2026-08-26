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
const canonicalPlainText = canonical.replace(/[`*]/g, '');
if (!canonicalPlainText.includes('Protocol ID: TNF_TURN_ZERO_CANONICAL')) {
  fail(`missing canonical protocol marker in ${canonicalRel}`);
}
const controlPlaneStatements = [
  'TNF is the primary autonomous system and control plane',
  'TNF is the orchestration framework/control plane',
];
if (!controlPlaneStatements.some((statement) => canonicalPlainText.includes(statement))) {
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

// Fleet-policy reference check (soft): if a fleet policy exists in the
// operator home, LIVING_STATE.md should cross-reference it so the policy
// file stays authoritative rather than LIVING_STATE claiming a concrete
// model list as canonical.
const home = process.env.HOME;
if (home) {
  const policyPath = path.join(home, '.tnf', 'sub-director', 'model-policy.yaml');
  if (fs.existsSync(policyPath)) {
    if (!livingState.includes('.tnf/sub-director/model-policy.yaml')) {
      console.warn(`[turn-zero-authority] WARN (${mode}): model-policy.yaml exists at ${policyPath} but LIVING_STATE.md does not cross-reference it; fleet authority is split`);
    }
  }
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
  // Fleet drift guards — these catch concrete model names that age out of
  // the active fleet. Treat the operator's model-policy.yaml as the source
  // of truth, not the runtime instructions.
  {
    pattern: /\bnvidia\/meta\/llama-3\.3-70b-instruct\b/, // for reference, may legitimately appear in documentation; runtime instructions should not pre-bake it.
    // Soft warning: log only, since runtime instruction files may reference it as a deprecated example. The HARD requirement is "no canonical governance doc claims it as live."
    reason: 'concrete model in runtime instructions — read from model-policy.yaml instead',
    soft: true,
  },
  {
    pattern: /\bopenrouter\/deepseek-(?:chat-v3-0324|v3)/,
    reason: 'OpenRouter credits exhausted (2026-05-17); do not assume available',
    soft: true,
  },
  {
    pattern: /\bqwen2\.5-coder-1\.5b-instruct-q4_k_m\.gguf\b/,
    reason: 'specific GGUF filename is brittle; reference model-policy.yaml:models.local',
    soft: true,
  },
  // Hard-coded llama.cpp port — should be environment-configurable
  {
    pattern: /127\.0\.0\.1:8081|localhost:8081/,
    reason: 'llama-server port must come from model-policy.yaml:models.local.port',
  },
  // Hard-coded tier labels in ad-hoc directives
  {
    pattern: /\b(qwen2\.5-coder-3b|qwen2\.5-coder-1\.5b)-instruct\b/,
    reason: 'local model name hard-coded; resolve from model-policy.yaml',
    soft: true,
  },
];

for (const rel of runtimeInstructionFiles) {
  const content = read(rel);
  for (const { pattern, reason, soft } of forbiddenRuntimePatterns) {
    if (pattern.test(content)) {
      const label = soft ? 'WARN' : 'BLOCKED';
      const message = `${rel} violates Turn Zero runtime guard (${reason})`;
      if (soft) {
        console.warn(`[turn-zero-authority] ${label} (${mode}): ${message}`);
      } else {
        fail(message);
      }
    }
  }
}

const requiredPromptV1 =
  'Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md.';
for (const rel of ['.agent/SYSTEM_PROMPT.md', '.agent/context/agent-onboarding.md', '.agent/workflows/frontload.md', 'scripts/tnf-onboard.cjs']) {
  const content = read(rel);
  const hasV1 = content.includes(requiredPromptV1);
  const hasV2 = content.includes('pnpm run tnf:onboard') && content.includes('TURN_ZERO_MANDATE.md');
  if (!hasV1 && !hasV2) {
    fail(`${rel} does not expose the repository-relative raw-agent onboarding prompt`);
  }
}

ok('canonical Turn Zero authority and references are aligned');
