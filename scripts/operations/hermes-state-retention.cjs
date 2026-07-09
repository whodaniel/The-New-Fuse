#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Hermes + operator-home state retention (safe consolidation).
 * - Carries forward viable context before destructive steps
 * - Finalizes empty cron ghosts, exports compact manifests, prunes old cron rows
 * - VACUUMs state.db when healthy and disk headroom allows
 * - Caps pre-update backups and state-snapshots (never drops sole snapshot blindly)
 * Never deletes memories/MEMORY.md, memory_store.db, config, or auth without review.
 */
const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME = os.homedir();
const HERMES = path.join(HOME, '.hermes');
const TNF_HOME = process.env.TNF_HOME || path.join(HOME, '.tnf');
const STATE_DB = path.join(HERMES, 'state.db');
const RETENTION_DIR = path.join(TNF_HOME, 'hermes-retention');
const CONTEXT_MANIFEST = path.join(RETENTION_DIR, 'session-context-manifest.jsonl');
const SNAPSHOT_CARRY_DIR = path.join(RETENTION_DIR, 'snapshot-carry-forward');
const EXPORT_DIR = path.join(RETENTION_DIR, 'session-exports');

const BACKUP_KEEP = Number.parseInt(process.env.TNF_HERMES_BACKUP_KEEP || '1', 10);
const CRON_PRUNE_DAYS = Number.parseInt(process.env.TNF_HERMES_CRON_PRUNE_DAYS || '3', 10);
const CRON_EXPORT_MIN_MESSAGES = Number.parseInt(process.env.TNF_HERMES_EXPORT_MIN_MESSAGES || '2', 10);
const MASTER_CLOCK_KEEP = Number.parseInt(process.env.TNF_MASTER_CLOCK_DAILY_KEEP || '7', 10);
const MEMORY_BAK_KEEP = Number.parseInt(process.env.TNF_HERMES_MEMORY_BAK_KEEP || '3', 10);
const MIN_VACUUM_FREE_MB = Number.parseInt(process.env.TNF_HERMES_MIN_VACUUM_FREE_MB || '800', 10);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.TNF_HERMES_RETENTION_DRY_RUN || '');

/** Files Hermes quick-snapshots treat as operational context (see hermes_cli/backup.py). */
const SNAPSHOT_CARRY_FILES = [
  'cron/jobs.json',
  'config.yaml',
  'auth.json',
  'gateway_state.json',
  'channel_directory.json',
  'channel_aliases.json',
];

function log(msg) {
  console.log(`[hermes-state-retention] ${msg}`);
}

function run(cmd, options = {}) {
  if (DRY_RUN) {
    log(`dry-run: ${cmd}`);
    return '';
  }
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function runHermes(args) {
  const hermes = spawnSync('hermes', args, { encoding: 'utf8' });
  if (hermes.status !== 0) {
    const err = (hermes.stderr || hermes.stdout || '').trim();
    throw new Error(`hermes ${args.join(' ')} failed: ${err.split('\n').slice(-1)[0]}`);
  }
  return (hermes.stdout || '').trim();
}

function dbHealthy() {
  if (!fs.existsSync(STATE_DB)) return false;
  try {
    const out = run(`sqlite3 ${JSON.stringify(STATE_DB)} "PRAGMA integrity_check;"`);
    return out.split('\n')[0] === 'ok';
  } catch {
    return false;
  }
}

function sqlite(query) {
  if (!dbHealthy()) {
    throw new Error('state.db missing or failed integrity_check');
  }
  const oneLine = query.replace(/\s+/g, ' ').trim();
  return run(`sqlite3 ${JSON.stringify(STATE_DB)} ${JSON.stringify(oneLine)}`);
}

function freeDiskMb() {
  try {
    const out = run('df -k /');
    const line = out.trim().split('\n').pop();
    const cols = line.trim().split(/\s+/);
    const availKb = Number.parseInt(cols[3], 10);
    return Number.isFinite(availKb) ? availKb / 1024 : 0;
  } catch {
    return 0;
  }
}

function countCronJobs(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(data)) return data.length;
    if (data && Array.isArray(data.jobs)) return data.jobs.length;
    return null;
  } catch {
    return null;
  }
}

