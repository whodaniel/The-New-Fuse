#!/usr/bin/env node
/**
 * Skill publisher attestation — inventory publishers, hash SKILL.md, optional cosign.
 *
 *   node scripts/harness/skill-publisher-attest.cjs [--json] [--write-lock] [--check-lock]
 *     [--strict-skills] [--limit N]
 */
'use strict';

const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const REGISTRY_PATH = path.join(ROOT, 'data/harness/skill-publisher-registry.json');
const LOCK_PATH = path.join(ROOT, 'data/harness/skill-publisher.lock.json');
const RECEIPT_DIR = path.join(ROOT, 'data/harness/receipts');
const SKILL_ROOTS = ['.agent/skills', '.skills', '.claude/skills'];

function parseArgs(argv) {
  const out = {
    json: false,
    writeLock: false,
    checkLock: false,
    strictSkills: false,
    limit: 0,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--json') out.json = true;
    else if (t === '--write-lock') out.writeLock = true;
    else if (t === '--check-lock') out.checkLock = true;
    else if (t === '--strict-skills') out.strictSkills = true;
    else if (t === '--limit') out.limit = Number.parseInt(argv[++i] || '0', 10) || 0;
  }
  if (out.strictSkills) out.checkLock = true;
  return out;
}

function loadJson(abs, fallback) {
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch {
    return fallback;
  }
}

function sha256File(abs) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  } catch {
    return null;
  }
}

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end < 0) return {};
  const block = text.slice(3, end).trim();
  const meta = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    meta[m[1].toLowerCase()] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return meta;
}

function classifyPublisher(relPath, meta, registry) {
  const publishers = registry.publishers || {};
  const declared =
    meta.publisher || meta.author || meta.vendor || meta.organization || meta.source || '';
  for (const [id, def] of Object.entries(publishers)) {
    for (const prefix of def.pathPrefixes || []) {
      if (relPath.startsWith(prefix) || relPath.includes(`/${prefix.replace(/\/$/, '')}/`)) {
        return { id, trust: def.trust || 'vendor', match: 'path-prefix', declared: declared || id };
      }
    }
    if (declared && String(declared).toLowerCase().includes(id)) {
      return { id, trust: def.trust || 'vendor', match: 'frontmatter', declared };
    }
  }
  if (relPath.startsWith('.agent/skills/tnf') || relPath.includes('/tnf-')) {
    return { id: 'tnf', trust: 'first-party', match: 'heuristic', declared: declared || 'tnf' };
  }
  return {
    id: declared ? String(declared).toLowerCase().slice(0, 64) : 'unknown',
    trust: declared ? 'third-party' : 'unsigned',
    match: declared ? 'frontmatter-unlisted' : 'none',
    declared: declared || null,
  };
}

function listSkillFiles(limit) {
  const files = [];
  for (const root of SKILL_ROOTS) {
    const absRoot = path.join(ROOT, root);
    if (!fs.existsSync(absRoot)) continue;
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(abs);
        else if (ent.name === 'SKILL.md' || ent.name === 'skill.md') {
          files.push(abs);
        }
      }
    };
    walk(absRoot);
  }
  files.sort();
  return limit > 0 ? files.slice(0, limit) : files;
}

function cosignAvailable(registry) {
  const bin = registry?.cosign?.binary || 'cosign';
  const r = spawnSync(bin, ['version'], { encoding: 'utf8' });
  return r.status === 0;
}

function tryCosignVerify(skillAbs, registry) {
  if (!registry?.cosign?.enabled) return { attempted: false, ok: null, note: 'cosign disabled' };
  const sigCandidates = [
    `${skillAbs}.sig`,
    path.join(path.dirname(skillAbs), 'SKILL.md.sig'),
    path.join(path.dirname(skillAbs), 'provenance.sigstore.json'),
  ];
  const sig = sigCandidates.find((p) => fs.existsSync(p));
  if (!sig) return { attempted: false, ok: null, note: 'no signature artifact' };
  if (!cosignAvailable(registry)) {
    return {
      attempted: true,
      ok: registry.cosign.softWhenMissingBinary ? null : false,
      note: 'cosign binary missing',
    };
  }
  const bin = registry.cosign.binary || 'cosign';
  const r = spawnSync(bin, ['verify-blob', '--signature', sig, skillAbs], {
    encoding: 'utf8',
  });
  return {
    attempted: true,
    ok: r.status === 0,
    note: r.status === 0 ? 'cosign verify-blob ok' : (r.stderr || r.stdout || 'verify failed').trim().slice(0, 200),
  };
}

function attestSkills(opts) {
  const registry = loadJson(REGISTRY_PATH, { publishers: {}, cosign: { enabled: false } });
  const files = listSkillFiles(opts.limit);
  const rows = [];
  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const text = fs.readFileSync(abs, 'utf8');
    const meta = parseFrontmatter(text);
    const publisher = classifyPublisher(rel, meta, registry);
    const sha256 = sha256File(abs);
    const cosign = tryCosignVerify(abs, registry);
    rows.push({
      path: rel,
      sha256,
      publisher,
      cosign,
      ok:
        publisher.trust === 'first-party' ||
        publisher.trust === 'vendor' ||
        publisher.trust === 'interop' ||
        Boolean(publisher.declared),
    });
  }
  return { registry, rows };
}

