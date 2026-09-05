#!/usr/bin/env node
/**
 * check-workspace-lease.cjs — makes TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL's
 * final "proposed" checklist row real: warn on writes outside a declared
 * lease.
 *
 * The policy (docs/protocols/agent-workspace-policy.json) already says
 * multi-file work in the shared tree is "shared-leased" tier and declares
 * requireLeaseForPaths. Until now nothing checked the lease side: an agent
 * could sit on `apps/**` for hours while another agent edits the same files,
 * and the only signal was a stale-read or a lost write. This closes that gap
 * the same way resolve-workspace-tier.cjs closes its gap — by telling the
 * agent BEFORE/DURING work, not by retroactively blocking a hook-invisible
 * mutation.
 *
 * A lease is a row in docs/protocols/workspace-leases.json:
 *   { "agent": "codex", "task": "…", "paths": ["apps/frontend/src/**"],
 *     "acquiredAt": "2026-09-05T11:00:00.000Z", "ttlMinutes": 240 }
 * The commit that adds the row is the broadcast (R3); the lease dies at
 * acquiredAt + ttlMinutes, or when the row is removed.
 *
 * Usage
 *   node scripts/harness/check-workspace-lease.cjs [--json] [--enforce]
 *        [--agent <id>] [--lease-file <path>]
 *
 * Checks the CURRENT dirty set (unstaged + staged + untracked, sampled) for
 * overlap with ACTIVE leases held by OTHER agents. Your own leases never
 * violate against you. Exited leases are inert.
 *
 * Exit codes: 0 = no overlap (or advisory mode). 1 = overlap AND --enforce
 * (or env TNF_WORKSPACE_LEASE_ENFORCE=1). 0 on any internal error — this
 * tool, like the mutation guard, must never be the reason git fails.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function findRepoRoot() {
  let current = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(current, 'docs', 'protocols', 'agent-workspace-policy.json'))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return null;
}

function parseArgs(argv) {
  const opts = {
    json: false, enforce: false, agent: null, leaseFile: null,
    stagedOnly: false, gate: false, claim: null, ttlMin: null, task: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--enforce') opts.enforce = true;
    else if (a === '--agent') opts.agent = argv[++i];
    else if (a === '--lease-file') opts.leaseFile = argv[++i];
    else if (a === '--staged') opts.stagedOnly = true;
    else if (a === '--gate') opts.gate = true;
    else if (a === '--claim') opts.claim = argv[++i];
    else if (a === '--ttl-min') opts.ttlMin = argv[++i];
    else if (a === '--task') opts.task = argv[++i];
  }
  return opts;
}

/**
 * Minimal glob: `**` spans path segments, `*` spans one segment's chars.
 * A pattern with NO wildcard is a scope prefix: it matches the path itself
 * and everything beneath it (lease scopes are directories: "apps/frontend"
 * means the whole subtree).
 */
function matchPath(pattern, filePath) {
  const hasWildcard = pattern.includes('*');
  const pSegs = pattern.split('/');
  const fSegs = filePath.split('/');
  function match(pi, fi) {
    while (pi < pSegs.length) {
      const seg = pSegs[pi];
      if (seg === '**') {
        if (pi === pSegs.length - 1) return true; // trailing ** eats the rest
        for (let skip = fi; skip <= fSegs.length; skip += 1) {
          if (match(pi + 1, skip)) return true;
        }
        return false;
      }
      if (fi >= fSegs.length) return false;
      if (seg.includes('*')) {
        const re = new RegExp(`^${seg.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}$`);
        if (!re.test(fSegs[fi])) return false;
      } else if (seg !== fSegs[fi]) {
        return false;
      }
      pi += 1;
      fi += 1;
    }
    // Pattern fully consumed: glob patterns require an exact match, plain
    // directory/file scopes extend to everything beneath them.
    return hasWildcard ? fi === fSegs.length : true;
  }
  return match(0, 0);
}

function isExpired(lease, now) {
  const acquired = Date.parse(String(lease.acquiredAt || ''));
  if (Number.isNaN(acquired)) return true; // malformed lease claims nothing
  const ttl = Number.isFinite(Number(lease.ttlMinutes)) ? Number(lease.ttlMinutes) : 240;
  return now >= acquired + ttl * 60_000;
}

