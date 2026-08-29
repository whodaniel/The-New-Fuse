#!/usr/bin/env node
'use strict';

/**
 * Resolve the TNF monorepo checkout used by host wrappers (tnf-status,
 * update-from-latest) and runtime tools.
 *
 * ============================================================================
 * CANONICAL RESOLVER CONTRACT (v2 — see docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md)
 * ============================================================================
 * This is the one algorithm; scripts/lib/resolve-tnf-repo.sh is the shell
 * twin and MUST implement the identical contract (parity enforced by
 * scripts/tests/resolve-tnf-repo.test.cjs + resolve-tnf-repo.test.sh).
 *
 * A candidate directory is authoritative ("has authority") only if it passes
 * ALL of:
 *   (a) marker file present  — scripts/runtime/tnf-status.cjs (status-authority
 *       tier) or package.json name + SESSION_HANDOFF_LATEST.json (soft tier)
 *   (b) live git work tree   — `git -C <dir> rev-parse --is-inside-work-tree`
 *       succeeds. Rejects orphaned/broken worktrees (a linked worktree whose
 *       main checkout was renamed/removed keeps its tracked files on disk
 *       but can no longer be operated on with git at all — confirmed in
 *       production: ~/Repos/tnf-monorepo). File-existence alone does NOT
 *       imply this; both checks are required.
 *   (c) canonical remote identity — `git -C <dir> remote get-url origin`
 *       normalizes to whodaniel/tnf-monorepo (case-insensitive, tolerating
 *       .git suffix and https/ssh form). This is what TURN_ZERO_MANDATE.md
 *       calls the canonical development repository; whodaniel/The-New-Fuse
 *       and whodaniel/fuse-control-plane are downstream PUBLICATION targets
 *       — "do not develop directly" in either, per that mandate. A checkout
 *       whose origin is a publication target, or an unrelated repo, is
 *       rejected here even if it happens to carry the marker files (e.g. via
 *       shared history). This is what prevents silent fallback to a
 *       repo-shaped-but-wrong checkout.
 *
 * Explicitly NOT part of the contract: directory basename. Nothing here
 * pattern-matches on a path containing "tnf-monorepo" or "The-New-Fuse" —
 * (b) and (c) are the only trust signals; a correctly-named directory with
 * broken git or the wrong remote is still rejected, and a correctly-working
 * checkout under any other name is still accepted.
 *
 * Resolution order (first hit wins, deterministic):
 *   1. explicit argument (validated, not blindly trusted)
 *   2. TNF_REPO_DIR / TNF_ROOT_DIR / TNF_REPO env vars, in that priority
 *      (TNF_ROOT_DIR is the pre-existing convention used by ~70 other
 *      scripts in this repo, e.g. tnf-director-loop.cjs; recognized here
 *      for compatibility, not preferred over TNF_REPO_DIR)
 *   3. ~/.tnf/repo-root pointer (written by install-tnf-host-wrappers)
 *   4. well-known checkout candidates (best-effort convenience only — not
 *      portable to other users' machines; harmless to keep because every
 *      candidate is still fully validated against (a)(b)(c) above)
 *   5. walk up from cwd / this module's own directory looking for a
 *      directory satisfying (a)(b)(c)
 *
 * Rejection is deterministic: a candidate either fully satisfies (a)(b)(c)
 * or it is skipped entirely — no partial credit, no "close enough" fallback.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const HOME = os.homedir();
const POINTER_PATH = path.join(HOME, '.tnf', 'repo-root');

const AUTHORITY_MARKERS = [
  'scripts/runtime/tnf-status.cjs',
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
];

// The canonical development repository per TURN_ZERO_MANDATE.md.
// whodaniel/The-New-Fuse and whodaniel/fuse-control-plane are downstream
// PUBLICATION targets, not canonical dev repos — a checkout whose origin
// normalizes to either of those is rejected by isCanonicalOrigin(), the
// same as any unrelated repo.
const CANONICAL_ORIGIN_SLUG = 'whodaniel/tnf-monorepo';

function isPackageRoot(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return pkg.name === 'the-new-fuse' || pkg.name === '@the-new-fuse/monorepo';
  } catch {
    return false;
  }
}

// A candidate can have every marker file physically present in its working
// tree and still be worthless: an orphaned/broken git worktree (e.g. a
// linked worktree whose main checkout got renamed or removed) keeps its
// tracked files on disk but can no longer be operated on with git at all.
// File-existence checks alone were fooled by exactly this case in practice
// (~/Repos/tnf-monorepo) — see docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md.
// This check is what closes that gap.
function isLiveGitWorkTree(dir) {
  try {
    const out = execFileSync('git', ['-C', dir, 'rev-parse', '--is-inside-work-tree'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return out === 'true';
  } catch {
    return false;
  }
}

// Normalize a git remote URL to "owner/repo" for comparison, tolerating
// https://github.com/owner/repo.git, git@github.com:owner/repo.git, and
// bare owner/repo forms, case-insensitively.
function normalizeOriginSlug(url) {
  if (!url) return null;
  let s = String(url).trim();
  s = s.replace(/\.git$/i, '');
  s = s.replace(/^git@[^:]+:/i, '');
  s = s.replace(/^https?:\/\/[^/]+\//i, '');
  s = s.replace(/^\/+|\/+$/g, '');
  return s.toLowerCase() || null;
}

// See CANONICAL_ORIGIN_SLUG above — this is contract element (c).
function isCanonicalOrigin(dir) {
  try {
    const out = execFileSync('git', ['-C', dir, 'remote', 'get-url', 'origin'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return normalizeOriginSlug(out) === CANONICAL_ORIGIN_SLUG;
  } catch {
    return false;
  }
}

function hasAuthority(dir) {
  if (!dir || typeof dir !== 'string') return false;
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
  } catch {
    return false;
  }
  if (!isLiveGitWorkTree(dir)) return false;
  if (!isCanonicalOrigin(dir)) return false;
  // Prefer checkouts that still carry the status authority file.
  if (fs.existsSync(path.join(dir, AUTHORITY_MARKERS[0]))) return true;
  // Accept a valid monorepo root even if status authority is temporarily absent
  // so wrappers can still surface a useful error from that checkout.
  if (isPackageRoot(dir) && fs.existsSync(path.join(dir, AUTHORITY_MARKERS[1]))) return true;
  return false;
}

function hasStatusAuthority(dir) {
  if (!dir || !fs.existsSync(path.join(dir, AUTHORITY_MARKERS[0]))) return false;
  return isLiveGitWorkTree(dir) && isCanonicalOrigin(dir);
}

function readPointer() {
  try {
    const raw = fs.readFileSync(POINTER_PATH, 'utf8').trim();
    return raw || null;
  } catch {
    return null;
  }
}

function writePointer(repoRoot) {
  if (!repoRoot || !hasAuthority(repoRoot)) return false;
  try {
    fs.mkdirSync(path.dirname(POINTER_PATH), { recursive: true });
    fs.writeFileSync(POINTER_PATH, `${path.resolve(repoRoot)}\n`, 'utf8');
    return true;
  } catch {
    return false;
  }
}

function wellKnownCandidates() {
  return [
    path.join(HOME, 'Repos', 'tnf-monorepo'),
    path.join(HOME, 'Desktop', 'A1-Inter-LLM-Com', 'TNF', 'The-New-Fuse'),
    path.join(HOME, 'Desktop', 'A1-Inter-LLM-Com', 'The-New-Fuse'),
    path.join(HOME, '.tnf-cli', 'fuse'),
  ];
}

function walkAncestors(startDir) {
  const out = [];
  let current = path.resolve(startDir);
  while (true) {
    out.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return out;
}

/**
 * @param {string | null | undefined} explicit
 * @param {{ preferStatusAuthority?: boolean, writePointerOnHit?: boolean }} [opts]
 * @returns {string | null}
 */