function writeLock(rows) {
  const entries = {};
  for (const row of rows) {
    if (!row.sha256) continue;
    // Pin first-party + vendor + any with declared publisher
    if (
      row.publisher.trust === 'first-party' ||
      row.publisher.trust === 'vendor' ||
      row.publisher.trust === 'interop' ||
      row.publisher.declared
    ) {
      entries[row.path] = {
        sha256: row.sha256,
        publisher: row.publisher.id,
        trust: row.publisher.trust,
      };
    }
  }
  const lock = {
    version: 1,
    updatedAt: new Date().toISOString(),
    generator: 'scripts/harness/skill-publisher-attest.cjs --write-lock',
    entries,
  };
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  fs.writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);
  return lock;
}

function checkLock(rows, lock) {
  if (!lock?.entries) return { ok: false, drifts: ['skill lock missing — run --write-lock'] };
  const drifts = [];
  const byPath = new Map(rows.map((r) => [r.path, r]));
  for (const [p, expected] of Object.entries(lock.entries)) {
    const live = byPath.get(p);
    if (!live) {
      drifts.push(`${p}: missing on disk`);
      continue;
    }
    if (live.sha256 !== expected.sha256) {
      drifts.push(
        `${p}: sha256 drift (locked=${String(expected.sha256).slice(0, 12)}… live=${String(live.sha256).slice(0, 12)}…)`
      );
    }
  }
  return { ok: drifts.length === 0, drifts };
}

function summarize(rows) {
  const byTrust = {};
  for (const r of rows) {
    const t = r.publisher.trust || 'unknown';
    byTrust[t] = (byTrust[t] || 0) + 1;
  }
  const cosignAttempted = rows.filter((r) => r.cosign?.attempted).length;
  const cosignOk = rows.filter((r) => r.cosign?.ok === true).length;
  return { byTrust, cosignAttempted, cosignOk, total: rows.length };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { registry, rows } = attestSkills(opts);
  let lock = loadJson(LOCK_PATH, null);
  if (opts.writeLock) lock = writeLock(rows);
  const lockCheck =
    opts.checkLock || opts.writeLock ? checkLock(rows, lock) : { ok: true, drifts: [] };

  const unsigned = rows.filter((r) => r.publisher.trust === 'unsigned');
  const cosignFail = rows.filter((r) => r.cosign?.attempted && r.cosign.ok === false);
  const summary = summarize(rows);

  const ok = opts.strictSkills
    ? lockCheck.ok && cosignFail.length === 0
    : opts.checkLock
      ? lockCheck.ok
      : true;

  const payload = {
    ok,
    at: new Date().toISOString(),
    registryPath: path.relative(ROOT, REGISTRY_PATH),
    lockPath: path.relative(ROOT, LOCK_PATH),
    summary,
    unsignedCount: unsigned.length,
    cosignFailures: cosignFail.map((r) => r.path),
    lockOk: lockCheck.ok,
    lockDrifts: lockCheck.drifts,
    lockUpdated: Boolean(opts.writeLock),
    sample: rows.slice(0, 12),
    guidance:
      'Trusted publishers live in data/harness/skill-publisher-registry.json. Pin with --write-lock; verify with --check-lock. Place SKILL.md.sig (+ cosign) for cryptographic verify. --strict-skills fails on lock drift or failed cosign.',
  };

  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  const receipt = path.join(RECEIPT_DIR, `skill-publisher-${Date.now()}.json`);
  fs.writeFileSync(receipt, `${JSON.stringify({ ...payload, rows }, null, 2)}\n`);
  payload.receipt = path.relative(ROOT, receipt);

  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log('TNF skill publisher attestation');
    console.log(`skills: ${summary.total}  trust=${JSON.stringify(summary.byTrust)}`);
    console.log(
      `cosign: attempted=${summary.cosignAttempted} ok=${summary.cosignOk} unsigned=${unsigned.length}`
    );
    if (opts.writeLock) console.log(`lock written: ${payload.lockPath} (${Object.keys(lock.entries || {}).length} entries)`);
    if (opts.checkLock || opts.writeLock) {
      console.log(
        lockCheck.ok
          ? 'lock: OK'
          : `lock: DRIFT (${lockCheck.drifts.length})\n  - ${lockCheck.drifts.slice(0, 8).join('\n  - ')}`
      );
    }
    console.log(
      ok
        ? `\nSKILL-PUBLISHER ${opts.strictSkills ? 'PASS (strict)' : opts.checkLock ? 'PASS (lock)' : 'PASS (soft)'}`
        : `\nSKILL-PUBLISHER FAIL (drifts=${lockCheck.drifts.length} cosignFail=${cosignFail.length})`
    );
    console.log(`receipt: ${payload.receipt}`);
  }
  process.exit(ok ? 0 : 1);
}

module.exports = { attestSkills, writeLock, checkLock, REGISTRY_PATH, LOCK_PATH };

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`skill-publisher-attest: ${err.message}`);
    process.exit(1);
  }
}