function activeLeases(leases, now) {
  return (Array.isArray(leases) ? leases : []).filter((l) => l && !isExpired(l, now));
}

function gitLines(args, cwd, cap) {
  try {
    const out = execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, cap);
  } catch {
    return [];
  }
}

function currentDirtyPaths(repoRoot, cap) {
  const dirty = new Set();
  for (const p of gitLines(['diff', '--name-only', 'HEAD'], repoRoot, cap)) dirty.add(p);
  for (const p of gitLines(['diff', '--name-only', '--cached'], repoRoot, cap)) dirty.add(p);
  for (const p of gitLines(['ls-files', '--others', '--exclude-standard'], repoRoot, cap)) dirty.add(p);
  return [...dirty].slice(0, cap);
}

/** Paths in the index only — the set a commit will actually carry. */
function currentStagedPaths(repoRoot, cap) {
  return gitLines(['diff', '--cached', '--name-only'], repoRoot, cap);
}

/**
 * Registry writer for docs/protocols/workspace-leases.json. Appends a row
 * (agent + path scopes + TTL); replaces any prior row held by the same agent
 * for the same scope so re-claiming is idempotent. Fail-closed to the CALLER:
 * throws on unwritable registry; callers in hooks must catch and fail open.
 */
function acquireLeases(repoRoot, opts, now) {
  const leaseFile = opts.leaseFile || path.join(repoRoot, 'docs', 'protocols', 'workspace-leases.json');
  const paths = (opts.paths || []).map((p) => String(p).trim()).filter(Boolean);
  if (!paths.length) throw new Error('acquireLeases: no paths given');
  const agent = opts.agent || process.env.TNF_AGENT_ID || process.env.TNF_AGENT_NAME || process.env.USER || 'unknown';
  let parsed = { schemaVersion: 1, leases: [] };
  try {
    parsed = JSON.parse(fs.readFileSync(leaseFile, 'utf8'));
    if (!Array.isArray(parsed.leases)) parsed.leases = [];
  } catch (err) {
    if (fs.existsSync(leaseFile)) throw new Error(`acquireLeases: registry unreadable: ${err.message}`);
  }
  const key = (list) => [...list].sort().join('\u0000');
  parsed.leases = parsed.leases.filter(
    (l) => !(String(l.agent) === String(agent) && key(l.paths || []) === key(paths)),
  );
  const row = {
    agent,
    task: opts.task || null,
    paths,
    acquiredAt: new Date(now || Date.now()).toISOString(),
    ttlMinutes: Number.isFinite(Number(opts.ttlMinutes)) ? Number(opts.ttlMinutes) : 120,
  };
  parsed.leases.push(row);
  parsed.schemaVersion = parsed.schemaVersion || 1;
  fs.mkdirSync(path.dirname(leaseFile), { recursive: true });
  fs.writeFileSync(leaseFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  return row;
}

function check(repoRoot, opts, now) {
  const leaseFile = opts.leaseFile || path.join(repoRoot, 'docs', 'protocols', 'workspace-leases.json');
  const agent = opts.agent || process.env.TNF_AGENT_ID || process.env.TNF_AGENT_NAME || process.env.USER || 'unknown';
  let leases = [];
  let leaseError = null;
  try {
    const parsed = JSON.parse(fs.readFileSync(leaseFile, 'utf8'));
    leases = Array.isArray(parsed.leases) ? parsed.leases : [];
  } catch (err) {
    leaseError = err.message;
  }

  const dirtyPaths = opts.stagedOnly
    ? currentStagedPaths(repoRoot, 500)
    : currentDirtyPaths(repoRoot, 500);
  const active = activeLeases(leases, now || Date.now());
  const violations = [];
  for (const lease of active) {
    if (String(lease.agent || '') === String(agent)) continue; // your own lease never violates you
    const hits = dirtyPaths.filter((p) => (lease.paths || []).some((pat) => matchPath(pat, p)));
    if (hits.length) violations.push({ agent: lease.agent, task: lease.task || null, paths: lease.paths, overlaps: hits.slice(0, 20) });
  }

  return {
    checkedAt: new Date(now || Date.now()).toISOString(),
    agent,
    leaseFile: path.relative(repoRoot, leaseFile),
    leaseError,
    dirtyCount: dirtyPaths.length,
    dirtySample: dirtyPaths.slice(0, 20),
    activeLeases: active.map((l) => ({ agent: l.agent, task: l.task || null, paths: l.paths, ttlMinutes: l.ttlMinutes ?? 240 })),
    violations,
    guidance: violations.length
      ? `Your dirty set overlaps a lease held by another agent (${[...new Set(violations.map((v) => v.agent))].join(', ')}). Coordinate, take over the lease in ${path.relative(repoRoot, leaseFile)}, or move your work to a leased-free scope / worktree (resolve-workspace-tier.cjs --provision). Commit at the next stage boundary (R3).`
      : 'No overlap between the current dirty set and any other agent\'s active lease.',
  };
}

function main(argv) {
  const opts = parseArgs(argv);
  const repoRoot = findRepoRoot();
  if (!repoRoot) {
    console.error('[check-workspace-lease] policy file not found from cwd; failing open.');
    return 0;
  }
  const enforce = opts.enforce
    || opts.gate && process.env.TNF_WORKSPACE_LEASE_GATE !== 'advisory'
    || (!opts.gate && process.env.TNF_WORKSPACE_LEASE_ENFORCE === '1');
  let result;
  try {
    result = check(repoRoot, opts, Date.now());
  } catch (err) {
    console.error(`[check-workspace-lease] internal error, failing open: ${err.message}`);
    return 0;
  }
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[check-workspace-lease] agent=${result.agent} ${opts.stagedOnly ? 'staged' : 'dirty'}=${result.dirtyCount} active-leases=${result.activeLeases.length}${result.leaseError ? ` (lease file unreadable: ${result.leaseError})` : ''}`);
    for (const v of result.violations) {
      console.log(`  ⚠ overlap with ${v.agent}${v.task ? ` (${v.task})` : ''}: ${v.overlaps.slice(0, 5).join(', ')}${v.overlaps.length > 5 ? ` … +${v.overlaps.length - 5} more` : ''}`);
    }
    console.log(`  ${result.violations.length ? '⚠' : '✓'} ${result.guidance}`);
  }
  if (result.violations.length && enforce) {
    if (opts.gate) console.error(`[check-workspace-lease] BLOCKED (staged): another agent's active lease covers staged paths (${[...new Set(result.violations.map((v) => v.agent))].join(', ')}). Wait for TTL expiry, take over the lease row, or set TNF_WORKSPACE_LEASE_GATE=advisory for this commit.`);
    return 1;
  }
  return 0;
}

