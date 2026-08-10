#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { singleInstanceGuard } = require('./lib/tnf-single-instance-guard.cjs');

// Managed poolers (Supabase et al) can reject connection teardown AFTER the
// runtime-snapshot step deliberately timed out: postgres.js destroy timers
// throw CONNECTION_DESTROYED outside any promise chain, which crashed the
// entire boot (observed live 2026-07-22, tnf tui killed post-triage). That
// class is cleanup noise from an already-handled timeout — swallow ONLY it;
// every other uncaught error keeps default crash semantics.
const PG_TEARDOWN_CODES = new Set(['CONNECTION_DESTROYED', 'CONNECTION_CLOSED', 'CONNECTION_ENDED']);
function isPgTeardownError(err) {
  return !!err && (PG_TEARDOWN_CODES.has(err.code) || PG_TEARDOWN_CODES.has(err.errno));
}
process.on('uncaughtException', (err) => {
  if (isPgTeardownError(err)) {
    console.log(`- transient: postgres pooler teardown after timeout (${err.code || err.errno}) — ignored`);
    return;
  }
  console.error(err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  if (isPgTeardownError(err)) {
    console.log(`- transient: postgres pooler teardown after timeout (${err?.code || err?.errno}) — ignored`);
    return;
  }
  console.error(err);
  process.exit(1);
});

const ROOT = process.cwd();
const ONBOARD_GENERATED_MARKER = 'tnf-onboard --repair';
const CANONICAL_SESSION_HANDOFF_JSON = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
const CANONICAL_SESSION_HANDOFF_MD = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md';
const CANONICAL_TURN_ZERO_MANDATE = 'docs/protocols/TURN_ZERO_MANDATE.md';
const DEFAULT_RUNTIME_SNAPSHOT_TIMEOUT_MS = 8000;
const DEFAULT_FRONTLOAD_BUDGET_WORDS = 3500;
const FRONTLOAD_BUDGET_FLOOR_WORDS = 800;
const FLEET_PROBE_TIMEOUT_MS = 3000;
const FRONTLOAD_CHECKLIST = [
  '.agent/SYSTEM_PROMPT.md',
  '.agent/context/resource-map.md',
  '.agent/context/agent-onboarding.md',
  '.agent/workflows/frontload.md',
  CANONICAL_TURN_ZERO_MANDATE,
  'docs/protocols/LIVING_STATE.md',
  'docs/protocols/AGENT_STATUS_LEDGER.md',
  CANONICAL_SESSION_HANDOFF_JSON,
  'docs/core/FRONTLOAD_MANIFEST.md',
  'docs/core/SOUL.md',
  'docs/core/IDENTITY.md',
  'docs/core/USER.md',
  'docs/core/TOOLS.md',
  'docs/core/HEARTBEAT.md',
  'docs/core/SECURITY.md',
  'docs/core/MEMORY.md',
  'docs/core/BOOTSTRAP.md',
  'docs/core/ENGINEERING_PRINCIPLES.md',
  'docs/protocols/HARNESS_CONFIG.md',
  'data/harness/harness-config.json',
  'data/mcp_config.json',
];
const FRONTLOAD_BUDGET_PROFILE = [
  { path: '.agent/SYSTEM_PROMPT.md', stage: 'eager' },
  { path: CANONICAL_TURN_ZERO_MANDATE, stage: 'eager' },
  { path: 'docs/protocols/LIVING_STATE.md', stage: 'eager' },
  { path: CANONICAL_SESSION_HANDOFF_JSON, stage: 'eager' },
  { path: 'docs/core/FRONTLOAD_MANIFEST.md', stage: 'defer' },
  { path: '.agent/context/agent-onboarding.md', stage: 'defer' },
  { path: '.agent/workflows/frontload.md', stage: 'defer' },
  { path: '.agent/context/resource-map.md', stage: 'defer' },
  { path: 'docs/protocols/AGENT_STATUS_LEDGER.md', stage: 'defer' },
  { path: 'docs/core/SOUL.md', stage: 'defer' },
  { path: 'docs/core/MEMORY.md', stage: 'defer' },
  { path: 'docs/core/BOOTSTRAP.md', stage: 'defer' },
  { path: 'data/mcp_config.json', stage: 'metadata' },
];
const MCP_CONFIG_PATHS = [
  'tools/config-files/mcp_config.json',
  'tools/config-files/enhanced_mcp_config.json',
  'packages/jules-skill/mcp-config.example.json',
];
const LEGACY_OPENCLAW_LATEST_MD = process.env.HOME
  ? path.join(process.env.HOME, '.openclaw', 'workspace', 'handoff', 'LATEST.md')
  : null;

function releaseGuardOnExit(guard) {
  let released = false;
  const release = () => {
    if (released || !guard || typeof guard.release !== 'function') return;
    released = true;
    guard.release();
  };

  process.once('exit', release);
  process.once('SIGINT', () => {
    release();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    release();
    process.exit(143);
  });
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readJson(relPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
  } catch {
    return null;
  }
}

function listFiles(relDir, matcher) {
  const out = [];

  function walk(absDir, relPrefix = '') {
    if (!fs.existsSync(absDir)) return;
    const entries = fs.readdirSync(absDir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = path.join(relPrefix, entry.name);
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, rel);
      } else if (!matcher || matcher(rel)) {
        out.push(rel);
      }
    }
  }

  walk(path.join(ROOT, relDir));
  return out.sort();
}

function printHeader(title) {
  console.log(`\n=== ${title} ===`);
}

function printMcpConfig(relPath) {
  const json = readJson(relPath);
  if (!json || !json.mcpServers) {
    console.log(`- ${relPath}: missing or invalid`);
    return;
  }

  const names = Object.keys(json.mcpServers);
  console.log(`- ${relPath}: ${names.length} servers`);
  for (const name of names) {
    const def = json.mcpServers[name] || {};
    const cmd = def.command || '<none>';
    const args = Array.isArray(def.args) ? def.args.join(' ') : '';
    console.log(`  - ${name}: ${cmd}${args ? ` ${args}` : ''}`);
  }
}

function countWords(relPath) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) return 0;
  const text = fs.readFileSync(absPath, 'utf8');
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

function parseScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  if ((value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function readYamlPolicy() {
  // Operator-authored micro-YAML reader. We support: top-level scalars,
  // nested maps, list-of-scalars and list-of-maps. Indentation is tracked per
  // line; sibling transitions are handled by rebalancing the indent stack.
  // Sufficient for any reasonable model-policy.yaml; not a full YAML 1.2 spec.
  const home = process.env.HOME;
  if (!home) return null;
  const candidates = [
    path.join(home, '.tnf', 'sub-director', 'model-policy.yaml'),
    path.join(home, '.tnf', 'sub-director', 'model-policy.yml'),
  ];
  let text = null;
  let chosenPath = null;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      chosenPath = candidate;
      text = fs.readFileSync(candidate, 'utf8');
      break;
    }
  }
  if (text === null) return null;

  // Tokenize: each non-blank, non-comment line records its indent + content.
  const tokens = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const m = raw.match(/^(\s*)/);
    tokens.push({ indent: m ? m[1].length : 0, content: raw.slice(m ? m[1].length : 0) });
  }

  // Recursive-descent YAML reader. `pos` advances; `minIndent` constrains how
  // far we can descend from the caller's reference point.
  function readBlock(minIndent) {
    if (pos >= tokens.length) return null;
    const localIndent = tokens[pos].indent;
    if (localIndent < minIndent) return null;
    const container = {};
    const arr = [];
    const seenList = false;

    while (pos < tokens.length) {
      const tok = tokens[pos];
      if (tok.indent < localIndent) break;
      if (tok.indent > localIndent) {
        // Shouldn't happen if we balanced correctly — skip defensively.
        pos += 1;
        continue;
      }
      const content = tok.content;
      if (content.startsWith('- ')) {
        // List item at this indent
        const head = content.slice(2);
        if (head.includes(':')) {
          const idx = head.indexOf(':');
          const k = head.slice(0, idx).trim();
          const v = head.slice(idx + 1).trim();
          const item = { [k]: v ? parseScalar(v) : null };
          // If the value is empty, the subsequent indented lines are its
          // children — call readBlock first.
          if (!v) {
            pos += 1;
            const childIndent = pos < tokens.length ? tokens[pos].indent : -1;
            if (childIndent > localIndent) {
              item[k] = readBlock(childIndent);
            }
          }
          arr.push(item);
        } else {
          arr.push(parseScalar(head));
        }
        pos += 1;
        continue;
      }
      if (content.includes(':')) {
        const idx = content.indexOf(':');
        const k = content.slice(0, idx).trim();
        const v = content.slice(idx + 1).trim();
        if (v) {
          container[k] = parseScalar(v);
          pos += 1;
        } else {
          // Key-only — children follow at greater indent
          pos += 1;
          const childIndent = pos < tokens.length ? tokens[pos].indent : -1;
          if (childIndent > localIndent) {
            container[k] = readBlock(childIndent);
          } else {
            container[k] = null;
          }
        }
        continue;
      }
      // Unknown — skip
      pos += 1;
    }
    // Decide: did we see any list items? If yes, return array. Otherwise map.
    if (arr.length && Object.keys(container).length === 0) return arr;
    if (arr.length) {
      // mixed: prefer array if any list items present
      return arr;
    }
    return container;
  }

  let pos = 0;
  const rootIndent = tokens.length ? tokens[0].indent : 0;
  // Reset all tokens' indent values relative to rootIndent so root is 0.
  for (const t of tokens) t.indent -= rootIndent;
  const parsed = readBlock(0);
  // Strip undefined entries
  function clean(o) {
    if (Array.isArray(o)) return o.map(clean).filter((x) => x !== undefined);
    if (o && typeof o === 'object') {
      const out = {};
      for (const k of Object.keys(o)) {
        const v = clean(o[k]);
        if (v !== undefined) out[k] = v;
      }
      return out;
    }
    return o;
  }
  const result = clean(parsed) || {};
  result._sourcePath = chosenPath;
  return result;
}

