#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Triage diverged skill names — same name, different content.
 *
 * The Tier-0 manifest reports 71 diverged names, but a raw count conflates two
 * very different situations, and only one of them ever needed a decision:
 *
 *   PERMANENT roots        .agent/skills/, .skills/       authoritative
 *   SNAPSHOT roots         .agent/skill-bank/snapshots/*  point-in-time captures
 *
 * `skill-governance-check.cjs` PROMOTES snapshots to permanent, so a snapshot
 * differing from its permanent counterpart is the system working — the snapshot
 * is simply older. What actually breaks resolution is two PERMANENT copies of
 * one name disagreeing: nothing decides which an agent gets.
 *
 * Verdicts
 *   CONFLICT   2+ distinct bodies across permanent copies    -> resolved by precedence
 *   STALE-SNAP permanent copies agree; a snapshot differs    -> expected drift
 *   SNAP-ONLY  exists only in snapshots                      -> not authoritative
 *
 * A CONFLICT is reported, not failed. When this tool was written they were
 * undefined — nothing decided which copy an agent got. `ROOT_PRECEDENCE` in
 * `build-skill-manifest.cjs` now resolves every one deterministically, and the
 * manifest publishes the winning path per name. They remain worth surfacing
 * (two permanent copies genuinely disagree) but they are no longer a defect,
 * so this exits 0. Only a hard error exits non-zero.
 *
 * Usage
 *   node scripts/skills/triage-skill-divergence.cjs
 *   node scripts/skills/triage-skill-divergence.cjs --json
 *   node scripts/skills/triage-skill-divergence.cjs --conflicts   # skip the snapshot summary
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const NAME_RE = /^name:\s*["']?([^"'\n]+)/m;
const SNAPSHOT_RE = /(^|\/)skill-bank\/snapshots\//;

function tracked(pattern) {
  return execFileSync('git', ['ls-files', pattern], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
    .split('\n')
    .filter(Boolean);
}

const cleanName = (raw) =>
  raw.split(/\s+(?:description|allowed-tools|version|license):/i)[0].trim().slice(0, 80);

const dedupKey = (n) => n.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');

/**
 * Hash the BODY, not the whole file. Frontmatter carries governance keys that
 * legitimately differ per root (a promoted copy gains `category`, `risk_tier`),
 * and counting those as content divergence would report conflicts that are
 * actually correct promotions.
 */
function bodyHash(text) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '');
  return crypto.createHash('sha256').update(body.trim()).digest('hex').slice(0, 12);
}

function main(argv) {
  const asJson = argv.includes('--json');
  const onlyConflicts = argv.includes('--conflicts');

  const byName = new Map();
  for (const f of tracked('*SKILL.md')) {
    const abs = path.join(ROOT, f);
    let text;
    try {
      text = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    const raw = (NAME_RE.exec(text) || [])[1]?.trim() || path.basename(path.dirname(f));
    const key = dedupKey(cleanName(raw));
    if (!key) continue;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push({ file: f, hash: bodyHash(text), snapshot: SNAPSHOT_RE.test(f) });
  }

  const conflicts = [];
  const staleSnaps = [];
  const snapOnly = [];

  for (const [name, copies] of byName) {
    if (copies.length < 2) continue;
    const distinct = new Set(copies.map((c) => c.hash));
    if (distinct.size < 2) continue; // identical bodies — not divergence

    const permanent = copies.filter((c) => !c.snapshot);
    const permHashes = new Set(permanent.map((c) => c.hash));

    if (permanent.length === 0) {
      snapOnly.push({ name, copies: copies.length });
    } else if (permHashes.size > 1) {
      conflicts.push({
        name,
        variants: permHashes.size,
        files: permanent.map((c) => `${c.hash}  ${c.file}`),
      });
    } else {
      staleSnaps.push({ name, snapshots: copies.length - permanent.length });
    }
  }

  const result = {
    divergedNames: conflicts.length + staleSnaps.length + snapOnly.length,
    conflicts: conflicts.length,
    staleSnapshots: staleSnaps.length,
    snapshotOnly: snapOnly.length,
  };

  if (asJson) {
    console.log(JSON.stringify({ ...result, detail: { conflicts, staleSnaps, snapOnly } }, null, 2));
    return 0;
  }

  console.log('[skill-divergence] body-level triage (frontmatter excluded)\n');
  console.log(`  diverged names        : ${result.divergedNames}`);
  console.log(`  CONFLICT              : ${result.conflicts}   permanent copies disagree — resolved by ROOT_PRECEDENCE`);
  console.log(`  stale snapshot        : ${result.staleSnapshots}   expected — promotion lag`);
  console.log(`  snapshot-only         : ${result.snapshotOnly}   not authoritative`);

  if (conflicts.length) {
    console.log('\n  CONFLICTS — resolved by ROOT_PRECEDENCE; see the manifest for the winning path:\n');
    for (const c of conflicts) {
      console.log(`    ${c.name}  (${c.variants} distinct bodies)`);
      for (const f of c.files) console.log(`      ${f}`);
    }
  } else {
    console.log('\n  No permanent-root conflicts. Remaining divergence is promotion lag.');
  }

  if (!onlyConflicts && staleSnaps.length) {
    console.log(`\n  Stale snapshots (${staleSnaps.length}) resolve on the next promotion sweep.`);
  }
  return 0;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (error) {
  console.error(`[skill-divergence] ${error.message}`);
  process.exit(1);
}
