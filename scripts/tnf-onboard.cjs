#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const postgres = require('postgres');

const ROOT = process.cwd();

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
  console.log('      --allow-local-db      Set TNF_ALLOW_LOCAL_DB=1 for this run');
  console.log('      --require-cloud-db    Set TNF_REQUIRE_CLOUD_DB=1 for this run');
  console.log('      --no-require-cloud-db Set TNF_REQUIRE_CLOUD_DB=0 for this run');
  console.log('      --database-url <url>  Override DATABASE_URL for this run');
}

function parseArgs(argv) {
  const envOverrides = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--') {
      continue;
    }

    if (arg === '-h' || arg === '--help') {
      return { help: true, envOverrides };
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

    throw new Error(`Unknown option: ${arg}`);
  }

  return { help: false, envOverrides };
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

async function writeRuntimeStateSnapshot() {
  dotenv.config({ path: path.join(ROOT, '.env.local') });
  dotenv.config({ path: path.join(ROOT, '.env') });

  const dbConfig = resolveDatabaseConfig();
  if (!dbConfig.ok) {
    console.log(`- .agent/runtime-state.json: skipped (${dbConfig.reason})`);
    if (dbConfig.cloudRequired) {
      console.log('- Hint: set cloud DATABASE_URL or override with TNF_ALLOW_LOCAL_DB=1');
    }
    return;
  }

  const databaseUrl = dbConfig.databaseUrl;
  const sql = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 3,
    idle_timeout: 5,
  });

  try {
    const [agents, llmModels, harnesses, mcpServers, sessions] = await Promise.all([
      sql`
        SELECT tnf_id, name, agent_type, is_system, access_level, version, updated_at
        FROM tnf_agent_definitions
        ORDER BY is_system DESC, name ASC
      `,
      sql`
        SELECT tnf_id, name, provider, model_id, version, is_current
        FROM tnf_llm_models
        ORDER BY provider ASC, name ASC
      `,
      sql`
        SELECT tnf_id, name, platform, instance, environment, status, ws_url, endpoint_url
        FROM tnf_harnesses
        ORDER BY name ASC
      `,
      sql`
        SELECT tnf_id, name, protocol, scope, status, command
        FROM tnf_mcp_servers
        ORDER BY name ASC
      `,
      sql`
        SELECT tnf_id, status, started_at, last_heartbeat
        FROM tnf_agent_sessions
        ORDER BY started_at DESC
      `,
    ]);

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
    await sql.end({ timeout: 1 });
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

  Object.assign(process.env, parsed.envOverrides);

  if (!exists('.agent')) {
    console.error('This command must run from TNF repo root (missing .agent/).');
    process.exit(1);
  }

  console.log('TNF Session Bootstrap');
  console.log('Workspace: /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse');

  printHeader('Frontload Checklist');
  [
    '.agent/SYSTEM_PROMPT.md',
    '.agent/context/resource-map.md',
    '.agent/context/agent-onboarding.md',
    '.agent/workflows/frontload.md',
    '.agent/handoff_notes.txt',
  ].forEach((p) => console.log(`- ${p}: ${exists(p) ? 'present' : 'missing'}`));

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
  [
    'tools/config-files/mcp_config.json',
    'tools/config-files/enhanced_mcp_config.json',
    'packages/jules-skill/mcp-config.example.json',
  ].forEach(printMcpConfig);

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
  await writeRuntimeStateSnapshot();

  printHeader('How To Start New Sessions');
  console.log('- Run: ./tnf onboard');
  console.log('- Alt: pnpm run tnf -- onboard');
  console.log('- Read: AGENTS.md');
  console.log('- Optional shell auto-bootstrap: docs/TNF_SESSION_ONBOARDING.md');
}

main().catch((error) => {
  console.error(`Bootstrap failed: ${error?.message || 'unknown error'}`);
  process.exit(1);
});