function ensureRetentionDirs() {
  for (const dir of [RETENTION_DIR, SNAPSHOT_CARRY_DIR, EXPORT_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendManifest(record) {
  ensureRetentionDirs();
  fs.appendFileSync(CONTEXT_MANIFEST, `${JSON.stringify(record)}\n`);
}

/**
 * Before removing snapshot dirs: preserve cron/config deltas and record manifest.
 * Mirrors Hermes restore_cron_jobs_if_emptied semantics — only promote cron jobs
 * when live count is LOWER than snapshot (job loss), never silently downgrade.
 */
function carryForwardSnapshotContext() {
  const root = path.join(HERMES, 'state-snapshots');
  if (!fs.existsSync(root)) return;

  const liveCron = path.join(HERMES, 'cron/jobs.json');
  const liveCronCount = countCronJobs(liveCron);

  for (const name of fs.readdirSync(root)) {
    const snapDir = path.join(root, name);
    if (!fs.statSync(snapDir).isDirectory()) continue;

    const manifestPath = path.join(snapDir, 'manifest.json');
    const snapManifest = fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      : { id: name, files: {} };

    const carryRecord = {
      type: 'snapshot_carry_forward',
      ts: new Date().toISOString(),
      snapshotId: name,
      actions: [],
    };

    for (const rel of SNAPSHOT_CARRY_FILES) {
      const src = path.join(snapDir, rel);
      if (!fs.existsSync(src)) continue;

      const dest = path.join(SNAPSHOT_CARRY_DIR, name, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });

      if (rel === 'cron/jobs.json') {
        const snapCount = countCronJobs(src);
        if (snapCount == null) continue;
        if (liveCronCount != null && liveCronCount >= snapCount) {
          carryRecord.actions.push({
            file: rel,
            action: 'skip',
            reason: `live cron jobs (${liveCronCount}) >= snapshot (${snapCount})`,
          });
          continue;
        }
        if (DRY_RUN) {
          log(`dry-run: would restore cron from snapshot ${name} (${snapCount} jobs)`);
          carryRecord.actions.push({ file: rel, action: 'would_restore', snapCount, liveCronCount });
          continue;
        }
        fs.copyFileSync(src, dest);
        fs.copyFileSync(src, liveCron);
        carryRecord.actions.push({
          file: rel,
          action: 'restored_cron',
          snapCount,
          liveCronCount,
          dest,
        });
        log(`restored cron/jobs.json from snapshot ${name} (${snapCount} jobs; live was ${liveCronCount})`);
        continue;
      }

      // Non-destructive carry: copy to retention dir for operator diff; do not overwrite live.
      if (!DRY_RUN) {
        fs.copyFileSync(src, dest);
      }
      carryRecord.actions.push({ file: rel, action: 'copied_for_review', dest });
    }

    if (carryRecord.actions.length) {
      appendManifest(carryRecord);
    }
  }
}

function listCronPruneCandidates(olderThanDays) {
  const rows = sqlite(`
    SELECT id, title, source, message_count, started_at, ended_at, model
    FROM sessions
    WHERE source = 'cron'
      AND ended_at IS NOT NULL
      AND started_at < strftime('%s','now') - ${olderThanDays} * 86400
    ORDER BY started_at ASC
    LIMIT 2000;
  `);
  if (!rows) return [];
  return rows
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [id, title, source, message_count, started_at, ended_at, model] = line.split('|');
      return {
        id,
        title: title || '',
        source,
        message_count: Number.parseInt(message_count, 10) || 0,
        started_at,
        ended_at,
        model: model || '',
      };
    });
}

function lastMessageSnippets(sessionId) {
  try {
    const user = sqlite(`
      SELECT substr(content, 1, 240) FROM messages
      WHERE session_id = ${JSON.stringify(sessionId)} AND role = 'user'
      ORDER BY created_at DESC LIMIT 1;
    `);
    const assistant = sqlite(`
      SELECT substr(content, 1, 400) FROM messages
      WHERE session_id = ${JSON.stringify(sessionId)} AND role = 'assistant'
      ORDER BY created_at DESC LIMIT 1;
    `);
    return { lastUser: user || null, lastAssistant: assistant || null };
  } catch {
    return { lastUser: null, lastAssistant: null };
  }
}

/**
 * Export compact context for sessions about to be pruned.
 * Durable memory already lives in ~/.hermes/memories/MEMORY.md — we do not merge automatically.
 */
