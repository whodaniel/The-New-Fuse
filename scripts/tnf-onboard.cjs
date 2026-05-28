#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { singleInstanceGuard } = require('./lib/tnf-single-instance-guard.cjs');

const ROOT = process.cwd();
const ONBOARD_GENERATED_MARKER = 'tnf-onboard --repair';
const CANONICAL_SESSION_HANDOFF_JSON = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
const CANONICAL_SESSION_HANDOFF_MD = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md';
const CANONICAL_TURN_ZERO_MANDATE = 'docs/protocols/TURN_ZERO_MANDATE.md';
const DEFAULT_RUNTIME_SNAPSHOT_TIMEOUT_MS = 8000;
const FRONTLOAD_CHECKLIST = [
  '.agent/SYSTEM_PROMPT.md',
  '.agent/context/resource-map.md',
  '.agent/context/agent-onboarding.md',
  '.agent/workflows/frontload.md',
  '.agent/handoff_notes.txt',
  'data/mcp_config.json',
  CANONICAL_TURN_ZERO_MANDATE,
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
    '# TNF Session System Prompt',
    '',
    'Local bootstrap context for terminal agents in this repository.',
    '',
    '## Authority',
    `1. ${CANONICAL_TURN_ZERO_MANDATE}`,
    `2. ${CANONICAL_SESSION_HANDOFF_JSON}`,
    '3. AGENTS.md',
    '',
    '## Operating Loop',
    '- Inspect current state first.',
    '- Act with minimal side effects.',
    '- Verify outcomes before handoff.',
    '',
    '## Session Start Checklist',
    '- Run: ./tnf onboard --repair',
    '- Confirm frontload files are present.',
    '- Confirm MCP config inventory is valid.',
    '',
  ].join('\n');
}

function resourceMapTemplate() {
  return [
    '# TNF Resource Map',
    '',
    '## Canonical Protocols',
    '- docs/protocols/TURN_ZERO_MANDATE.md',
    '- docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
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
    '## MCP Configuration',
    '- data/mcp_config.json',
    '- tools/config-files/mcp_config.json',
    '- tools/config-files/enhanced_mcp_config.json',
    '',
  ].join('\n');
}

function onboardingTemplate() {
  return [
    '# Agent Onboarding',
    '',
    '## Steps',
    '1. Run `./tnf onboard --repair`.',
    '2. Read `docs/protocols/TURN_ZERO_MANDATE.md`.',
    '3. Read `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`.',
    '4. Validate frontload + MCP checklist output.',
    '5. Continue with requested task and keep handoff continuity.',
    '',
    '## Guardrails',
    '- Prefer structured state over screenshots.',
    '- Do not trust upstream output without verification.',
    '- Treat OpenClaw routes as optional TNF integration surfaces.',
    '',
  ].join('\n');
}

function frontloadWorkflowTemplate() {
  return [
    '# Frontload Workflow',
    '',
    '## Inspect',
    '- Run `./tnf onboard --repair`.',
    '- Validate canonical handoff source and next actions.',
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
  if (ensureTextFile('.agent/handoff_notes.txt', buildHandoffNotesTemplate())) {
    changes.push({ path: '.agent/handoff_notes.txt', status: 'created' });
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
  console.log(`      --runtime-timeout-ms  Runtime snapshot timeout (default: ${DEFAULT_RUNTIME_SNAPSHOT_TIMEOUT_MS})`);
}

function parseArgs(argv) {
  const envOverrides = {};
  let repair = false;
  let runtimeTimeoutMs = DEFAULT_RUNTIME_SNAPSHOT_TIMEOUT_MS;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--') {
      continue;
    }

    if (arg === '-h' || arg === '--help') {
      return { help: true, envOverrides, repair, runtimeTimeoutMs };
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

    throw new Error(`Unknown option: ${arg}`);
  }

  return { help: false, envOverrides, repair, runtimeTimeoutMs };
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

  printHeader('Turn Zero Authority');
  console.log(`- canonical source: ${CANONICAL_TURN_ZERO_MANDATE}`);
  console.log('- external mirrors (for example ~/GEMINI.md) are non-authoritative');

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
}

main().catch((error) => {
  console.error(`Bootstrap failed: ${error?.message || 'unknown error'}`);
  process.exit(1);
});
