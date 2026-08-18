#!/usr/bin/env node

/**
 * Authority keypair reconciler.
 *
 * `RedisAgentClient.register()` used to mint `agent_${name}_${Date.now()}` on every
 * process start, and each of those strangers got its own Ed25519 keypair. The result
 * on this machine (2026-08-16): 41,304 files in ~/.tnf/authority/keys/ and 20,652 in
 * pubkeys/, against exactly ONE role assignment in roles.json. Every one of those keys
 * is a private key on disk that no policy will ever reference again.
 *
 * The identity minting is fixed upstream (see resolveStableAgentId in
 * packages/tnf-cli/src/RedisAgentClient.ts). This clears the backlog it left.
 *
 * SAFETY: this never deletes. Default is report-only; `--archive` MOVES orphans into a
 * timestamped folder so a mistake is recoverable by moving them back. An identity is
 * kept if it holds a role, if it is not a legacy timestamped id, or if it has been
 * touched recently — three independent reasons to be conservative.
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const AUTHORITY_DIR =
  process.env.TNF_AUTHORITY_DIR || path.join(os.homedir(), '.tnf', 'authority');

/** Legacy ephemeral identity: name plus a 13-digit epoch, e.g. agent_BROKER-Green_1786237317362 */
const LEGACY_EPHEMERAL_ID = /^agent_.+_\d{13}$/;

const DEFAULT_KEEP_DAYS = 7;

/** Strip the suffixes the authority layer uses so all files fold to one identity. */
function identityFromFilename(filename) {
  return filename.replace(/\.(ed25519|pub)$/, '');
}

function loadRoles(authorityDir) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(authorityDir, 'roles.json'), 'utf8'));
    // The registry has been written both as {agentId: {...}} and {agents: {...}}.
    const agents = raw && typeof raw === 'object' && raw.agents ? raw.agents : raw;
    return new Set(Object.keys(agents || {}));
  } catch {
    return new Set();
  }
}

/**
 * Decide what to keep. Returns { keep, orphan } as identity -> reason / file lists.
 *
 * `now` and `keepDays` are parameters rather than globals so the classification is
 * testable without touching the clock or the real authority directory.
 */
function classifyIdentities({ authorityDir = AUTHORITY_DIR, now = Date.now(), keepDays = DEFAULT_KEEP_DAYS } = {}) {
  const roles = loadRoles(authorityDir);
  const cutoff = now - keepDays * 24 * 60 * 60 * 1000;

  const identities = new Map(); // id -> { files: [], mtime }

  for (const dirName of ['keys', 'pubkeys']) {
    const dir = path.join(authorityDir, dirName);
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const id = identityFromFilename(entry);
      const full = path.join(dir, entry);
      let mtime = 0;
      try {
        mtime = fs.statSync(full).mtimeMs;
      } catch {
        continue;
      }
      const record = identities.get(id) || { files: [], mtime: 0 };
      record.files.push(full);
      record.mtime = Math.max(record.mtime, mtime);
      identities.set(id, record);
    }
  }

  const keep = [];
  const orphan = [];
  for (const [id, record] of identities) {
    let reason = null;
    if (roles.has(id)) reason = 'holds-role';
    else if (!LEGACY_EPHEMERAL_ID.test(id)) reason = 'stable-identity';
    else if (record.mtime >= cutoff) reason = 'recently-active';

    if (reason) keep.push({ id, reason, files: record.files, mtime: record.mtime });
    else orphan.push({ id, files: record.files, mtime: record.mtime });
  }

  keep.sort((a, b) => a.id.localeCompare(b.id));
  orphan.sort((a, b) => a.mtime - b.mtime);
  return { keep, orphan, totalIdentities: identities.size };
}

/** Move orphan files into a timestamped archive. Returns the archive directory. */
function archiveOrphans(orphans, { authorityDir = AUTHORITY_DIR } = {}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveDir = path.join(authorityDir, 'archived-keys', stamp);
  fs.mkdirSync(archiveDir, { recursive: true, mode: 0o700 });

  let moved = 0;
  for (const entry of orphans) {
    for (const file of entry.files) {
      // Keep the keys/ vs pubkeys/ split inside the archive so a restore is a
      // straight move back rather than a guess about which directory it came from.
      const bucket = path.basename(path.dirname(file));
      const destDir = path.join(archiveDir, bucket);
      fs.mkdirSync(destDir, { recursive: true, mode: 0o700 });
      try {
        fs.renameSync(file, path.join(destDir, path.basename(file)));
        moved += 1;
      } catch {
        // Leave anything we cannot move; a partial archive is safe, a crash is not.
      }
    }
  }
  return { archiveDir, moved };
}

function main(argv) {
  const args = new Set(argv);
  const keepDaysArg = argv.find((a) => a.startsWith('--keep-days='));
  const keepDays = keepDaysArg ? Number.parseInt(keepDaysArg.split('=')[1], 10) : DEFAULT_KEEP_DAYS;

  if (args.has('--help') || args.has('-h')) {
    console.log(`
  Authority keypair reconciler — report-only by default, never deletes.

    node scripts/lib/tnf-authority-keys.cjs [--keep-days=N] [--archive --yes]

    --keep-days=N   treat identities touched within N days as active (default ${DEFAULT_KEEP_DAYS})
    --archive       MOVE orphans into ~/.tnf/authority/archived-keys/<timestamp>/
    --yes           required with --archive
`);
    return 0;
  }

  const { keep, orphan, totalIdentities } = classifyIdentities({ keepDays });

  console.log('TNF authority keypair reconciliation\n');
  console.log(`  identities:        ${totalIdentities}`);
  console.log(`  keep:              ${keep.length}`);
  console.log(`  orphan candidates: ${orphan.length}`);

  const byReason = keep.reduce((acc, k) => ({ ...acc, [k.reason]: (acc[k.reason] || 0) + 1 }), {});
  for (const [reason, count] of Object.entries(byReason)) {
    console.log(`    kept (${reason}): ${count}`);
  }

  if (orphan.length > 0) {
    console.log('\n  oldest orphan candidates:');
    for (const o of orphan.slice(0, 5)) {
      console.log(`    ${o.id}  (${o.files.length} file(s), ${new Date(o.mtime).toISOString()})`);
    }
  }

  if (!args.has('--archive')) {
    console.log('\n  Report only. Re-run with --archive --yes to move orphans aside.');
    return 0;
  }
  if (!args.has('--yes')) {
    console.error('\n  Refusing to archive without --yes.');
    return 2;
  }

  const { archiveDir, moved } = archiveOrphans(orphan);
  console.log(`\n  moved ${moved} file(s) -> ${archiveDir}`);
  console.log('  Nothing was deleted; move files back to restore.');
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  classifyIdentities,
  archiveOrphans,
  identityFromFilename,
  LEGACY_EPHEMERAL_ID,
  DEFAULT_KEEP_DAYS,
};