function extractParamCount(modelId) {
  // Recognises model IDs whose basename contains a parameter count suffix
  // like "-1.5b", "-8b", "-70b", "-120b". Returns the parsed count or null.
  // (See tnf-cli fleet evolution: handoff ad9830e6 for tier table.)
  if (!modelId || typeof modelId !== 'string') return null;
  const m = modelId.toLowerCase().match(/-(\d+(?:\.\d+)?)\s*b(?:[^a-z]|$)/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  return Number.isFinite(num) ? num * 1e9 : null;
}

function resolveAdaptiveBudget(preferredBudget) {
  // If the caller pinned --frontload-budget-words, respect it.
  if (Number.isFinite(preferredBudget) && preferredBudget !== DEFAULT_FRONTLOAD_BUDGET_WORDS) {
    return { budget: preferredBudget, provenance: { source: 'cli', detail: `--frontload-budget-words=${preferredBudget}` } };
  }
  const policy = readYamlPolicy();
  if (!policy) {
    return {
      budget: 1500,
      provenance: { source: 'cautious-default', detail: 'no model-policy.yaml — assume frontier context with reduced capability' },
    };
  }
  const preferred = (policy.models && (policy.models.preferred || policy.preferred)) || null;
  const local = (policy.models && policy.models.local) || null;
  const cloud = (policy.models && policy.models.cloud) || null;
  let resolvedModel = null;
  let resolvedSource = null;
  if (typeof preferred === 'string') {
    resolvedModel = preferred.split('/').pop();
    resolvedSource = 'preferred';
  } else if (typeof local === 'string') {
    resolvedModel = local.split('/').pop();
    resolvedSource = 'local';
  } else if (local && typeof local === 'object' && local.model) {
    resolvedModel = String(local.model).split('/').pop();
    resolvedSource = 'local';
  } else if (Array.isArray(cloud) && cloud.length) {
    const first = cloud[0];
    if (typeof first === 'string') {
      resolvedModel = first.split('/').pop();
    } else if (first && typeof first === 'object' && first.model) {
      resolvedModel = String(first.model);
    }
    resolvedSource = 'cloud[0]';
  }
  const params = extractParamCount(resolvedModel);
  let budget;
  let tier;
  if (params === null) {
    budget = Math.max(1500, DEFAULT_FRONTLOAD_BUDGET_WORDS);
    tier = 'unknown-size';
  } else if (params <= 3e9) {
    budget = 800; tier = 'tiny (<=3B)';
  } else if (params <= 1.2e10) {
    budget = 2000; tier = 'small (3B-12B)';
  } else if (params <= 7e10) {
    budget = 3500; tier = 'large (12B-70B)';
  } else {
    budget = 5000; tier = 'frontier (>70B)';
  }
  budget = Math.max(FRONTLOAD_BUDGET_FLOOR_WORDS, budget);
  return {
    budget,
    provenance: {
      source: 'adaptive-fleet',
      detail: `${resolvedSource || 'no-source'} → ${resolvedModel || 'unknown'} [${tier}, ${params ? Math.round(params / 1e9) + 'B' : '?'}]`,
    },
  };
}

async function probeFleet(policy) {
  if (!policy || !policy.models) {
    return { attempted: false, providers: [], preferred: null };
  }
  const cloud = policy.models.cloud;
  const preferred = policy.models.preferred || policy.preferred || null;
  const providers = [];
  if (Array.isArray(cloud)) {
    for (const entry of cloud) {
      let provider = null;
      let model = null;
      if (typeof entry === 'string') {
        const idx = entry.lastIndexOf('/');
        if (idx > 0) { provider = entry.slice(0, idx); model = entry.slice(idx + 1); }
      } else if (entry && typeof entry === 'object') {
        provider = entry.provider || null;
        model = entry.model || null;
      }
      if (!provider) continue;
      providers.push({ provider, model, status: 'unknown', latencyMs: null });
    }
  }
  // Cheap HEAD probe — prefer HTTPS HEAD against provider's base URL.
  // We DO NOT call /chat/completions here; just check TLS + reachability.
  const heads = await Promise.all(providers.slice(0, 8).map(async (p) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FLEET_PROBE_TIMEOUT_MS);
    const base = providerBaseUrl(p.provider);
    try {
      const start = Date.now();
      const res = await fetch(base, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timer);
      p.status = res.ok || res.status === 405 /* HEAD not allowed but reachable */ ? 'reachable' : `http-${res.status}`;
      p.latencyMs = Date.now() - start;
    } catch (error) {
      clearTimeout(timer);
      p.status = error && error.name === 'AbortError' ? 'timeout' : 'unreachable';
    }
    return p;
  }));
  const preferredStr = typeof preferred === 'string' ? preferred : null;
  return {
    attempted: true,
    providers: heads,
    preferred: preferredStr,
    preferredReachable: preferredStr ? heads.some(
      (h) => (h.provider + '/' + h.model).endsWith(preferredStr.replace(/^.*?\//, ''))
        || h.provider === preferredStr.split('/')[0]
    ) : null,
  };
}

function providerBaseUrl(provider) {
  // Minimal mapping; CLI failures here are SURFACED, not authoritatively
  // resolved — the federation does that. This is a no-auth reachability ping.
  const map = {
    nvidia: 'https://integrate.api.nvidia.com/',
    openrouter: 'https://openrouter.ai/',
    anthropic: 'https://api.anthropic.com/',
    openai: 'https://api.openai.com/',
    minimax: 'https://api.minimax.ai/',
    google: 'https://generativelanguage.googleapis.com/',
  };
  return map[provider] || `https://${provider}.`;
}

function printFrontloadBudget(budgetWords, provenance = {}) {
  const rows = FRONTLOAD_BUDGET_PROFILE.map((entry) => ({
    ...entry,
    present: exists(entry.path),
    words: countWords(entry.path),
  }));
  const totalWords = rows.reduce((sum, row) => sum + row.words, 0);
  const eagerWords = rows
    .filter((row) => row.stage === 'eager')
    .reduce((sum, row) => sum + row.words, 0);
  const deferredWords = rows
    .filter((row) => row.stage === 'defer')
    .reduce((sum, row) => sum + row.words, 0);
  const roughTokens = Math.ceil(totalWords * 1.33);

  if (provenance.source) {
    console.log(`- budget source: ${provenance.source}` + (provenance.detail ? ` (${provenance.detail})` : ''));
  }
  console.log(`- configured budget: ${budgetWords} words`);
  console.log(`- eager Turn Zero packet: ${eagerWords} words`);
  console.log(`- deferred reference context: ${deferredWords} words`);
  console.log(`- full frontload packet: ${totalWords} words (~${roughTokens} tokens)`);
  console.log(
    `- mode: ${totalWords > budgetWords ? 'staged-read recommended' : 'full-read within budget'}`
  );
  rows.forEach((row) => {
    const label =
      row.stage === 'eager'
        ? 'read'
        : row.stage === 'defer'
          ? 'defer-until-needed'
          : 'metadata';
    console.log(`  - ${label}: ${row.path} (${row.present ? row.words : 'missing'} words)`);
  });
}

function ensureTextFile(relPath, content) {
  const absPath = path.join(ROOT, relPath);
  if (fs.existsSync(absPath)) return false;
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, 'utf8');
  return true;
}

function objectContainsString(value, needle) {
  if (!needle) return false;
  if (typeof value === 'string') return value.includes(needle);
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => objectContainsString(item, needle));
  return Object.values(value).some((item) => objectContainsString(item, needle));
}

function upsertGeneratedJsonFile(relPath, payload) {
  const absPath = path.join(ROOT, relPath);
  const desired = `${JSON.stringify(payload, null, 2)}\n`;

  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, desired, 'utf8');
    return 'created';
  }

  const existing = readJson(relPath);
  const shouldRefreshGenerated =
    existing &&
    typeof existing === 'object' &&
    !Array.isArray(existing) &&
    (existing.generatedBy === ONBOARD_GENERATED_MARKER || objectContainsString(existing, ROOT));

  if (!shouldRefreshGenerated) {
    return 'preserved';
  }

  fs.writeFileSync(absPath, desired, 'utf8');
  return 'updated';
}

function frontloadSystemPromptTemplate() {
  return [
    '# The New Fuse - Agent System Prompt',
    '',
    'Local bootstrap context for terminal agents in this repository.',
    '',
    '## Authority',
    `1. ${CANONICAL_TURN_ZERO_MANDATE}`,
    '2. docs/protocols/LIVING_STATE.md',
    '3. docs/protocols/AGENT_STATUS_LEDGER.md',
    `4. ${CANONICAL_SESSION_HANDOFF_JSON}`,
    '',
    '## Non-Negotiable Startup',
    'Before planning or acting, execute Turn Zero from the repository root:',
    '',
    '```bash',
    `cat ./${CANONICAL_TURN_ZERO_MANDATE}`,
    'cat ./docs/protocols/LIVING_STATE.md',
    `cat ./${CANONICAL_SESSION_HANDOFF_JSON} 2>/dev/null || true`,
    '```',
    '',
    'Summarize active directive, handoff source, next actions, missing startup files, and verification path.',
    '',
    '## Legacy Compatibility',
    'Do not create or update `.agent/handoff_notes.txt`, `task_plan.md`, `findings.md`, or `progress.md` unless the operator explicitly requests legacy file-based planning.',
    '',
    '## Fleet Delegation (Cornerstone Tenet)',
    '',
    'Maximize available compute by delegating to other capable top-level agents, not only your own sub-agents.',
    'Discover targets: `tnf agents who --json` or the `tnf:agent-registry` Redis hash.',
    'Dispatch: `tnf send "<msg>" --to <agentId>`, `tnf handoff emit --owner <me> --targets <a,b> --next-actions "..."`, or LPUSH `tnf:master:tasks:realtime` with assignee/requiredCapabilities/fulfillmentHints.',
    'Wake sleeping agents: `scripts/start-agent-network.sh` or Terminal window prompt injection.',
    'Verify delivery via handoff ack or reply channel; never simulate a dispatch.',
    '',
    '## Raw Agent Prompt',
    '',
    '```text',
    'Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.',
    '```',
    '',
    '## Relay URL Precedence',
    '',
    'TNF_RELAY_URL -> RELAY_WS_URL -> RELAY_URL -> ws://127.0.0.1:3000/ws',
    '',
  ].join('\n');
}

