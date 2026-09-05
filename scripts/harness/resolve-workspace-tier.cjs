#!/usr/bin/env node
/**
 * resolve-workspace-tier.cjs — makes TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL's
 * §5 "Turn Zero: resolve task class → tier; refuse Tier 4 work in a shared
 * tree" real. That row was listed as "proposed" with nothing implementing it,
 * which is why the shared checkout has now lost uncommitted work to a
 * HEAD-moving mutation twice (2026-08-09, 2026-08-27) despite the protocol
 * documenting exactly this failure mode after the first incident. A
 * well-designed policy nobody consults protects nothing.
 *
 * This does not (and per workspace-mutation-guard.cjs's own documented
 * limits, cannot) block a `git checkout -f` from happening — that guard
 * already covers what a reflog hook CAN see (stash/reset/merge/rebase) and
 * is explicit that `checkout -f` is invisible to it. This script closes the
 * complementary gap: telling an agent, BEFORE it starts, which workspace
 * tier its task actually requires, so multi-file / risky work is never
 * sitting in the shared tree as a target in the first place.
 *
 * Usage
 *   node scripts/harness/resolve-workspace-tier.cjs --task-class <class> [--json]
 *   node scripts/harness/resolve-workspace-tier.cjs --describe "<free text>" [--json]
 *   node scripts/harness/resolve-workspace-tier.cjs --describe "<text>" --provision [--json]
 *
 * --provision closes the loop the guidance used to leave dangling: when the
 * tier requires a worktree, it actually creates one (idempotent, disk
 * preflight-gated) via the existing `tnf worktree create` primitive, falling
 * back to a plain `git worktree add` when the CLI build is unavailable. It is
 * deliberately a NO-OP for the `clone` tier (branch-maintenance/history-rewrite
 * need a separate clone, which a caller must provision deliberately) and for
 * shared tiers (no worktree needed). Provision failures never change the exit
 * code — this tool is advisory (see --enforce); a failed provision is reported,
 * not fatal.
 *
 * --task-class must match a key in docs/protocols/agent-workspace-policy.json
 * byTaskClass. --describe does lightweight keyword matching as a fallback for
 * callers that don't know the taxonomy yet (best-effort, not authoritative —
 * prefer --task-class).
 *
 * Exit codes: 0 = shared tree is fine for this task. 1 = policy says a
 * worktree/clone is required and cwd is the shared checkout (advisory by
 * default — see --enforce). 2 = usage/policy-read error (fails open: prints
 * a warning, does not block).
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

function loadPolicy(repoRoot) {
  const policyPath = path.join(repoRoot, 'docs', 'protocols', 'agent-workspace-policy.json');
  return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
}

const DESCRIBE_KEYWORDS = [
  [/history.?rewrit|rebase|force.?push/i, 'history-rewrite'],
  [/branch.?maint|reconcil|merge.*branch/i, 'branch-maintenance'],
  [/release|package.*build|ship/i, 'release-build'],
  [/dependency|upgrade|bump.*version|pnpm.*update/i, 'dependency-upgrade'],
  [/large.?refactor|rewrite|migrat/i, 'large-refactor'],
  [
    /refactor|multi.?file|new (system|subsystem|infrastructure)|fleet.?wide|across (many|several|multiple)|infrastructure|many (scripts|files|jobs|services)/i,
    'refactor',
  ],
  [/audit|inventory|investigat|report|read.?only/i, 'analysis'],
];

function classifyFromDescription(text) {
  for (const [re, cls] of DESCRIBE_KEYWORDS) {
    if (re.test(text)) return cls;
  }
  return 'edit'; // policy default tier for unclassified work
}

function isInsideGitRepo(cwd) {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

function isSharedCanonicalCheckout(repoRoot) {
  // A worktree's git dir is a file pointing at the main repo's
  // .git/worktrees/<name>; the canonical checkout's .git is a real directory.
  const gitPath = path.join(repoRoot, '.git');
  try {
    return fs.statSync(gitPath).isDirectory();
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const opts = { taskClass: null, describe: null, json: false, enforce: false, provision: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--task-class') opts.taskClass = argv[++i];
    else if (a === '--describe') opts.describe = argv[++i];
    else if (a === '--json') opts.json = true;
    else if (a === '--enforce') opts.enforce = true;
    else if (a === '--provision') {
      // `--provision` optionally takes a worktree name; a following flag or
      // end-of-argv means "derive the name".
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        opts.provision = next;
        i += 1;
      } else {
        opts.provision = '';
      }
    }
  }
  return opts;
}

function defaultWorktreeName(taskClass) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  return `agent-${taskClass}-${stamp}`;
}

/**
 * Create the worktree through the existing TNF primitive when possible.
 * `tnf worktree create` (WorktreeService) owns the root, branch naming and
 * idempotency rules; this shells out to the built CLI and falls back to a
 * direct `git worktree add` with the same conventions when the build is
 * missing, so provisioning never depends on a compiled artifact.
 */
