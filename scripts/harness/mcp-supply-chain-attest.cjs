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
  return {
    json: argv.includes('--json'),
    strict: argv.includes('--strict'),
    writeLock: argv.includes('--write-lock'),
    checkLock: argv.includes('--check-lock') || argv.includes('--strict'),
    skills: argv.includes('--skills') || argv.includes('--with-skills'),
    writeSkillLock: argv.includes('--write-skill-lock'),
    checkSkillLock: argv.includes('--check-skill-lock') || argv.includes('--strict-skills'),
    strictSkills: argv.includes('--strict-skills'),
  };
}

const LOCK_PATH = path.join(ROOT, 'data/harness/mcp-supply-chain.lock.json');

function loadLock() {
  if (!fs.existsSync(LOCK_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeLock(servers) {
  const entries = {};
  for (const s of servers) {
    if (!s.sha256 || !s.entry) continue;
    entries[s.name] = { entry: s.entry, sha256: s.sha256 };
  }
  const lock = {
    version: 1,
    updatedAt: new Date().toISOString(),
    generator: 'scripts/harness/mcp-supply-chain-attest.cjs --write-lock',
    entries,
  };
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  fs.writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);
  return lock;
}

function checkLock(servers, lock) {
  if (!lock || !lock.entries) {
    return { ok: false, drifts: ['lockfile missing — run with --write-lock'] };
  }
  const drifts = [];
  for (const s of servers) {
    if (!s.sha256 || !s.entry) continue;
    const expected = lock.entries[s.name];
    if (!expected) {
      drifts.push(`${s.name}: not in lock (new entrypoint)`);
      continue;
    }
    if (expected.sha256 !== s.sha256) {
      drifts.push(`${s.name}: sha256 drift (locked=${expected.sha256.slice(0, 12)}… live=${s.sha256.slice(0, 12)}…)`);
    }
  }
  return { ok: drifts.length === 0, drifts };
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

  let lock = loadLock();
  if (opts.writeLock) {
    lock = writeLock(servers);
  }
  const lockCheck = opts.checkLock || opts.writeLock ? checkLock(servers, lock) : { ok: true, drifts: [] };

  let skillAttest = null;
  if (opts.skills || opts.writeSkillLock || opts.checkSkillLock || opts.strictSkills) {
    const skillMod = require('./skill-publisher-attest.cjs');
    const { rows } = skillMod.attestSkills({ limit: 0 });
    let skillLock = null;
    try {
      skillLock = JSON.parse(fs.readFileSync(skillMod.LOCK_PATH, 'utf8'));
    } catch {
      skillLock = null;
    }
    if (opts.writeSkillLock) skillLock = skillMod.writeLock(rows);
    const skillLockCheck =
      opts.checkSkillLock || opts.writeSkillLock
        ? skillMod.checkLock(rows, skillLock)
        : { ok: true, drifts: [] };
    const cosignFail = rows.filter((r) => r.cosign?.attempted && r.cosign.ok === false);
    const skillOk = opts.strictSkills
      ? skillLockCheck.ok && cosignFail.length === 0
      : opts.checkSkillLock
        ? skillLockCheck.ok
        : true;
    skillAttest = {
      ok: skillOk,
      total: rows.length,
      lockOk: skillLockCheck.ok,
      lockDrifts: skillLockCheck.drifts.slice(0, 20),
      cosignFailures: cosignFail.length,
      registry: path.relative(ROOT, skillMod.REGISTRY_PATH),
    };
  }

  const ok =
    (opts.strict
      ? missing.length === 0 && lockCheck.ok
      : opts.checkLock
        ? lockCheck.ok
        : true) && (skillAttest ? skillAttest.ok : true);
  const payload = {
    ok,
    softMode: !opts.strict && !opts.checkLock && !opts.strictSkills,
    at: new Date().toISOString(),
    configSources: configs.map((c) => c.path),
    servers,
    skills,
    skillPublisher: skillAttest,
    failed: missing.map((s) => s.name),
    lockPath: path.relative(ROOT, LOCK_PATH),
    lockUpdated: Boolean(opts.writeLock),
    lockOk: lockCheck.ok,
    lockDrifts: lockCheck.drifts,
    guidance:
      'Use --write-lock / --check-lock for MCP entrypoints. Add --skills or --write-skill-lock / --check-skill-lock for publisher registry + skill hash lock (optional cosign). --strict-skills fails on skill lock drift or failed cosign.',
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
    if (opts.writeLock) console.log(`lock written: ${payload.lockPath}`);
    if (opts.checkLock || opts.writeLock) {
      console.log(
        lockCheck.ok
          ? 'lock: OK (hashes match)'
          : `lock: DRIFT (${lockCheck.drifts.length})\n  - ${lockCheck.drifts.join('\n  - ')}`
      );
    }
    if (skillAttest) {
      console.log(
        `skill-publisher: total=${skillAttest.total} lockOk=${skillAttest.lockOk} cosignFail=${skillAttest.cosignFailures}`
      );
    }
    console.log(
      ok
        ? `\nSUPPLY-CHAIN ${
            opts.strict || opts.strictSkills
              ? 'PASS (strict)'
              : opts.checkLock || opts.checkSkillLock
                ? 'PASS (lock)'
                : 'PASS (soft inventory)'
          }`
        : `\nSUPPLY-CHAIN FAIL (missing=${missing.length} drifts=${lockCheck.drifts.length} skillOk=${
            skillAttest ? skillAttest.ok : 'n/a'
          })`
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
