#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const postgres = require('postgres');

const ROOT = process.cwd();

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

function readJson(relPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
  } catch {
    return null;
  }
}

function mcpSummary() {
  const files = [
    'data/mcp_config.json',
    'tools/config-files/mcp_config.json',
    'tools/config-files/enhanced_mcp_config.json',
    'packages/jules-skill/mcp-config.example.json',
  ];

  const totals = [];
  const names = [];
  for (const file of files) {
    const json = readJson(file);
    const keys = Object.keys((json && json.mcpServers) || {});
    totals.push({ file, count: keys.length });
    keys.forEach((name) => names.push(name));
  }

  const counts = names.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const duplicates = Object.entries(counts)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1]);

  return {
    totals,
    unique: Object.keys(counts).length,
    duplicates,
  };
}

async function dbCounts(sql) {
  const rows = await sql`
    SELECT 'agents' AS tbl, COUNT(*)::int AS count FROM agents
    UNION ALL SELECT 'registered_entities', COUNT(*)::int FROM registered_entities
    UNION ALL SELECT 'a2a_agents', COUNT(*)::int FROM a2a_agents
    UNION ALL SELECT 'tnf_agent_definitions', COUNT(*)::int FROM tnf_agent_definitions
    UNION ALL SELECT 'tnf_agent_sessions', COUNT(*)::int FROM tnf_agent_sessions
    UNION ALL SELECT 'tnf_llm_models', COUNT(*)::int FROM tnf_llm_models
    UNION ALL SELECT 'tnf_harnesses', COUNT(*)::int FROM tnf_harnesses
    UNION ALL SELECT 'tnf_mcp_servers', COUNT(*)::int FROM tnf_mcp_servers
    ORDER BY tbl;
  `;

  return rows;
}

async function main() {
  dotenv.config({ path: path.join(ROOT, '.env.local') });
  dotenv.config({ path: path.join(ROOT, '.env') });

  const dbUrl = process.env.DATABASE_URL || '';
  const allowLocal = process.env.TNF_ALLOW_LOCAL_DB === '1';
  const cloudRequired = process.env.TNF_REQUIRE_CLOUD_DB !== '0';

  if (!dbUrl) {
    console.error('Synergy audit failed: DATABASE_URL is not set');
    process.exit(1);
  }
  if (cloudRequired && !allowLocal && isLocalDatabaseUrl(dbUrl)) {
    console.error(
      'Synergy audit failed: DATABASE_URL is local while cloud-rooted execution is required (set TNF_ALLOW_LOCAL_DB=1 to override)'
    );
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 8, idle_timeout: 5 });

  try {
    const [tables, mcp] = await Promise.all([dbCounts(sql), Promise.resolve(mcpSummary())]);

    const date = new Date().toISOString().slice(0, 10);
    const outPath = path.join(
      ROOT,
      'docs',
      'project-management',
      `synergy-inventory-audit-auto-${date}.md`
    );

    const lines = [];
    lines.push('# TNF Synergy Inventory (Automated)');
    lines.push('');
    lines.push(`Date: ${date}`);
    lines.push(`Cloud policy: ${cloudRequired ? 'required' : 'optional'}${allowLocal ? ' (local override active)' : ''}`);
    lines.push('');
    lines.push('## Registry Counts');
    lines.push('');
    for (const row of tables) {
      lines.push(`- ${row.tbl}: ${row.count}`);
    }
    lines.push('');
    lines.push('## MCP Config Inventory');
    lines.push('');
    for (const item of mcp.totals) {
      lines.push(`- ${item.file}: ${item.count}`);
    }
    lines.push(`- unique MCP names: ${mcp.unique}`);
    lines.push(`- duplicate MCP names: ${mcp.duplicates.length}`);
    if (mcp.duplicates.length) {
      lines.push('- duplicates detail:');
      for (const [name, count] of mcp.duplicates) {
        lines.push(`  - ${name}: ${count}`);
      }
    }

    fs.writeFileSync(outPath, `${lines.join('\n')}\n`);
    console.log(`Synergy audit written: ${path.relative(ROOT, outPath)}`);
  } finally {
    await sql.end({ timeout: 1 });
  }
}

main().catch((error) => {
  console.error(`Synergy audit failed: ${error?.message || 'unknown error'}`);
  process.exit(1);
});