function exportSessionContextBeforePrune(candidates, { compact = false } = {}) {
  if (!candidates.length) return 0;
  ensureRetentionDirs();
  let exported = 0;
  let fullExports = 0;
  const fullExportLimit = Number.parseInt(process.env.TNF_HERMES_FULL_EXPORT_LIMIT || '25', 10);

  for (const row of candidates) {
    const snippets =
      !compact && row.message_count > 0 ? lastMessageSnippets(row.id) : {};
    const record = {
      type: 'session_context',
      ts: new Date().toISOString(),
      sessionId: row.id,
      title: row.title,
      source: row.source,
      messageCount: row.message_count,
      model: row.model,
      startedAt: row.started_at,
      ...snippets,
    };
    appendManifest(record);
    exported += 1;

    if (
      !compact &&
      row.message_count >= CRON_EXPORT_MIN_MESSAGES &&
      fullExports < fullExportLimit &&
      !DRY_RUN
    ) {
      try {
        const outFile = path.join(EXPORT_DIR, `${row.id}.jsonl`);
        if (!fs.existsSync(outFile)) {
          runHermes([
            'sessions',
            'export',
            '--session-id',
            row.id,
            '--format',
            'jsonl',
            outFile,
          ]);
          fullExports += 1;
        }
      } catch (error) {
        log(`session export skipped for ${row.id}: ${error.message}`);
      }
    }
  }
  log(
    `context manifest: ${exported} session(s) recorded (${fullExports} full export(s)) at ${CONTEXT_MANIFEST}`,
  );
  return exported;
}

function finalizeCronGhosts() {
  if (!dbHealthy()) {
    log('state.db unhealthy; skip cron ghost finalize');
    return 0;
  }
  const before = sqlite(
    "SELECT COUNT(*) FROM sessions WHERE source='cron' AND ended_at IS NULL AND message_count=0 AND started_at < strftime('%s','now')-86400;",
  );
  sqlite(`
    UPDATE sessions
    SET ended_at = strftime('%s','now'), end_reason = 'retention_ghost'
    WHERE source = 'cron'
      AND ended_at IS NULL
      AND message_count = 0
      AND started_at < strftime('%s','now') - 86400;
  `);
  const after = sqlite(
    "SELECT COUNT(*) FROM sessions WHERE source='cron' AND ended_at IS NULL AND message_count=0 AND started_at < strftime('%s','now')-86400;",
  );
  const finalized = Math.max(0, Number.parseInt(before, 10) - Number.parseInt(after, 10));
  log(`finalized ${finalized} empty cron ghost session(s)`);
  return finalized;
}

function finalizeStaleOpenCronSessions() {
  if (!dbHealthy()) return 0;
  const rows = sqlite(`
    SELECT id, title, message_count, started_at, model
    FROM sessions
    WHERE source = 'cron'
      AND ended_at IS NULL
      AND started_at < strftime('%s','now') - ${CRON_PRUNE_DAYS} * 86400
    ORDER BY started_at ASC
    LIMIT 3000;
  `);
  if (!rows) return 0;
  const candidates = rows
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [id, title, message_count, started_at, model] = line.split('|');
      return {
        id,
        title: title || '',
        source: 'cron',
        message_count: Number.parseInt(message_count, 10) || 0,
        started_at,
        model: model || '',
      };
    });
  if (!candidates.length) return 0;

  log(`${candidates.length} stale open cron session(s) older than ${CRON_PRUNE_DAYS}d — exporting context, then closing`);
  exportSessionContextBeforePrune(candidates, { compact: true });

  if (DRY_RUN) {
    log(`dry-run: would finalize ${candidates.length} stale open cron session(s)`);
    return candidates.length;
  }

  sqlite(`
    UPDATE sessions
    SET ended_at = strftime('%s','now'), end_reason = 'retention_stale_open'
    WHERE source = 'cron'
      AND ended_at IS NULL
      AND started_at < strftime('%s','now') - ${CRON_PRUNE_DAYS} * 86400;
  `);
  log(`finalized ${candidates.length} stale open cron session(s)`);
  return candidates.length;
}