function resourceMapTemplate() {
  return [
    '# TNF Resource Map',
    '',
    'Read `docs/protocols/TURN_ZERO_MANDATE.md` before using this map.',
    '',
    '## Canonical Protocols',
    `- ${CANONICAL_TURN_ZERO_MANDATE}`,
    `- ${CANONICAL_SESSION_HANDOFF_JSON}`,
    '- docs/protocols/LIVING_STATE.md',
    '- docs/protocols/AGENT_STATUS_LEDGER.md',
    '',
    '## Operator Guides',
    '- AGENTS.md',
    '- docs/TNF_SESSION_ONBOARDING.md',
    '- docs/PROTOCOL_ALIGNMENT_FRAMEWORK.md',
    '',
    '## Runtime State',
    '- .agent/runtime-state.json',
    '- .agent/runtime-state/',
    '- .agent/runtime-logs/',
    '',
    '## Legacy Compatibility',
    '- .agent/handoff_notes.txt is a fallback mirror only.',
    '- task_plan.md, findings.md, and progress.md are optional legacy planning files.',
    '',
    '## Raw Agent Prompt',
    '',
    '```text',
    'Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.',
    '```',
    '',
    '## MCP Configuration',
    '- data/mcp_config.json',
    '- tools/config-files/mcp_config.json',
    '- tools/config-files/enhanced_mcp_config.json',
    '',
    '## Relay URL Precedence',
    '- TNF_RELAY_URL',
    '- RELAY_WS_URL',
    '- RELAY_URL',
    '- ws://127.0.0.1:3000/ws',
    '',
  ].join('\n');
}

function onboardingTemplate() {
  return [
    '# TNF Agent Onboarding',
    '',
    'This guide is secondary to `docs/protocols/TURN_ZERO_MANDATE.md`.',
    '',
    '## Steps',
    '1. Run `./tnf onboard` or `node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000`.',
    '2. Read `docs/protocols/TURN_ZERO_MANDATE.md`.',
    '3. Read `docs/protocols/LIVING_STATE.md`.',
    '4. Read `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`.',
    '5. Validate frontload + MCP checklist output.',
    '6. Summarize orientation and await confirmation before code changes unless implementation was already requested.',
    '',
    '## Guardrails',
    '- Prefer structured state over screenshots.',
    '- Do not trust upstream output without verification.',
    '- Treat OpenClaw routes as optional TNF integration surfaces.',
    '- Do not create legacy planning files unless explicitly requested.',
    '',
    '## Raw Agent Prompt',
    '',
    '```text',
    'Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.',
    '```',
    '',
  ].join('\n');
}

function frontloadWorkflowTemplate() {
  return [
    '# /frontload - TNF Context Frontload',
    '',
    '## Inspect',
    '- Read `docs/protocols/TURN_ZERO_MANDATE.md`.',
    '- Read `docs/protocols/LIVING_STATE.md`.',
    '- Read `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`.',
    '- Run `./tnf onboard`.',
    '',
    '## Act',
    '- Execute scoped task work.',
    '- Keep edits minimal and verifiable.',
    '',
    '## Verify',
    '- Re-run `./tnf onboard` before handoff.',
    '- Confirm no missing frontload files.',
    '- Confirm MCP config inventory parses.',
    '',
    '## Legacy Compatibility',
    '- `.agent/handoff_notes.txt`, `task_plan.md`, `findings.md`, and `progress.md` are fallbacks only.',
    '- Do not create or update them unless explicitly requested.',
    '',
  ].join('\n');
}

function buildHandoffNotesTemplate() {
  const handoff = resolveCanonicalSessionHandoff();
  const sourcePath = handoff.path || 'missing';
  const handoffId = handoff.mode === 'json' ? handoff.payload.handoff_id || 'unknown' : 'unknown';
  const createdAt = handoff.mode === 'json' ? handoff.payload.created_at || 'unknown' : 'unknown';
  const nextActions =
    handoff.mode === 'json' && Array.isArray(handoff.payload?.next_actions)
      ? handoff.payload.next_actions
      : [];

  const lines = [
    '# TNF Handoff Notes (Legacy Mirror)',
    '',
    `Updated: ${new Date().toISOString()}`,
    `Canonical source: ${sourcePath}`,
    `Canonical handoff id: ${handoffId}`,
    `Canonical created_at: ${createdAt}`,
    '',
    'Next actions:',
  ];

  if (nextActions.length === 0) {
    lines.push('- (none listed)');
  } else {
    nextActions.forEach((action) => lines.push(`- ${action}`));
  }

  lines.push('', 'Notes:', '- Keep this file as a legacy fallback mirror only.');
  return lines.join('\n');
}

function buildMcpServers() {
  function tsxServer(entryPoint) {
    return {
      command: 'pnpm',
      args: ['exec', 'tsx', entryPoint],
    };
  }

  return {
    'tnf-complete-api-wrapper': tsxServer('src/mcp/complete-api-mcp-server.ts'),
    'tnf-enhanced-mcp-server': tsxServer('src/mcp/enhanced-tnf-mcp-server.ts'),
    'tnf-core-server': tsxServer('src/mcp/server.ts'),
    'tnf-network': tsxServer('apps/mcp-servers/tnf-network-mcp/src/index.ts'),
    'devops-bridge': tsxServer('apps/mcp-servers/devops-bridge/src/index.ts'),
    jules: tsxServer('packages/jules-skill/src/mcp-server.ts'),
  };
}

function baseMcpConfigTemplate() {
  const mcpServers = buildMcpServers();
  return {
    $schema:
      'https://raw.githubusercontent.com/modelcontextprotocol/specification/main/schema/server.schema.json',
    generatedBy: ONBOARD_GENERATED_MARKER,
    generatedAt: new Date().toISOString(),
    mcpServers,
    servers: {
      'tnf-api-gateway': {
        type: 'api',
        enabled: true,
        protocol: 'http',
        host: '127.0.0.1',
        port: 3005,
      },
      'tnf-backend': {
        type: 'api',
        enabled: true,
        protocol: 'http',
        host: '127.0.0.1',
        port: 3004,
      },
    },
  };
}

function enhancedMcpConfigTemplate() {
  const mcpServers = buildMcpServers();
  return {
    $schema:
      'https://raw.githubusercontent.com/modelcontextprotocol/specification/main/schema/server.schema.json',
    generatedBy: ONBOARD_GENERATED_MARKER,
    generatedAt: new Date().toISOString(),
    profile: 'enhanced',
    mcpServers,
  };
}

