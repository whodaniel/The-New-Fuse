#!/usr/bin/env node
/**
 * rotate-runtime-logs.cjs — cap the size of long-lived service logs.
 *
 * WHY (2026-08-06)
 *   .agent/runtime-logs held 1.4 GB across five files, the largest 499 MB, all
 *   written continuously by services that had been up for days with no rotation
 *   configured anywhere. Combined with ~144 MB in relay-monitor, that is the
 *   component of disk usage that actually GROWS. The volume sat at 99% and git
 *   failed mid-commit with "unable to write new_index file" — a log file cost a
 *   commit.
 *
 * TRUNCATE IN PLACE, NEVER DELETE
 *   These files are held open by running processes. Deleting one frees nothing:
 *   the inode survives until the writer exits, so the space stays gone while
 *   `ls` shows the file missing — disk usage that cannot be found by looking.
 *   Rewriting through the same path (`cat tail > file`) keeps the descriptor
 *   valid and returns the blocks immediately.
 *
 *   A tail is preserved rather than zeroing, because a log truncated to nothing
 *   at the moment something breaks is worse than a large log.
 *
 * USAGE
 *   node scripts/protocols/rotate-runtime-logs.cjs            # rotate
 *   node scripts/protocols/rotate-runtime-logs.cjs --dry-run
 *   node scripts/protocols/rotate-runtime-logs.cjs --json
 *
 * EXIT  0 = ran (whether or not anything needed rotating) · 1 = could not run
 *   Finding nothing to rotate is success, not failure. A rotator that exits
 *   non-zero on a healthy system trains its operator to ignore it.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const HOME = os.homedir();
const DRY = process.argv.includes('--dry-run');
const JSON_OUT = process.argv.includes('--json');

/** Rotate above this; keep this much tail. Generous — the point is bounding
 *  unbounded growth, not micro-managing healthy logs. */
const MAX_BYTES = 50 * 1024 * 1024;
const KEEP_BYTES = 5 * 1024 * 1024;

const LOG_DIRS = [
  path.join(REPO, '.agent', 'runtime-logs'),
  path.join(HOME, '.tnf', 'relay-monitor', 'logs'),
  path.join(HOME, '.tnf', 'poll-jobs'),
  path.join(HOME, '.hermes', 'logs'),
];

function collect(dir, depth = 0) {
  const out = [];
  if (depth > 2 || !fs.existsSync(dir)) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collect(p, depth + 1));
    else if (/\.(log|out|err)$/.test(e.name)) out.push(p);
  }
  return out;
}

function main() {
  const present = LOG_DIRS.filter((d) => fs.existsSync(d));
  if (!present.length) {
    console.error('[rotate-runtime-logs] BLOCKED: none of the known log directories exist');
    process.exit(1);
  }

  const rotated = [];
  let reclaimed = 0;
  let scanned = 0;

  for (const file of present.flatMap((d) => collect(d))) {
    let size;
    try {
      size = fs.statSync(file).size;
    } catch {
      continue;
    }
    scanned += 1;
    if (size <= MAX_BYTES) continue;

    if (DRY) {
      rotated.push({ file: file.replace(HOME, '~'), before: size, after: KEEP_BYTES });
      reclaimed += size - KEEP_BYTES;
      continue;
    }

    try {
      const fd = fs.openSync(file, 'r');
      const buf = Buffer.alloc(KEEP_BYTES);
      const read = fs.readSync(fd, buf, 0, KEEP_BYTES, Math.max(0, size - KEEP_BYTES));
      fs.closeSync(fd);
      // Open for write (not append) truncates through the same path, so any
      // process holding this file open keeps writing to the same inode.
      fs.writeFileSync(file, buf.subarray(0, read));
      const after = fs.statSync(file).size;
      rotated.push({ file: file.replace(HOME, '~'), before: size, after });
      reclaimed += size - after;
    } catch (err) {
      rotated.push({ file: file.replace(HOME, '~'), before: size, error: err.message });
    }
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(0);

  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: true, dryRun: DRY, scanned, rotated, reclaimedBytes: reclaimed }, null, 2));
  } else {
    console.log(`\n[rotate-runtime-logs] scanned ${scanned} log file(s) across ${present.length} dir(s)\n`);
    for (const r of rotated) {
      if (r.error) console.log(`  FAILED  ${r.file}: ${r.error}`);
      else console.log(`  ${DRY ? 'would rotate' : 'rotated'}  ${r.file}  ${mb(r.before)}M -> ${mb(r.after)}M`);
    }
    console.log(
      rotated.length
        ? `\n  ${DRY ? 'would reclaim' : 'reclaimed'} ${mb(reclaimed)}MB\n`
        : `  OK: nothing above ${mb(MAX_BYTES)}MB\n`
    );
  }
  process.exit(0);
}

main();
