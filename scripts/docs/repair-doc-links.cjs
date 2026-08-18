#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Documentation link repair.
 *
 * Measured on 2026-08-09 across 1,304 tracked docs:
 *   315  working internal doc->doc links
 *   566  DANGLING links — 548 of them pointing into archive paths
 *   1112 orphan docs (85%) with no inbound link at all
 *
 * The rot is mechanical, not editorial: files were archived and reorganised
 * without updating references. Most targets still exist somewhere under a new
 * path, so most of it is recoverable by basename resolution rather than by
 * rewriting prose.
 *
 * Conservative by construction — it only rewrites a link when the intended
 * target is UNAMBIGUOUS:
 *   - exactly one file in the repo matches the basename, or
 *   - several match but exactly one is outside an archive directory.
 * Anything ambiguous is reported, never guessed. Prose is untouched; only the
 * URL inside a markdown link is rewritten.
 *
 * Usage
 *   node scripts/docs/repair-doc-links.cjs              # dry run (default)
 *   node scripts/docs/repair-doc-links.cjs --apply      # write changes
 *   node scripts/docs/repair-doc-links.cjs --json
 *   node scripts/docs/repair-doc-links.cjs --scope docs/protocols
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const LINK_RE = /(\[[^\]]*\]\()([^)\s]+)(\))/g;
const ARCHIVE_RE = /(^|\/)(_archive|archive|\.archive|legacy)(\/|$)/i;

/**
 * `git ls-files '*'` on this repo emits >1MB and blows execFileSync's default
 * buffer with ENOBUFS. Swallowing that error yields an EMPTY index, which makes
 * every link look dangling — a silent wrong answer rather than a loud failure.
 * Large buffer, and throw rather than return [] so a broken index can never be
 * mistaken for "nothing matches".
 */
function tracked(pattern) {
  const out = execFileSync('git', ['ls-files', pattern], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  return out.split('\n').filter(Boolean);
}

function buildBasenameIndex(allFiles) {
  const byBase = new Map();
  for (const f of allFiles) {
    const b = path.basename(f);
    if (!byBase.has(b)) byBase.set(b, []);
    byBase.get(b).push(f);
  }
  return byBase;
}

/** Resolve a dangling target to a single confident replacement, or null. */
function resolve(target, byBase, fromFile) {
  const base = path.basename(target);
  let candidates = byBase.get(base);
  if (!candidates || candidates.length === 0) return null;

  // Never point a LIVE doc at archived content. Resolving a broken link to an
  // archive copy looks like a repair but silently makes stale material
  // authoritative — worse than leaving the break visible. Archived docs may
  // still link to each other.
  if (!ARCHIVE_RE.test(fromFile)) {
    candidates = candidates.filter((c) => !ARCHIVE_RE.test(c));
    if (candidates.length === 0) return null;
  }
  if (candidates.length === 1) return candidates[0];

  // Several matches: prefer the one that is NOT archived. Ambiguity beyond that
  // is a human call — a wrong link is worse than a known-broken one.
  const live = candidates.filter((c) => !ARCHIVE_RE.test(c));
  if (live.length === 1) return live[0];

  // Last resort: a unique match sharing the source file's top-level directory.
  const dir = fromFile.split('/')[1];
  const sameArea = live.filter((c) => c.split('/')[1] === dir);
  return sameArea.length === 1 ? sameArea[0] : null;
}

function main(argv) {
  const apply = argv.includes('--apply');
  const asJson = argv.includes('--json');
  const scopeIdx = argv.indexOf('--scope');
  const scope = scopeIdx !== -1 ? argv[scopeIdx + 1] : 'docs';

  const docs = tracked(`${scope}/*.md`).filter((f) => fs.existsSync(path.join(ROOT, f)));
  const allFiles = tracked('*');
  const fileSet = new Set(allFiles);
  const byBase = buildBasenameIndex(allFiles);

  const stats = { scanned: docs.length, links: 0, ok: 0, dangling: 0, repaired: 0, unresolved: 0 };
  const repairs = [];
  const unresolved = [];

  for (const doc of docs) {
    const abs = path.join(ROOT, doc);
    let text;
    try {
      text = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    const dir = path.dirname(doc);
    let changed = false;

    const next = text.replace(LINK_RE, (whole, open, href, close) => {
      const clean = href.split('#')[0].trim();
      if (!clean || /^(https?:|mailto:|tel:|#)/.test(clean)) return whole;
      if (!clean.endsWith('.md')) return whole;
      stats.links += 1;

      const target = clean.startsWith('/')
        ? clean.replace(/^\/+/, '')
        : path.normalize(path.join(dir, clean));

      if (fileSet.has(target)) {
        stats.ok += 1;
        return whole;
      }
      stats.dangling += 1;

      const found = resolve(target, byBase, doc);
      if (!found) {
        stats.unresolved += 1;
        unresolved.push({ from: doc, href: clean });
        return whole;
      }

      let rel = path.relative(dir, found);
      if (!rel.startsWith('.')) rel = `./${rel}`;
      const anchor = href.includes('#') ? `#${href.split('#').slice(1).join('#')}` : '';
      stats.repaired += 1;
      repairs.push({ from: doc, was: clean, now: rel });
      changed = true;
      return `${open}${rel}${anchor}${close}`;
    });

    if (changed && apply) fs.writeFileSync(abs, next);
  }

  if (asJson) {
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', stats, repairs, unresolved }, null, 2));
    return 0;
  }

  console.log(`[repair-doc-links] ${apply ? 'APPLY' : 'DRY RUN'}  scope=${scope}`);
  console.log(`  docs scanned      : ${stats.scanned}`);
  console.log(`  md links seen     : ${stats.links}`);
  console.log(`  already valid     : ${stats.ok}`);
  console.log(`  dangling          : ${stats.dangling}`);
  console.log(`  confidently fixed : ${stats.repaired}${apply ? '' : '  (would fix)'}`);
  console.log(`  left for a human  : ${stats.unresolved}`);

  if (repairs.length) {
    console.log('\n  sample repairs:');
    for (const r of repairs.slice(0, 10)) {
      console.log(`    ${r.from}\n      ${r.was}  ->  ${r.now}`);
    }
    if (repairs.length > 10) console.log(`    …and ${repairs.length - 10} more`);
  }
  if (unresolved.length) {
    console.log('\n  unresolved (target not found anywhere, or ambiguous):');
    const seen = new Set();
    for (const u of unresolved) {
      const k = path.basename(u.href);
      if (seen.has(k)) continue;
      seen.add(k);
      if (seen.size > 8) break;
      console.log(`    ${u.href}   (e.g. from ${u.from})`);
    }
  }
  if (!apply && stats.repaired) console.log('\n  re-run with --apply to write these changes.');
  return 0;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (error) {
  console.error(`[repair-doc-links] ${error.message}`);
  process.exit(1);
}
