#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Hermes + operator-home state retention (safe consolidation).
 * - Finalizes empty cron ghost sessions, prunes old cron rows, VACUUMs state.db
 * - Caps pre-update backups and state-snapshots
 * - Rotates master-clock daily JSONL logs
 * Never deletes memories/, memory_store.db, config, or auth.
 */
const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME = os.homedir();
const HERMES = path.join(HOME, '.hermes');
const STATE_DB = path.join(HERMES, 'state.db');
const BACKUP_KEEP = Number.parseInt(process.env.TNF_HERMES_BACKUP_KEEP || '1', 10);
const CRON_PRUNE_DAYS = Number.parseInt(process.env.TNF_HERMES_CRON_PRUNE_DAYS || '7', 10);
const MASTER_CLOCK_KEEP = Number.parseInt(process.env.TNF_MASTER_CLOCK_DAILY_KEEP || '7', 10);
const MEMORY_BAK_KEEP = Number.parseInt(process.env.TNF_HERMES_MEMORY_BAK_KEEP || '3', 10);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.TNF_HERMES_RETENTION_DRY_RUN || '');

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

function sqlite(query) {
  if (!fs.existsSync(STATE_DB)) return null;
  const oneLine = query.replace(/\s+/g, ' ').trim();
  return run(`sqlite3 ${JSON.stringify(STATE_DB)} ${JSON.stringify(oneLine)}`);
}

function finalizeCronGhosts() {
  if (!fs.existsSync(STATE_DB)) {
    log('state.db missing; skip cron ghost finalize');
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

function pruneHermesSessions() {
  if (!fs.existsSync(STATE_DB)) return;
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
  try {
    runHermes(['sessions', 'optimize']);
    log('sessions optimize complete');
  } catch (error) {
    log(`sessions optimize skipped: ${error.message}`);
  }
  try {
    const sizeBefore = fs.statSync(STATE_DB).size;
    if (sizeBefore > 2 * 1024 * 1024 * 1024) {
      sqlite('VACUUM;');
      const sizeAfter = fs.statSync(STATE_DB).size;
      log(`sqlite VACUUM: ${Math.round(sizeBefore / 1024 / 1024)}MB -> ${Math.round(sizeAfter / 1024 / 1024)}MB`);
    }
  } catch (error) {
    log(`sqlite VACUUM skipped: ${error.message}`);
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
    if (DRY_RUN) {
      log(`dry-run: would remove backup ${entry.name}`);
      continue;
    }
    fs.unlinkSync(full);
    log(`removed backup ${entry.name}`);
  }
  for (const name of ['tmp8sw566py.db-journal', 'tmpmkau9z93.db-journal', 'tmpv6ss1yhb.db-journal', 'tmpw2rwj3x_.db-journal']) {
    const full = path.join(dir, name);
    if (fs.existsSync(full)) {
      if (!DRY_RUN) fs.unlinkSync(full);
      log(`removed stale journal ${name}`);
    }
  }
}

function capStateSnapshots() {
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

function main() {
  log(`start dryRun=${DRY_RUN}`);
  finalizeCronGhosts();
  pruneHermesSessions();
  capBackups();
  capStateSnapshots();
  rotateMasterClockLogs();
  pruneMemoryBackups();
  removeStaleModelCacheTemps();
  log('complete');
}

main();
