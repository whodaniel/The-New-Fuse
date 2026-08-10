#!/usr/bin/env node
/**
 * MCP / skills supply-chain attestation — inventory + existence + soft integrity.
 * Soft-fails unknown servers; hard-fails missing entrypoints listed as required.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const RECEIPT_DIR = path.join(ROOT, 'data/harness/receipts');

function parseArgs(argv) {
  return { json: argv.includes('--json'), strict: argv.includes('--strict') };
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function sha256File(abs) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  } catch {
    return null;
  }
}

function loadMcpConfig() {
  const candidates = [
    'data/mcp_config.json',
    'data/harness/mcp.memory.server.json',
    'tools/config-files/mcp_config.json',
    'tools/config-files/enhanced_mcp_config.json',
  ];
  const found = [];
  for (const rel of candidates) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    try {
      found.push({ path: rel, config: JSON.parse(fs.readFileSync(abs, 'utf8')) });
    } catch (err) {
      found.push({ path: rel, error: err.message });
    }
  }
  return found;
}

function collectSkillRoots() {
  const roots = ['.agent/skills', '.skills', '.claude/skills'];
  const summary = [];
  for (const root of roots) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) {
      summary.push({ root, present: false, skillMdCount: 0 });
      continue;
    }
    let count = 0;
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name === 'SKILL.md' || ent.name === 'skill.md') count += 1;
      }
    };
    walk(abs);
    summary.push({ root, present: true, skillMdCount: count });
  }
  return summary;
}

function attestServer(name, def) {
  const command = def.command || def.cmd || '';
  const args = Array.isArray(def.args) ? def.args : [];
  const entry = args.find((a) => /\.(ts|js|cjs|mjs)$/.test(String(a))) || null;
  const entryOk = entry ? exists(entry) : command === 'pnpm' || command === 'npx' || Boolean(command);
  const hash = entry && entryOk ? sha256File(path.join(ROOT, entry)) : null;
  return {
    name,
    command,
    entry,
    entryPresent: entry ? exists(entry) : null,
    ok: entryOk,
    sha256: hash,
    note: entry
      ? entryOk
        ? 'entrypoint present'
        : 'entrypoint missing'
      : 'no file entrypoint in args (runtime binary only)',
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const configs = loadMcpConfig();
  const servers = [];
  for (const item of configs) {
    if (item.error) {
      servers.push({ name: item.path, ok: false, note: `parse error: ${item.error}` });
      continue;
    }
    const mcpServers = item.config.mcpServers || item.config.servers || {};
    for (const [name, def] of Object.entries(mcpServers)) {
      if (!def || typeof def !== 'object') continue;
      if (def.type === 'api') {
        servers.push({
          name: `${item.path}:${name}`,
          ok: true,
          note: `api endpoint ${def.host || ''}:${def.port || ''}`,
          kind: 'api',
        });
        continue;
      }
      const row = attestServer(`${item.path}:${name}`, def);
      servers.push(row);
    }
  }

  const skills = collectSkillRoots();
  const missing = servers.filter((s) => s.ok === false);
  const ok = opts.strict ? missing.length === 0 : true;
  const payload = {
    ok,
    softMode: !opts.strict,
    at: new Date().toISOString(),
    configSources: configs.map((c) => c.path),
    servers,
    skills,
    failed: missing.map((s) => s.name),
    guidance:
      'Use --strict to fail closed on missing MCP entrypoints. Skills counted for progressive-disclosure inventory only.',
  };

  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  const receipt = path.join(RECEIPT_DIR, `supply-chain-${Date.now()}.json`);
  fs.writeFileSync(receipt, `${JSON.stringify(payload, null, 2)}\n`);
  payload.receipt = path.relative(ROOT, receipt);

  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log('TNF MCP/skills supply-chain attestation');
    console.log(`sources: ${payload.configSources.join(', ') || '(none)'}`);
    for (const s of servers) {
      console.log(`${s.ok ? 'OK' : 'FAIL'}: ${s.name} — ${s.note || s.sha256 || ''}`);
    }
    for (const sk of skills) {
      console.log(
        `${sk.present ? 'OK' : 'SKIP'}: skills ${sk.root} — ${sk.present ? `${sk.skillMdCount} SKILL.md` : 'absent'}`
      );
    }
    console.log(
      ok
        ? `\nSUPPLY-CHAIN ${opts.strict ? 'PASS (strict)' : 'PASS (soft inventory)'}`
        : `\nSUPPLY-CHAIN FAIL (${missing.length} missing)`
    );
    console.log(`receipt: ${payload.receipt}`);
  }
  process.exit(ok ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.error(`mcp-supply-chain-attest: ${err.message}`);
  process.exit(1);
}