function repairOnboardingAssets() {
  const changes = [];

  if (ensureTextFile('.agent/SYSTEM_PROMPT.md', frontloadSystemPromptTemplate())) {
    changes.push({ path: '.agent/SYSTEM_PROMPT.md', status: 'created' });
  }
  if (ensureTextFile('.agent/context/resource-map.md', resourceMapTemplate())) {
    changes.push({ path: '.agent/context/resource-map.md', status: 'created' });
  }
  if (ensureTextFile('.agent/context/agent-onboarding.md', onboardingTemplate())) {
    changes.push({ path: '.agent/context/agent-onboarding.md', status: 'created' });
  }
  if (ensureTextFile('.agent/workflows/frontload.md', frontloadWorkflowTemplate())) {
    changes.push({ path: '.agent/workflows/frontload.md', status: 'created' });
  }
  // Core harness pack — only create stubs if a checkout is missing them.
  // Prefer the committed docs/core templates; do not overwrite curated MEMORY.
  const corePointers = [
    [
      'docs/core/FRONTLOAD_MANIFEST.md',
      '# FRONTLOAD_MANIFEST.md\n\nRun `tnf onboard --repair` from a full checkout so this manifest is restored.\n',
    ],
    [
      'docs/core/MEMORY.md',
      '# MEMORY.md\n\nCurated long-term facts. Restore from repo template if this stub remains.\n',
    ],
    [
      'docs/core/BOOTSTRAP.md',
      '# BOOTSTRAP.md\n\n`[BOOTSTRAP_STATUS:PENDING]`\n\nComplete the ritual in the repo template, then stamp COMPLETE.\n',
    ],
  ];
  for (const [rel, body] of corePointers) {
    if (ensureTextFile(rel, body)) {
      changes.push({ path: rel, status: 'created' });
    }
  }
  const baseMcp = baseMcpConfigTemplate();
  const mcpConfigStatus = upsertGeneratedJsonFile('data/mcp_config.json', baseMcp);
  if (mcpConfigStatus !== 'preserved') {
    changes.push({ path: 'data/mcp_config.json', status: mcpConfigStatus });
  }
  const toolsConfigStatus = upsertGeneratedJsonFile('tools/config-files/mcp_config.json', baseMcp);
  if (toolsConfigStatus !== 'preserved') {
    changes.push({ path: 'tools/config-files/mcp_config.json', status: toolsConfigStatus });
  }
  const enhancedConfigStatus = upsertGeneratedJsonFile(
    'tools/config-files/enhanced_mcp_config.json',
    enhancedMcpConfigTemplate()
  );
  if (enhancedConfigStatus !== 'preserved') {
    changes.push({ path: 'tools/config-files/enhanced_mcp_config.json', status: enhancedConfigStatus });
  }

  return changes;
}

function withTimeout(promise, timeoutMs, errorMessage) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function resolveCanonicalSessionHandoff() {
  if (exists(CANONICAL_SESSION_HANDOFF_JSON)) {
    const parsed = readJson(CANONICAL_SESSION_HANDOFF_JSON);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        mode: 'json',
        path: CANONICAL_SESSION_HANDOFF_JSON,
        payload: parsed,
      };
    }
    return {
      mode: 'json-invalid',
      path: CANONICAL_SESSION_HANDOFF_JSON,
    };
  }

  if (exists(CANONICAL_SESSION_HANDOFF_MD)) {
    return {
      mode: 'markdown',
      path: CANONICAL_SESSION_HANDOFF_MD,
    };
  }

  if (exists('.agent/handoff_notes.txt')) {
    return {
      mode: 'legacy',
      path: '.agent/handoff_notes.txt',
    };
  }

  return { mode: 'missing' };
}

function inspectLegacyOpenClawLatestPointer() {
  if (!LEGACY_OPENCLAW_LATEST_MD) {
    return { status: 'unavailable' };
  }
  if (!fs.existsSync(LEGACY_OPENCLAW_LATEST_MD)) {
    return { status: 'missing', path: LEGACY_OPENCLAW_LATEST_MD };
  }

  try {
    const stat = fs.lstatSync(LEGACY_OPENCLAW_LATEST_MD);
    if (!stat.isSymbolicLink()) {
      return { status: 'present', path: LEGACY_OPENCLAW_LATEST_MD };
    }
    const target = fs.readlinkSync(LEGACY_OPENCLAW_LATEST_MD);
    const absTarget = path.resolve(path.dirname(LEGACY_OPENCLAW_LATEST_MD), target);
    if (!fs.existsSync(absTarget)) {
      return {
        status: 'broken',
        path: LEGACY_OPENCLAW_LATEST_MD,
        target,
      };
    }
    return { status: 'present', path: LEGACY_OPENCLAW_LATEST_MD, target };
  } catch (error) {
    return {
      status: 'error',
      path: LEGACY_OPENCLAW_LATEST_MD,
      error: error?.message || 'unknown error',
    };
  }
}

function isLocalDatabaseUrl(url) {
  if (!url) return true;
  const lower = String(url).toLowerCase();
  return (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('::1') ||
    lower.startsWith('sqlite:')
  );
}

function printUsage() {
  console.log('Usage: node scripts/tnf-onboard.cjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  -h, --help                Show this help');
  console.log('      --repair              Scaffold missing onboarding files/configs');
  console.log('      --allow-local-db      Set TNF_ALLOW_LOCAL_DB=1 for this run');
  console.log('      --require-cloud-db    Set TNF_REQUIRE_CLOUD_DB=1 for this run');
  console.log('      --no-require-cloud-db Set TNF_REQUIRE_CLOUD_DB=0 for this run');
  console.log('      --database-url <url>  Override DATABASE_URL for this run');
  console.log(`      --frontload-budget-words <n>  Word budget for staged frontload report (default: ${DEFAULT_FRONTLOAD_BUDGET_WORDS})`);
  console.log(`      --runtime-timeout-ms  Runtime snapshot timeout (default: ${DEFAULT_RUNTIME_SNAPSHOT_TIMEOUT_MS})`);
}