function runClaim(argv) {
  const opts = parseArgs(argv);
  const repoRoot = findRepoRoot();
  if (!repoRoot) {
    console.error('[check-workspace-lease] policy file not found from cwd; claim not recorded.');
    return 1;
  }
  const paths = String(opts.claim || '').split(',').map((s) => s.trim()).filter(Boolean);
  try {
    const row = acquireLeases(repoRoot, {
      agent: opts.agent, paths, ttlMinutes: opts.ttlMin, task: opts.task, leaseFile: opts.leaseFile,
    });
    console.log(`[check-workspace-lease] claimed ${row.paths.join(', ')} for ${row.agent} (ttl ${row.ttlMinutes}m)`);
    console.log('[check-workspace-lease] commit docs/protocols/workspace-leases.json to broadcast the claim (R3).');
    return 0;
  } catch (err) {
    console.error(`[check-workspace-lease] claim failed: ${err.message}`);
    return 1;
  }
}

module.exports = { matchPath, activeLeases, check, isExpired, acquireLeases, currentStagedPaths, parseArgs };

if (require.main === module) {
  try {
    const argv = process.argv.slice(2);
    if (argv.includes('--claim')) {
      process.exit(runClaim(argv));
    }
    process.exit(main(argv));
  } catch (err) {
    console.error(`[check-workspace-lease] internal error, failing open: ${err.message}`);
    process.exit(0);
  }
}