function pruneHermesSessions() {
  if (!dbHealthy()) {
    log('state.db unhealthy; skip session prune/optimize');
    return;
  }

  const candidates = listCronPruneCandidates(CRON_PRUNE_DAYS);
  if (candidates.length) {
    log(`${candidates.length} ended cron session(s) older than ${CRON_PRUNE_DAYS}d — pruning`);
  }

  try {
    const pruned = runHermes([
      'sessions',
      'prune',
      '--older-than',
      String(CRON_PRUNE_DAYS),
      '--source',
      'cron',
      '--yes',
    ]);
    log(`cron prune: ${pruned || 'ok'}`);
  } catch (error) {
    log(`cron prune skipped: ${error.message}`);
  }

  const freeMb = freeDiskMb();
  if (freeMb < MIN_VACUUM_FREE_MB) {
    log(`disk free ${Math.round(freeMb)}MB < ${MIN_VACUUM_FREE_MB}MB — defer sessions optimize/VACUUM`);
    return;
  }

  try {
    runHermes(['sessions', 'optimize']);
    log('sessions optimize complete');
  } catch (error) {
    log(`sessions optimize skipped: ${error.message}`);
    try {
      const sizeBefore = fs.statSync(STATE_DB).size;
      if (sizeBefore > 512 * 1024 * 1024) {
        const compactPath = path.join(os.tmpdir(), `hermes-state-vacuumed-${Date.now()}.db`);
        sqlite(`VACUUM INTO ${JSON.stringify(compactPath)};`);
        fs.renameSync(STATE_DB, `${STATE_DB}.pre-vacuum`);
        fs.renameSync(compactPath, STATE_DB);
        fs.unlinkSync(`${STATE_DB}.pre-vacuum`);
        const sizeAfter = fs.statSync(STATE_DB).size;
        log(
          `sqlite VACUUM INTO: ${Math.round(sizeBefore / 1024 / 1024)}MB -> ${Math.round(sizeAfter / 1024 / 1024)}MB`,
        );
      }
    } catch (vacuumError) {
      log(`sqlite VACUUM skipped: ${vacuumError.message}`);
    }
  }
}