function parseArgs(argv) {
  const envOverrides = {};
  let repair = false;
  let runtimeTimeoutMs = DEFAULT_RUNTIME_SNAPSHOT_TIMEOUT_MS;
  let frontloadBudgetWords = DEFAULT_FRONTLOAD_BUDGET_WORDS;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--') {
      continue;
    }

    if (arg === '-h' || arg === '--help') {
      return { help: true, envOverrides, repair, runtimeTimeoutMs, frontloadBudgetWords };
    }

    if (arg === '--repair') {
      repair = true;
      continue;
    }

    if (arg === '--allow-local-db') {
      envOverrides.TNF_ALLOW_LOCAL_DB = '1';
      continue;
    }

    if (arg === '--require-cloud-db') {
      envOverrides.TNF_REQUIRE_CLOUD_DB = '1';
      continue;
    }

    if (arg === '--no-require-cloud-db') {
      envOverrides.TNF_REQUIRE_CLOUD_DB = '0';
      continue;
    }

    if (arg === '--database-url') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('Missing value for --database-url');
      }
      envOverrides.DATABASE_URL = next;
      i += 1;
      continue;
    }

    if (arg.startsWith('--database-url=')) {
      envOverrides.DATABASE_URL = arg.slice('--database-url='.length);
      continue;
    }

    if (arg === '--runtime-timeout-ms') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('Missing value for --runtime-timeout-ms');
      }
      const parsedValue = Number.parseInt(next, 10);
      if (!Number.isFinite(parsedValue) || parsedValue < 500 || parsedValue > 60000) {
        throw new Error('--runtime-timeout-ms must be an integer between 500 and 60000');
      }
      runtimeTimeoutMs = parsedValue;
      i += 1;
      continue;
    }

    if (arg.startsWith('--runtime-timeout-ms=')) {
      const parsedValue = Number.parseInt(arg.slice('--runtime-timeout-ms='.length), 10);
      if (!Number.isFinite(parsedValue) || parsedValue < 500 || parsedValue > 60000) {
        throw new Error('--runtime-timeout-ms must be an integer between 500 and 60000');
      }
      runtimeTimeoutMs = parsedValue;
      continue;
    }

    if (arg === '--frontload-budget-words') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('Missing value for --frontload-budget-words');
      }
      const parsedValue = Number.parseInt(next, 10);
      if (!Number.isFinite(parsedValue) || parsedValue < 500 || parsedValue > 50000) {
        throw new Error('--frontload-budget-words must be an integer between 500 and 50000');
      }
      frontloadBudgetWords = parsedValue;
      i += 1;
      continue;
    }

    if (arg.startsWith('--frontload-budget-words=')) {
      const parsedValue = Number.parseInt(arg.slice('--frontload-budget-words='.length), 10);
      if (!Number.isFinite(parsedValue) || parsedValue < 500 || parsedValue > 50000) {
        throw new Error('--frontload-budget-words must be an integer between 500 and 50000');
      }
      frontloadBudgetWords = parsedValue;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return { help: false, envOverrides, repair, runtimeTimeoutMs, frontloadBudgetWords };
}

function resolveDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const allowLocal = process.env.TNF_ALLOW_LOCAL_DB === '1';
  const cloudRequired = process.env.TNF_REQUIRE_CLOUD_DB !== '0';

  if (!databaseUrl) {
    return {
      ok: false,
      reason: 'DATABASE_URL is not set',
      databaseUrl: '',
      cloudRequired,
    };
  }

  if (cloudRequired && !allowLocal && isLocalDatabaseUrl(databaseUrl)) {
    return {
      ok: false,
      reason: 'DATABASE_URL points to local DB but cloud-rooted mode is required',
      databaseUrl,
      cloudRequired,
    };
  }

  return { ok: true, databaseUrl, cloudRequired };
}

async function writeRuntimeStateSnapshot(timeoutMs = DEFAULT_RUNTIME_SNAPSHOT_TIMEOUT_MS) {
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(ROOT, '.env.local') });
    dotenv.config({ path: path.join(ROOT, '.env') });
  } catch {
    // Optional at install time. If missing, rely on existing environment variables.
  }

  const dbConfig = resolveDatabaseConfig();
  if (!dbConfig.ok) {
    console.log(`- .agent/runtime-state.json: skipped (${dbConfig.reason})`);
    if (dbConfig.cloudRequired) {
      console.log('- Hint: set cloud DATABASE_URL or override with TNF_ALLOW_LOCAL_DB=1');
    }
    return;
  }

  const databaseUrl = dbConfig.databaseUrl;
  let postgres;
  try {
    postgres = require('postgres');
  } catch (error) {
    console.log(
      `- .agent/runtime-state.json: skipped (postgres module unavailable: ${error?.message || 'unknown error'})`
    );
    return;
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 3,
    idle_timeout: 5,
    max_lifetime: 10,
  });

  try {
    // Execute sequentially on one connection to avoid queue deadlocks seen with
    // Promise.all + max:1 against managed poolers (for example Supabase).
    const [agents, llmModels, harnesses, mcpServers, sessions] = await withTimeout(
      (async () => {
        const agents = await sql`
          SELECT tnf_id, name, agent_type, is_system, access_level, version, updated_at
          FROM tnf_agent_definitions
          ORDER BY is_system DESC, name ASC
        `;
        const llmModels = await sql`
          SELECT tnf_id, name, provider, model_id, version, is_current
          FROM tnf_llm_models
          ORDER BY provider ASC, name ASC
        `;
        const harnesses = await sql`
          SELECT tnf_id, name, platform, instance, environment, status, ws_url, endpoint_url
          FROM tnf_harnesses
          ORDER BY name ASC
        `;
        const mcpServers = await sql`
          SELECT tnf_id, name, protocol, scope, status, command
          FROM tnf_mcp_servers
          ORDER BY name ASC
        `;
        const sessions = await sql`
          SELECT tnf_id, status, started_at, last_heartbeat
          FROM tnf_agent_sessions
          ORDER BY started_at DESC
        `;
        return [agents, llmModels, harnesses, mcpServers, sessions];
      })(),
      timeoutMs,
      `timed out after ${timeoutMs}ms`
    );

    const snapshot = {
      source: 'tnf_v2',
      generatedAt: new Date().toISOString(),
      workspace: ROOT,
      counts: {
        agents: agents.length,
        llmModels: llmModels.length,
        harnesses: harnesses.length,
        mcpServers: mcpServers.length,
        sessions: sessions.length,
      },
      agents,
      llmModels,
      harnesses,
      mcpServers,
      sessions,
    };

    const outPath = path.join(ROOT, '.agent', 'runtime-state.json');
    fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

    console.log(
      `- .agent/runtime-state.json: written (${agents.length} agents, ${llmModels.length} models, ${mcpServers.length} MCPs)`
    );
  } catch (error) {
    console.log(
      `- .agent/runtime-state.json: skipped (DB unavailable: ${error?.message || 'unknown error'})`
    );
  } finally {
    try {
      await withTimeout(sql.end({ timeout: 0 }), 1500, 'sql.end timeout');
    } catch {
      // If the connection cannot close cleanly, continue shutdown.
    }
  }
}