function provisionWorktree(repoRoot, name, taskClass) {
  const { execFileSync } = require('node:child_process');
  const worktreeName = name || defaultWorktreeName(taskClass);
  const outcome = { name: worktreeName, attempted: true, created: false, reused: false, worktreePath: null, branch: null, via: null, error: null };
  const cliEntry = path.join(repoRoot, 'packages', 'tnf-cli', 'dist', 'cli.js');
  if (fs.existsSync(cliEntry)) {
    try {
      const out = execFileSync(process.execPath, [cliEntry, 'worktree', 'create', worktreeName, '--json'], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: 120000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const parsed = JSON.parse(out);
      outcome.created = Boolean(parsed.created);
      outcome.reused = !parsed.created;
      outcome.worktreePath = parsed.worktree?.worktreePath || null;
      outcome.branch = parsed.worktree?.branch || null;
      outcome.via = 'tnf worktree create';
      return outcome;
    } catch (err) {
      outcome.error = `tnf worktree create failed (${String(err.stderr || err.message).slice(0, 300)}) — falling back to git`;
    }
  }
  try {
    const branch = `tnf/worktree/${worktreeName}`;
    const worktreePath = path.join(repoRoot, '.tnf', 'worktrees', worktreeName);
    fs.mkdirSync(path.dirname(worktreePath), { recursive: true });
    execFileSync('git', ['worktree', 'add', worktreePath, '-b', branch], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 120000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    outcome.created = true;
    outcome.worktreePath = worktreePath;
    outcome.branch = branch;
    outcome.via = 'git worktree add';
  } catch (err) {
    outcome.error = `git worktree add failed: ${String(err.stderr || err.message).slice(0, 300)}`;
  }
  return outcome;
}

function main(argv) {
  const opts = parseArgs(argv);
  const repoRoot = findRepoRoot();
  if (!repoRoot) {
    console.error('[resolve-workspace-tier] policy file not found from cwd; failing open (no restriction).');
    return 0;
  }

  if (opts.provision !== null && !opts.describe && !opts.taskClass) {
    console.error('[resolve-workspace-tier] --provision needs the task context: pass --describe "<text>" or --task-class <class>.');
    return 2;
  }

  let policy;
  try {
    policy = loadPolicy(repoRoot);
  } catch (err) {
    console.error(`[resolve-workspace-tier] could not read policy (${err.message}); failing open.`);
    return 0;
  }

  let taskClass = opts.taskClass;
  if (!taskClass && opts.describe) taskClass = classifyFromDescription(opts.describe);
  if (!taskClass) {
    console.error('[resolve-workspace-tier] usage: --task-class <class> | --describe "<text>" [--json] [--enforce]');
    console.error(`  known task classes: ${Object.keys(policy.byTaskClass).join(', ')}`);
    return 2;
  }

  const tierName = policy.byTaskClass[taskClass];
  if (!tierName) {
    console.error(`[resolve-workspace-tier] unknown task class "${taskClass}"; failing open.`);
    console.error(`  known task classes: ${Object.keys(policy.byTaskClass).join(', ')}`);
    return 0;
  }
  const tier = policy.tiers[tierName] || {};

  const cwd = process.cwd();
  const inRepo = isInsideGitRepo(cwd);
  const sharedCheckout = inRepo && isSharedCanonicalCheckout(repoRoot);
  const requiresIsolation = tierName === 'worktree' || tierName === 'clone';
  const violation = requiresIsolation && sharedCheckout;

  const result = {
    taskClass,
    tier: tierName,
    workspace: tier.workspace || tierName,
    note: tier.note || null,
    cwd,
    sharedCanonicalCheckout: sharedCheckout,
    violatesR1: violation,
    guidance: violation
      ? `Per TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL R1, "${taskClass}" work requires ${tier.workspace || tierName} — not the shared checkout. Provision one with: node scripts/harness/resolve-workspace-tier.cjs --describe "<task>" --provision   (or: tnf worktree create <name>)`
      : 'OK to proceed in the current workspace for this task class.',
  };

  // Disk preflight. R1 *mandates* a separate worktree/clone for these task
  // classes but nothing checked there was room for one. On 2026-09-02 a
  // worktree add on a near-full volume failed mid-checkout, left a partial
  // tree, and drove the machine to 35 MB free -- at which point the shell
  // began failing commands with no output. Refusing to advise a checkout we
  // cannot fit is cheaper than recovering from a half-written one.
  if (violation) {
    try {
      const df = require('node:child_process')
        .execSync('df -k / | tail -1', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .trim()
        .split(/\s+/);
      const availMb = Math.floor(Number(df[3]) / 1024);
      // Comparable existing TNF worktrees measured 462-596 MB; require ~2x.
      if (Number.isFinite(availMb) && availMb < 1200) {
        result.diskWarning = `only ${availMb} MB free on / — a TNF worktree checkout needs ~500-600 MB and has failed mid-checkout below this. Free space before creating one.`;
      }
      result.availMb = availMb;
    } catch {
      /* preflight is advisory; never let it be why this tool fails */
    }
  }

  // --provision: actually create the workspace the tier demands. Only the
  // `worktree` tier provisions automatically; `clone`-tier work (branch
  // maintenance, history rewrite) moves HEAD itself and must be provisioned
  // deliberately by the caller; shared tiers need nothing.
  if (opts.provision !== null) {
    if (!violation) {
      result.provision = { attempted: false, reason: `tier "${tierName}" does not require an isolated workspace; nothing provisioned` };
    } else if (tierName === 'clone') {
      result.provision = {
        attempted: false,
        reason: `tier "clone" requires a separate clone (HEAD-moving work); clone one deliberately, e.g.: git clone <origin> ../tnf-clone-${taskClass}`,
      };
    } else if (result.diskWarning) {
      result.provision = {
        attempted: false,
        reason: `refusing to provision: ${result.diskWarning}`,
      };
    } else {
      result.provision = provisionWorktree(repoRoot, opts.provision, taskClass);
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[resolve-workspace-tier] task-class=${result.taskClass} -> tier=${result.tier} (${result.workspace})`);
    if (result.diskWarning) console.log(`  ⛔ DISK: ${result.diskWarning}`);
    if (result.provision) {
      const p = result.provision;
      if (p.attempted === false) {
        console.log(`  ⑂ provision: skipped — ${p.reason}`);
      } else if (p.error) {
        console.log(`  ⑂ provision: FAILED — ${p.error}`);
      } else {
        console.log(`  ⑂ provision: ${p.created ? 'created' : 'reusing'} ${p.worktreePath} (branch ${p.branch}, via ${p.via})`);
        console.log(`    cd ${p.worktreePath} && rerun Turn Zero there before starting work.`);
      }
    }
    if (violation) {
      console.log(`  ⚠ ${result.guidance}`);
    } else {
      console.log(`  ✓ ${result.guidance}`);
    }
  }

  if (violation && opts.enforce) return 1;
  return 0;
}

module.exports = { classifyFromDescription, isSharedCanonicalCheckout, main };

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`[resolve-workspace-tier] internal error, failing open: ${err.message}`);
    process.exit(0);
  }
}
