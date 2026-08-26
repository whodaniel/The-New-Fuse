#!/usr/bin/env node
'use strict';

/**
 * Resolve the TNF monorepo checkout used by host wrappers (tnf-status,
 * update-from-latest) and runtime tools.
 *
 * Why this exists: issue #176 made ~/.tnf/tnf-status a thin wrapper that only
 * looked at ~/Repos/tnf-monorepo. That fails when:
 *   - the worktree is broken / incomplete
 *   - the operator's live checkout is elsewhere (e.g. Desktop/.../TNF/The-New-Fuse)
 *   - a feature branch lacks scripts/runtime/tnf-status.cjs
 *
 * Resolution order (first hit wins):
 *   1. explicit argument
 *   2. TNF_REPO_DIR / TNF_REPO
 *   3. ~/.tnf/repo-root pointer (written by install-tnf-host-wrappers)
 *   4. well-known checkout candidates
 *   5. walk up from cwd / this module looking for package.json name the-new-fuse
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME = os.homedir();
const POINTER_PATH = path.join(HOME, '.tnf', 'repo-root');

const AUTHORITY_MARKERS = [
  'scripts/runtime/tnf-status.cjs',
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
];

function isPackageRoot(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return pkg.name === 'the-new-fuse' || pkg.name === '@the-new-fuse/monorepo';
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
  // Prefer checkouts that still carry the status authority file.
  if (fs.existsSync(path.join(dir, AUTHORITY_MARKERS[0]))) return true;
  // Accept a valid monorepo root even if status authority is temporarily absent
  // so wrappers can still surface a useful error from that checkout.
  if (isPackageRoot(dir) && fs.existsSync(path.join(dir, AUTHORITY_MARKERS[1]))) return true;
  return false;
}

function hasStatusAuthority(dir) {
  return Boolean(dir) && fs.existsSync(path.join(dir, AUTHORITY_MARKERS[0]));
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
  isPackageRoot,
  hasAuthority,
  hasStatusAuthority,
  readPointer,
  writePointer,
  wellKnownCandidates,
  resolveTnfRepo,
  statusAuthorityPath,
};