function ensureVoiceKwsAlwaysOnFromOnboard() {
  if (String(process.env.VOICE_KWS_ALWAYS_ON || '1').trim() === '0') {
    console.log('- Voice/KWS always-on: skipped (VOICE_KWS_ALWAYS_ON=0)');
    return;
  }
  const bootScript = path.join(ROOT, 'scripts/system/tnf-voice-kws-boot.sh');
  if (!fs.existsSync(bootScript)) {
    console.log(`- Voice/KWS always-on: missing ${bootScript}`);
    return;
  }
  try {
    const { spawnSync } = require('node:child_process');
    const result = spawnSync('bash', [bootScript], {
      cwd: ROOT,
      env: {
        ...process.env,
        VOICE_KWS_ALWAYS_ON: process.env.VOICE_KWS_ALWAYS_ON || '1',
        VOICE_RESPONSE_AUDIO_DEFAULT_ON: process.env.VOICE_RESPONSE_AUDIO_DEFAULT_ON || '0',
        MINI_OMNI_ENABLED: process.env.MINI_OMNI_ENABLED || 'false',
        REQUIRE_INGEST_AUTH: process.env.REQUIRE_INGEST_AUTH || 'false',
      },
      encoding: 'utf8',
      timeout: 45000,
    });
    if (result.status === 0) {
      console.log('- Voice beam + KWS: ensured (always-on for onboarded TNF software)');
    } else {
      const detail = (result.stderr || result.stdout || '').toString().trim().slice(0, 240);
      console.log(`- Voice/KWS ensure warning (non-fatal): exit ${result.status}${detail ? ` — ${detail}` : ''}`);
    }
  } catch (error) {
    console.log(`- Voice/KWS ensure warning (non-fatal): ${error?.message || 'unknown error'}`);
  }
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    printUsage();
    process.exit(2);
  }

  if (parsed.help) {
    printUsage();
    process.exit(0);
  }

  const onboardGuard = singleInstanceGuard({
    lockName: 'tnf-onboard',
    staleMs: 2 * 60 * 1000,
  });
  if (!onboardGuard.acquired) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: 'already-running',
          reason: 'already-running',
          lock: onboardGuard.existingLock,
        },
        null,
        2
      )
    );
    return;
  }
  releaseGuardOnExit(onboardGuard);

  Object.assign(process.env, parsed.envOverrides);

  if (!exists('.agent')) {
    console.error('This command must run from TNF repo root (missing .agent/).');
    process.exit(1);
  }

  console.log('TNF Session Bootstrap');
  console.log('Workspace: current TNF project root');

  if (parsed.repair) {
    printHeader('Auto Repair');
    const repaired = repairOnboardingAssets();
    if (repaired.length === 0) {
      console.log('- no changes (baseline onboarding artifacts already present)');
    } else {
      repaired.forEach((change) => console.log(`- ${change.status}: ${change.path}`));
    }
  }

  printHeader('Frontload Checklist');
  FRONTLOAD_CHECKLIST.forEach((p) => console.log(`- ${p}: ${exists(p) ? 'present' : 'missing'}`));

  printHeader('Frontload Token Budget');
  const { budget: resolvedBudget, provenance: budgetProvenance } = resolveAdaptiveBudget(parsed.frontloadBudgetWords);
  printFrontloadBudget(resolvedBudget, budgetProvenance);
  printHeader('Live Fleet Probe');
  const fleetPolicy = readYamlPolicy();
  if (!fleetPolicy) {
    console.log('- skipped (no model-policy.yaml; fleet cannot be probed)');
    console.log('  Hint: write ~/.tnf/sub-director/model-policy.yaml to enable reachable probing');
  } else {
    const probe = await probeFleet(fleetPolicy);
    if (!probe.attempted) {
      console.log('- skipped (policy file has no models.cloud list)');
    } else {
      probe.providers.forEach((p) => {
        const latency = p.latencyMs === null ? '' : ` (${p.latencyMs}ms)`;
        console.log(`- ${p.provider}/${p.model || '?'} → ${p.status}${latency}`);
      });
      if (probe.preferred) {
        console.log(`- preferred: ${probe.preferred}`);
        if (probe.preferredReachable === false) {
          console.log('  WARN: preferred model is unreachable on the live fleet');
          console.log('  Hint: pick a different model in model-policy.yaml:models.preferred or restart operator cycle');
        }
      }
    }
  }

  printHeader('Turn Zero Authority & Central Tenets');
  console.log(`- canonical source: ${CANONICAL_TURN_ZERO_MANDATE}`);
  console.log('- external mirrors (for example ~/GEMINI.md) are non-authoritative');
  console.log('- Core Tenet 1 (Fleet Delegation): Maximize compute by delegating to specialized fleet peers (tnf agents who / tnf send).');
  console.log('- Core Tenet 2 (Assimilation): Parody & assimilate best patterns from external agents into native TNF skills.');
  console.log('- Core Tenet 3 (Attribution Cornerstone): Human & scientific source attribution overrules AI distillation.');
  console.log('- Core Tenet 4 (Operating Loop): Inspect -> Act -> Verify. Never assume action succeeded without empirical proof.');
  console.log('- Core Tenet 5 (Anti-Lobotomy): Never delete or prune .agent/, .gemini/, .claude/, .tnf/ state trees.');

  printHeader('Fleet Delegation & Peer Target Discovery');
  try {
    const regSnapshotPath = path.join(process.env.HOME || '', '.tnf', 'agent-registry-snapshot.json');
    if (fs.existsSync(regSnapshotPath)) {
      const snapshot = JSON.parse(fs.readFileSync(regSnapshotPath, 'utf8'));
      const activeCount = Array.isArray(snapshot) ? snapshot.length : Object.keys(snapshot || {}).length;
      console.log(`- registered fleet targets: ${activeCount} agents`);
    } else {
      console.log('- registered fleet targets: active (discover via: tnf agents who --json)');
    }
    console.log('- dispatch routes: tnf send "<msg>" --to <agentId> | tnf handoff emit | Redis LPUSH tnf:master:tasks:realtime');
    console.log('- available channels: Slack (tnf slack), WhatsApp (tnf whatsapp), Telegram (tnf telegram), Relay (ws://127.0.0.1:3000/ws)');
  } catch {
    console.log('- fleet dispatch ready: discover targets via tnf agents who');
  }

  printHeader('Canonical Session Handoff');
  const handoff = resolveCanonicalSessionHandoff();
  if (handoff.mode === 'json') {
    console.log(`- source: ${handoff.path}`);
    console.log(`- handoff_id: ${handoff.payload.handoff_id || 'unknown'}`);
    console.log(`- created_at: ${handoff.payload.created_at || 'unknown'}`);
    console.log(`- priority: ${handoff.payload?.continuation?.priority || 'unknown'}`);
    const nextActions = Array.isArray(handoff.payload?.next_actions)
      ? handoff.payload.next_actions.length
      : 0;
    console.log(`- next_actions: ${nextActions}`);
  } else if (handoff.mode === 'json-invalid') {
    console.log(`- source: ${handoff.path}`);
    console.log('- WARN canonical handoff JSON is invalid');
  } else if (handoff.mode === 'markdown') {
    console.log(`- source: ${handoff.path}`);
    console.log('- WARN canonical handoff JSON missing; markdown fallback active');
  } else if (handoff.mode === 'legacy') {
    console.log(`- source: ${handoff.path}`);
    console.log('- WARN canonical handoff report missing; legacy fallback active');
  } else {
    console.log('- source: missing');
    console.log('- WARN no handoff source discovered');
  }

  try {
    const { syncFromRepo } = require('./lib/sync-handoff-cache.cjs');
    const syncResult = syncFromRepo(ROOT);
    if (syncResult.ok) {
      console.log(`- home cache: ${syncResult.cachePath} (${syncResult.handoff_id})`);
    } else {
      console.log(`- WARN home cache sync skipped: ${syncResult.reason}`);
    }
  } catch (error) {
    console.log(`- WARN home cache sync failed: ${error?.message || error}`);
  }

  const legacyLatest = inspectLegacyOpenClawLatestPointer();
  if (legacyLatest.status === 'broken') {
    console.log(
      `- WARN legacy LATEST.md pointer broken: ${legacyLatest.path} -> ${legacyLatest.target}`
    );
  } else if (legacyLatest.status === 'missing') {
    console.log(`- WARN legacy LATEST.md missing: ${legacyLatest.path}`);
  } else if (legacyLatest.status === 'error') {
    console.log(`- WARN legacy LATEST.md inspection failed: ${legacyLatest.error}`);
  }

  printHeader('Specialized Agent Files');
  const tnfAgents = listFiles('.agent/agents', (f) => f.endsWith('.md'));
  const claudeAgents = listFiles('.claude/agents', (f) => f.endsWith('.md'));
  console.log(`- .agent/agents: ${tnfAgents.length}`);
  console.log(`- .claude/agents: ${claudeAgents.length}`);
  console.log(
    `- .claude/commands: ${listFiles('.claude/commands', (f) => f.endsWith('.md')).length}`
  );
  console.log(`- .gemini files: ${listFiles('.gemini', () => true).length}`);

  printHeader('Skills');
  const tnfSkills = listFiles('.agent/skills', (f) => path.basename(f) === 'SKILL.md');
  const claudeSkills = listFiles('.claude/skills', (f) => f.endsWith('.md'));
  console.log(`- .agent/skills SKILL.md count: ${tnfSkills.length}`);
  console.log(`- .claude/skills count: ${claudeSkills.length}`);
  console.log('- Sample TNF skills:');
  tnfSkills.slice(0, 15).forEach((p) => console.log(`  - ${path.dirname(p)}`));

  printHeader('MCP Config Inventory');
  MCP_CONFIG_PATHS.forEach(printMcpConfig);

  printHeader('MCP Server Code Paths');
  [
    'src/mcp/server.ts',
    'src/mcp/enhanced-tnf-mcp-server.ts',
    'src/mcp/complete-api-mcp-server.ts',
    'tools/relay-mcp-server/index.js',
    'apps/backend/src/modules/mcp/mcp-server.service.ts',
    'apps/mcp-servers/tnf-network-mcp/src/index.ts',
    'apps/mcp-servers/devops-bridge/src/index.ts',
  ].forEach((p) => console.log(`- ${p}: ${exists(p) ? 'present' : 'missing'}`));

  printHeader('Runtime Snapshot');
  await writeRuntimeStateSnapshot(parsed.runtimeTimeoutMs);

  printHeader('OpenClaw / Claw Operator Policy');
  console.log('- TNF is the primary control plane');
  console.log('- OpenClaw is an optional integration surface routed through TNF');
  console.log('- Prefer native TNF commands and implicit TNF-compatible routes first');
  console.log('- Use: tnf openclaw ... or tnf claw ... when TNF has not yet assimilated a native route');
  console.log('- Avoid raw openclaw ... unless debugging the TNF<->OpenClaw adapter or explicitly requested');
  console.log('- Audit current compatibility with: tnf compat openclaw');

  printHeader('How To Start New Sessions');
  console.log('- Run: ./tnf onboard');
  console.log('- Repair mode: ./tnf onboard --repair');
  console.log('- Alt: pnpm run tnf -- onboard');
  console.log('- Read: AGENTS.md');
  console.log('- Optional shell auto-bootstrap: docs/TNF_SESSION_ONBOARDING.md');
  console.log('- Voice beam + KWS start by default on onboard / boot / tui (VOICE_KWS_ALWAYS_ON=1)');

  printHeader('Voice Beam + KWS Always-On');
  ensureVoiceKwsAlwaysOnFromOnboard();

  printHeader('Core Federated Fleet (Local Sub-Director default)');
  if (process.env.TNF_SKIP_CORE_FLEET === '1' || process.env.TNF_SKIP_CORE_FLEET === 'true') {
    console.log('- skipped (TNF_SKIP_CORE_FLEET=1)');
  } else {
    const establishScript = path.join(ROOT, 'scripts/runtime/establish-core-federated-fleet.cjs');
    if (!fs.existsSync(establishScript)) {
      console.log(`- missing: ${establishScript}`);
    } else {
      const { spawnSync } = require('node:child_process');
      const result = spawnSync(process.execPath, [establishScript], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'inherit',
        env: process.env,
      });
      if (result.status === 0) {
        console.log('- established: Local Sub-Director identity + core OSS fleet');
        console.log('- receipt: ~/.tnf/core-fleet-latest.json');
      } else {
        console.log(`- WARN: establish exited ${result.status}; install remains usable`);
        console.log('- retry: node scripts/runtime/establish-core-federated-fleet.cjs');
      }
    }
  }

  printHeader('Prompt For Raw AI CLI Sessions');
  console.log(
    'Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.'
  );
  console.log('- Launch raw AI CLIs from the TNF repository root so ./docs/... resolves.');
}

// Boot-output triage (operator directive 2026-07-22): collect everything the
// bootstrap prints, then agentically classify error-shaped lines — stale
// expectations from past edge cases are demoted to knowledge-only, transient
// infra is reported without escalation, and only real errors are surfaced
// (with an agentic remediation hook). See scripts/lib/tnf-boot-triage.cjs.
const { runBootTriage, createBootOutputCollector } = require('./lib/tnf-boot-triage.cjs');

const bootCollector = createBootOutputCollector();
main()
  .then(() => {
    bootCollector.restore();
    runBootTriage(bootCollector.lines);
  })
  .catch((error) => {
    bootCollector.restore();
    console.error(`Bootstrap failed: ${error?.message || 'unknown error'}`);
    try {
      runBootTriage(bootCollector.lines);
    } catch {
      // Triage must never mask the original failure.
    }
    process.exit(1);
  });