function resolveTnfRepo(explicit, opts = {}) {
  const preferStatus = opts.preferStatusAuthority !== false;
  const writeOnHit = opts.writePointerOnHit === true;

  /** @type {string[]} */
  const ordered = [];
  const push = (value) => {
    if (!value || typeof value !== 'string') return;
    const resolved = path.resolve(value);
    if (!ordered.includes(resolved)) ordered.push(resolved);
  };

  push(explicit);
  push(process.env.TNF_REPO_DIR);
  push(process.env.TNF_ROOT_DIR);
  push(process.env.TNF_REPO);
  push(readPointer());
  for (const c of wellKnownCandidates()) push(c);
  push(process.cwd());
  for (const seed of [process.cwd(), __dirname]) {
    for (const ancestor of walkAncestors(seed)) push(ancestor);
  }

  let softHit = null;
  for (const candidate of ordered) {
    if (preferStatus && hasStatusAuthority(candidate)) {
      if (writeOnHit) writePointer(candidate);
      return candidate;
    }
    if (!softHit && hasAuthority(candidate)) softHit = candidate;
  }

  if (softHit) {
    if (writeOnHit) writePointer(softHit);
    return softHit;
  }
  return null;
}

function statusAuthorityPath(repoRoot) {
  if (!repoRoot) return null;
  return path.join(repoRoot, 'scripts', 'runtime', 'tnf-status.cjs');
}

module.exports = {
  POINTER_PATH,
  AUTHORITY_MARKERS,
  CANONICAL_ORIGIN_SLUG,
  isPackageRoot,
  isLiveGitWorkTree,
  isCanonicalOrigin,
  normalizeOriginSlug,
  hasAuthority,
  hasStatusAuthority,
  readPointer,
  writePointer,
  wellKnownCandidates,
  resolveTnfRepo,
  statusAuthorityPath,
};