function capBackups() {
  const dir = path.join(HERMES, 'backups');
  if (!fs.existsSync(dir)) return;
  const zips = fs
    .readdirSync(dir)
    .filter((name) => name.startsWith('pre-update-') && name.endsWith('.zip'))
    .map((name) => ({ name, mtime: fs.statSync(path.join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  const remove = zips.slice(BACKUP_KEEP);
  for (const entry of remove) {
    const full = path.join(dir, entry.name);
    const liveCron = countCronJobs(path.join(HERMES, 'cron/jobs.json'));
    let zipCron = null;
    try {
      const listing = run(`unzip -p ${JSON.stringify(full)} cron/jobs.json`);
      zipCron = countCronJobsFromJson(listing);
    } catch {
      zipCron = null;
    }
    if (zipCron != null && liveCron != null && liveCron < zipCron) {
      log(`keeping backup ${entry.name} — live cron (${liveCron}) < zip (${zipCron})`);
      continue;
    }
    if (DRY_RUN) {
      log(`dry-run: would remove backup ${entry.name}`);
      continue;
    }
    fs.unlinkSync(full);
    log(`removed backup ${entry.name}`);
  }
}

function countCronJobsFromJson(raw) {
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data.length;
    if (data && Array.isArray(data.jobs)) return data.jobs.length;
    return null;
  } catch {
    return null;
  }
}

function capStateSnapshots() {
  carryForwardSnapshotContext();
  const root = path.join(HERMES, 'state-snapshots');
  if (!fs.existsSync(root)) return;
  const dirs = fs
    .readdirSync(root)
    .map((name) => path.join(root, name))
    .filter((full) => fs.statSync(full).isDirectory())
    .map((full) => ({ full, mtime: fs.statSync(full).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const entry of dirs.slice(1)) {
    if (DRY_RUN) {
      log(`dry-run: would remove snapshot ${path.basename(entry.full)}`);
      continue;
    }
    fs.rmSync(entry.full, { recursive: true, force: true });
    log(`removed snapshot ${path.basename(entry.full)}`);
  }
}

function removeDuplicatePreUpdateSnapshots() {
  const root = path.join(HERMES, 'state-snapshots');
  if (!fs.existsSync(STATE_DB) || !fs.existsSync(root)) return;
  if (!dbHealthy()) {
    log('state.db unhealthy; skip duplicate pre-update snapshot removal');
    return;
  }
  const liveSize = fs.statSync(STATE_DB).size;
  for (const name of fs.readdirSync(root)) {
    if (!name.includes('pre-update')) continue;
    const snapDb = path.join(root, name, 'state.db');
    if (!fs.existsSync(snapDb)) continue;
    const snapSize = fs.statSync(snapDb).size;
    if (snapSize >= liveSize * 0.9) {
      carryForwardSnapshotContext();
      const full = path.join(root, name);
      if (DRY_RUN) {
        log(`dry-run: would remove duplicate pre-update snapshot ${name} (${Math.round(snapSize / 1024 / 1024)}MB)`);
        continue;
      }
      fs.rmSync(full, { recursive: true, force: true });
      log(`removed duplicate pre-update snapshot ${name} (${Math.round(snapSize / 1024 / 1024)}MB)`);
    }
  }
}

function rotateMasterClockLogs() {
  const dir = path.join(HOME, '.tnf-master-clock');
  if (!fs.existsSync(dir)) return;
  const files = fs
    .readdirSync(dir)
    .filter((name) => /^master-\d{4}-\d{2}-\d{2}\.jsonl$/.test(name))
    .map((name) => ({ name, full: path.join(dir, name), mtime: fs.statSync(path.join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const entry of files.slice(MASTER_CLOCK_KEEP)) {
    const gz = `${entry.full}.gz`;
    if (DRY_RUN) {
      log(`dry-run: would gzip ${entry.name}`);
      continue;
    }
    if (!fs.existsSync(gz)) {
      run(`gzip -f ${JSON.stringify(entry.full)}`);
      log(`gzipped ${entry.name}`);
    } else if (!DRY_RUN) {
      fs.unlinkSync(entry.full);
      log(`removed duplicate uncompressed ${entry.name}`);
    }
  }
}

function pruneMemoryBackups() {
  const dir = path.join(HERMES, 'memories');
  if (!fs.existsSync(dir)) return;
  const baks = fs
    .readdirSync(dir)
    .filter((name) => name.startsWith('MEMORY.md.bak.'))
    .map((name) => ({ name, full: path.join(dir, name), mtime: fs.statSync(path.join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const entry of baks.slice(MEMORY_BAK_KEEP)) {
    if (DRY_RUN) {
      log(`dry-run: would remove ${entry.name}`);
      continue;
    }
    fs.unlinkSync(entry.full);
    log(`removed ${entry.name}`);
  }
}

function removeStaleModelCacheTemps() {
  if (!fs.existsSync(HERMES)) return;
  for (const name of fs.readdirSync(HERMES)) {
    if (!name.startsWith('.models_dev_cache_') || !name.endsWith('.tmp')) continue;
    const full = path.join(HERMES, name);
    if (DRY_RUN) {
      log(`dry-run: would remove ${name}`);
      continue;
    }
    fs.unlinkSync(full);
    log(`removed ${name}`);
  }
}

function removeFailedMalformedBackups() {
  for (const name of fs.readdirSync(HERMES)) {
    if (!name.includes('malformed-backup')) continue;
    const full = path.join(HERMES, name);
    try {
      const size = fs.statSync(full).size;
      if (size === 0) {
        if (!DRY_RUN) fs.unlinkSync(full);
        log(`removed empty malformed backup ${name}`);
        continue;
      }
      const check = spawnSync('sqlite3', [full, 'PRAGMA integrity_check;'], { encoding: 'utf8' });
      const ok = (check.stdout || '').trim().split('\n')[0] === 'ok';
      if (!ok && size < 50 * 1024 * 1024) {
        if (!DRY_RUN) fs.unlinkSync(full);
        log(`removed corrupt malformed backup ${name} (${Math.round(size / 1024 / 1024)}MB)`);
      }
    } catch {
      // keep unknown backups
    }
  }
}

function main() {
  log(`start dryRun=${DRY_RUN} freeMb=${Math.round(freeDiskMb())}`);
  if (!dbHealthy()) {
    log('WARNING: state.db failed integrity_check — run: hermes sessions repair');
  }
  removeFailedMalformedBackups();
  removeDuplicatePreUpdateSnapshots();
  finalizeCronGhosts();
  finalizeStaleOpenCronSessions();
  pruneHermesSessions();
  capBackups();
  capStateSnapshots();
  rotateMasterClockLogs();
  pruneMemoryBackups();
  removeStaleModelCacheTemps();
  log(`complete freeMb=${Math.round(freeDiskMb())}`);
}

main();
