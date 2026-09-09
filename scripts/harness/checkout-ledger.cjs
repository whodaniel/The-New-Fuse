#!/usr/bin/env node
/**
 * checkout-ledger.cjs — canonical registry of individually isolated worker
 * checkouts (shared | worktree | clone).
 *
 * Authority model (TNF-0106):
 *   - Runtime SoT is host-local: ~/.tnf/checkouts/<repoFingerprint>/ledger.json
 *   - docs/protocols/workspace-checkouts.json is an optional committed mirror
 *     (broadcast), never the write-ready authority from a branch worktree.
 *   - workspace-leases.json remains path-ownership inside a checkout; leases
 *     may reference checkoutId additively. This is not a competing lease file.
 *
 * Worker identity = task + harness/session + assigned checkout.
 * provider/model are diagnostic metadata only — never a stop gate (TNF-0107).
 *
 * Usage
 *   node scripts/harness/checkout-ledger.cjs migrate [--json]
 *   node scripts/harness/checkout-ledger.cjs list [--json]
 *   node scripts/harness/checkout-ledger.cjs verify [--cwd <path>] [--json] [--enforce]
 *   node scripts/harness/checkout-ledger.cjs register --path <abs> --kind worktree|shared|clone \
 *        [--task <id>] [--agent <id>] [--branch <name>] [--provider <p>] [--model <m>] [--json]
 *   node scripts/harness/checkout-ledger.cjs heartbeat --checkout-id <id> [--json]
 *   node scripts/harness/checkout-ledger.cjs mirror [--json]
 *   node scripts/harness/checkout-ledger.cjs hygiene [--json] [--enforce] \
 *        [--lock-age-min N] [--staged-delete-max N]
 *
 * Exit: 0 ok; 1 verify/hygiene failure under --enforce; 2 usage.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const os = require('node:os');

const SPEC = 'docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md';
const MIRROR_REL = path.join('docs', 'protocols', 'workspace-checkouts.json');
const LOCK_TTL_MS = 30_000;
const DEFAULT_TTL_MIN = 240;
const HEARTBEAT_STALE_MIN = 30;

function findRepoRoot(start) {
  let current = start || process.cwd();
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(current, 'docs', 'protocols', 'agent-workspace-policy.json'))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return null;
}

function git(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function realpathSafe(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

function normalizeOrigin(raw) {
  const s = String(raw || '')
    .trim()
    .replace(/\.git$/, '');
  const ssh = s.match(/^git@github\.com:(.+)$/);
  if (ssh) return ssh[1];
  const https = s.match(/^https?:\/\/github\.com\/(.+)$/);
  if (https) return https[1];
  return s;
}

function repoIdentity(cwd) {
  const toplevel = git(['rev-parse', '--show-toplevel'], cwd) || cwd;
  const commonGitDir = git(['rev-parse', '--git-common-dir'], cwd);
  const absoluteCommon = commonGitDir
    ? path.isAbsolute(commonGitDir)
      ? commonGitDir
      : path.resolve(toplevel, commonGitDir)
    : path.join(toplevel, '.git');
  const origin = normalizeOrigin(git(['remote', 'get-url', 'origin'], cwd));
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${origin || 'no-origin'}|${realpathSafe(absoluteCommon)}`)
    .digest('hex')
    .slice(0, 16);
  const sharedPrimary = (() => {
    // Primary checkout: .git is a directory (not a worktree gitfile).
    const gitPath = path.join(toplevel, '.git');
    try {
      if (fs.statSync(gitPath).isDirectory()) return realpathSafe(toplevel);
    } catch {
      /* fall through */
    }
    // From a worktree, common dir is <primary>/.git — parent is primary.
    const commonReal = realpathSafe(absoluteCommon);
    if (path.basename(commonReal) === '.git') return path.dirname(commonReal);
    return realpathSafe(toplevel);
  })();
  return {
    fingerprint,
    origin: origin || null,
    commonGitDir: realpathSafe(absoluteCommon),
    sharedPrimary,
    toplevel: realpathSafe(toplevel),
  };
}

function ledgerPaths(identity) {
  const dir = path.join(os.homedir(), '.tnf', 'checkouts', identity.fingerprint);
  return {
    dir,
    ledger: path.join(dir, 'ledger.json'),
    lock: path.join(dir, 'ledger.lock'),
  };
}

function emptyLedger(identity) {
  return {
    schemaVersion: 1,
    spec: SPEC,
    policyNote:
      'Worker identity = task + harness/session + checkout. provider/model are diagnostic metadata only (not acceptance gates).',
    repo: {
      fingerprint: identity.fingerprint,
      origin: identity.origin,
      commonGitDir: identity.commonGitDir,
      sharedPrimary: identity.sharedPrimary,
    },
    checkouts: [],
    updatedAt: new Date().toISOString(),
  };
}

function readLedger(paths, identity) {
  try {
    const parsed = JSON.parse(fs.readFileSync(paths.ledger, 'utf8'));
    if (!Array.isArray(parsed.checkouts)) parsed.checkouts = [];
    return parsed;
  } catch (err) {
    if (fs.existsSync(paths.ledger)) {
      throw new Error(`checkout-ledger unreadable: ${err.message}`);
    }
    return emptyLedger(identity);
  }
}

function writeLedgerAtomic(paths, ledger) {
  fs.mkdirSync(paths.dir, { recursive: true, mode: 0o700 });
  ledger.updatedAt = new Date().toISOString();
  const tmp = `${paths.ledger}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, paths.ledger);
}

function withLock(paths, fn) {
  fs.mkdirSync(paths.dir, { recursive: true, mode: 0o700 });
  const now = Date.now();
  const token = `${process.pid}-${now}-${crypto.randomBytes(4).toString('hex')}`;
  if (fs.existsSync(paths.lock)) {
    try {
      const existing = JSON.parse(fs.readFileSync(paths.lock, 'utf8'));
      const exp = Date.parse(String(existing.expiresAt || ''));
      if (!Number.isNaN(exp) && exp > now && existing.token !== token) {
        throw new Error(`checkout-ledger lock held by ${existing.holder || 'unknown'} until ${existing.expiresAt}`);
      }
    } catch (err) {
      if (/lock held/.test(err.message)) throw err;
      /* corrupt lock → take over */
    }
  }
  fs.writeFileSync(
    paths.lock,
    `${JSON.stringify({
      holder: process.env.TNF_AGENT_ID || process.env.USER || 'unknown',
      token,
      expiresAt: new Date(now + LOCK_TTL_MS).toISOString(),
    })}\n`,
    { mode: 0o600 }
  );
  try {
    return fn();
  } finally {
    try {
      const cur = JSON.parse(fs.readFileSync(paths.lock, 'utf8'));
      if (cur.token === token) fs.unlinkSync(paths.lock);
    } catch {
      /* best effort */
    }
  }
}

function ulidLike() {
  return `co_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

function kindForPath(absPath, identity) {
  const real = realpathSafe(absPath);
  if (real === identity.sharedPrimary) return 'shared';
  const gitPath = path.join(real, '.git');
  try {
    if (fs.statSync(gitPath).isFile()) return 'worktree';
    if (fs.statSync(gitPath).isDirectory() && real !== identity.sharedPrimary) return 'clone';
  } catch {
    /* ignore */
  }
  return 'worktree';
}

/* ------------------------------------------------------------------ hygiene */

/** A lock younger than this may belong to a live git process. */
const LOCK_STALE_MIN = 60;
/** Staged deletions above this are a mass removal, not an edit. */
const STAGED_DELETE_MAX = 100;

/**
 * Fleet-wide worktree hygiene.
 *
 * `verify` answers "is THIS checkout the one the ledger says it is". This
 * answers a different question: "is any worktree in a state that will destroy
 * work or silently stop tracking reality" — including worktrees that were never
 * registered, which is precisely where the 2026-09-07 incident was found.
 *
 * What it looks for, and why each one earned its place:
 *
 *   stale-lock       A checkout interrupted 2026-09-01 22:55 left a 0-byte
 *                    index.lock. Every index write in that worktree failed for
 *                    six days. Nothing surfaced it.
 *   staged-deletion  That same frozen index held 27,083 staged deletions
 *                    (5.45M lines). Any agent running `git commit` there would
 *                    have committed the repo's removal as a normal-looking commit.
 *   no-remote        A branch with commits and no upstream is one disk failure
 *                    from gone. Committed is not the same as protected.
 *
 * Fails open on an unreadable worktree: a scanner that cannot look is reported
 * as UNKNOWN, never as clean.
 */
function worktreeHygiene(repoRoot, options = {}) {
  const lockStaleMin = Number(options.lockAgeMin) || LOCK_STALE_MIN;
  const stagedMax = Number(options.stagedDeleteMax) || STAGED_DELETE_MAX;

  const listing = git(['worktree', 'list', '--porcelain'], repoRoot) || '';
  const worktrees = [];
  for (const block of listing.split('\n\n')) {
    const m = block.match(/^worktree (.+)$/m);
    if (m) worktrees.push(m[1]);
  }

  const findings = [];
  for (const wt of worktrees) {
    const name = path.basename(wt);
    if (!fs.existsSync(wt)) {
      findings.push({ worktree: wt, name, severity: 'UNKNOWN', kind: 'missing-path',
        detail: 'registered worktree path does not exist' });
      continue;
    }

    // --- stale index.lock ---------------------------------------------------
    // A worktree's index lives in .git/worktrees/<name>/, the primary's in .git/.
    const gitPath = path.join(wt, '.git');
    let lockFile = null;
    try {
      const st = fs.statSync(gitPath);
      if (st.isDirectory()) lockFile = path.join(gitPath, 'index.lock');
      else {
        const ref = fs.readFileSync(gitPath, 'utf8').match(/^gitdir:\s*(.+)$/m);
        if (ref) lockFile = path.join(ref[1].trim(), 'index.lock');
      }
    } catch {
      findings.push({ worktree: wt, name, severity: 'UNKNOWN', kind: 'unreadable-gitdir',
        detail: 'could not resolve .git for this worktree' });
      continue;
    }
    if (lockFile && fs.existsSync(lockFile)) {
      let ageMin = null;
      try { ageMin = Math.round((Date.now() - fs.statSync(lockFile).mtimeMs) / 60000); } catch {}
      if (ageMin === null) {
        findings.push({ worktree: wt, name, severity: 'UNKNOWN', kind: 'stale-lock',
          detail: `index.lock present, age unreadable: ${lockFile}` });
      } else if (ageMin >= lockStaleMin) {
        findings.push({ worktree: wt, name, severity: 'HAZARD', kind: 'stale-lock', ageMin,
          path: lockFile,
          detail: `index.lock is ${ageMin}m old — every index write in this worktree is failing`,
          remedy: `lsof ${lockFile} ; # if unheld: rm -f ${lockFile}` });
      }
    }

    // --- staged mass deletion ----------------------------------------------
    const staged = git(['diff', '--cached', '--name-status', '--diff-filter=D'], wt);
    if (staged === null) {
      findings.push({ worktree: wt, name, severity: 'UNKNOWN', kind: 'unreadable-index',
        detail: 'could not read staged changes' });
    } else {
      const count = staged ? staged.split('\n').filter(Boolean).length : 0;
      if (count > stagedMax) {
        findings.push({ worktree: wt, name, severity: 'HAZARD', kind: 'staged-deletion', count,
          detail: `${count} staged deletions — a commit here removes them`,
          remedy: `git -C ${wt} reset   # unstage; files on disk are untouched` });
      }
    }

    // --- committed but unprotected -----------------------------------------
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], wt);
    if (branch && branch !== 'HEAD') {
      const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], wt);
      if (!upstream) {
        const ahead = git(['rev-list', '--count', 'HEAD', '--not', '--remotes'], wt);
        const n = Number(ahead || 0);
        if (n > 0) {
          findings.push({ worktree: wt, name, severity: 'WARN', kind: 'no-remote', branch, commits: n,
            detail: `${n} commit(s) on '${branch}' exist on no remote`,
            remedy: `git -C ${wt} push -u origin ${branch}` });
        }
      }
    }
  }

  const counts = { HAZARD: 0, WARN: 0, UNKNOWN: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  return { scanned: worktrees.length, findings, counts,
           thresholds: { lockStaleMin, stagedMax } };
}

function verifyCheckout(row, identity, cwd) {
  const reasons = [];
  const cwdReal = realpathSafe(cwd);
  const pathReal = realpathSafe(row.path);
  if (cwdReal !== pathReal && cwdReal !== realpathSafe(row.pathReal || row.path)) {
    reasons.push(`cwd ${cwdReal} does not match registered path ${pathReal}`);
  }
  if (!fs.existsSync(pathReal)) reasons.push(`path missing: ${pathReal}`);
  const top = git(['rev-parse', '--show-toplevel'], pathReal);
  if (top && realpathSafe(top) !== pathReal) {
    reasons.push(`git toplevel ${top} != checkout path`);
  }
  const live = repoIdentity(pathReal);
  if (identity.fingerprint !== live.fingerprint) {
    reasons.push(`repo fingerprint mismatch (${live.fingerprint} != ${identity.fingerprint})`);
  }
  if (row.kind !== 'shared' && pathReal === identity.sharedPrimary) {
    reasons.push('isolated checkout required but cwd is shared primary');
  }
  if (row.branch) {
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], pathReal);
    if (branch && branch !== 'HEAD' && branch !== row.branch) {
      reasons.push(`branch ${branch} != registered ${row.branch}`);
    }
  }
  const hb = Date.parse(String(row.heartbeatAt || row.updatedAt || ''));
  if (!Number.isNaN(hb) && Date.now() - hb > HEARTBEAT_STALE_MIN * 60_000) {
    reasons.push(`heartbeat stale (>${HEARTBEAT_STALE_MIN}m)`);
  }
  return {
    ok: reasons.length === 0,
    reasons,
    writeReady: reasons.length === 0 && row.state !== 'failed' && row.state !== 'retired',
  };
}

function upsertCheckout(ledger, row) {
  const real = realpathSafe(row.path);
  const idx = ledger.checkouts.findIndex(
    (c) =>
      c.checkoutId === row.checkoutId ||
      realpathSafe(c.path) === real ||
      realpathSafe(c.pathReal || c.path) === real
  );
  if (idx >= 0) {
    const prev = ledger.checkouts[idx];
    if (prev.state !== 'retired' && prev.checkoutId !== row.checkoutId && realpathSafe(prev.path) === real) {
      // Adopt existing row for same path (idempotent register).
      ledger.checkouts[idx] = {
        ...prev,
        ...row,
        checkoutId: prev.checkoutId,
        createdAt: prev.createdAt,
        updatedAt: new Date().toISOString(),
      };
      return ledger.checkouts[idx];
    }
    ledger.checkouts[idx] = { ...prev, ...row, updatedAt: new Date().toISOString() };
    return ledger.checkouts[idx];
  }
  ledger.checkouts.push(row);
  return row;
}

function parseWorktreePorcelain(repoRoot) {
  const raw = git(['worktree', 'list', '--porcelain'], repoRoot);
  const items = [];
  let cur = null;
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      if (cur) items.push(cur);
      cur = { path: line.slice('worktree '.length).trim(), branch: null, head: null };
    } else if (cur && line.startsWith('HEAD ')) cur.head = line.slice(5).trim();
    else if (cur && line.startsWith('branch ')) cur.branch = line.slice(7).trim().replace(/^refs\/heads\//, '');
    else if (line === '' && cur) {
      items.push(cur);
      cur = null;
    }
  }
  if (cur) items.push(cur);
  return items;
}

function migrate(identity, paths) {
  return withLock(paths, () => {
    const ledger = readLedger(paths, identity);
    const porcelain = parseWorktreePorcelain(identity.sharedPrimary);
    let added = 0;
    let updated = 0;
    for (const wt of porcelain) {
      const kind = kindForPath(wt.path, identity);
      const existing = ledger.checkouts.find((c) => realpathSafe(c.path) === realpathSafe(wt.path));
      const row = {
        checkoutId: existing?.checkoutId || ulidLike(),
        kind,
        path: wt.path,
        pathReal: realpathSafe(wt.path),
        branch: wt.branch,
        baseRef: existing?.baseRef || null,
        headAtProvision: wt.head,
        taskId: existing?.taskId || null,
        worker: existing?.worker || {
          agentId: kind === 'shared' ? 'shared-primary' : path.basename(wt.path),
          provider: null,
          model: null,
          pid: null,
        },
        state: existing?.state || (kind === 'shared' ? 'active' : 'ready'),
        writeReady: existing?.writeReady ?? kind === 'shared',
        identity: {
          verifiedAt: new Date().toISOString(),
          originOk: Boolean(identity.origin),
          isWorktree: kind === 'worktree',
          notSharedWhenRequired: kind !== 'shared',
        },
        leaseIds: existing?.leaseIds || [],
        heartbeatAt: new Date().toISOString(),
        ttlMinutes: existing?.ttlMinutes || DEFAULT_TTL_MIN,
        integrationReceipt: existing?.integrationReceipt || null,
        preserveUntil: existing?.preserveUntil || null,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        note: existing?.note || (kind === 'shared' ? 'migrated shared primary (append-only; dirty work left in place)' : 'migrated from git worktree list'),
      };
      if (existing) updated += 1;
      else added += 1;
      upsertCheckout(ledger, row);
    }
    writeLedgerAtomic(paths, ledger);
    return { ledger, added, updated, total: ledger.checkouts.length };
  });
}

function register(identity, paths, opts) {
  return withLock(paths, () => {
    const ledger = readLedger(paths, identity);
    const abs = realpathSafe(opts.path);
    const duplicate = ledger.checkouts.find(
      (c) => c.state !== 'retired' && realpathSafe(c.path) === abs && (!opts.checkoutId || c.checkoutId !== opts.checkoutId)
    );
    if (duplicate && opts.failOnDuplicate) {
      throw new Error(`duplicate active checkout path already registered as ${duplicate.checkoutId}`);
    }
    const kind = opts.kind || kindForPath(abs, identity);
    const branch = opts.branch || git(['rev-parse', '--abbrev-ref', 'HEAD'], abs) || null;
    const head = git(['rev-parse', 'HEAD'], abs) || null;
    const row = {
      checkoutId: opts.checkoutId || duplicate?.checkoutId || ulidLike(),
      kind,
      path: abs,
      pathReal: abs,
      branch: branch === 'HEAD' ? null : branch,
      baseRef: opts.baseRef || null,
      headAtProvision: head,
      taskId: opts.task || null,
      worker: {
        agentId: opts.agent || process.env.TNF_AGENT_ID || process.env.USER || 'unknown',
        provider: opts.provider || process.env.TNF_WORKER_PROVIDER || null,
        model: opts.model || process.env.TNF_WORKER_MODEL || null,
        pid: opts.pid ? Number(opts.pid) : process.pid,
      },
      state: opts.state || 'ready',
      writeReady: false,
      identity: {
        verifiedAt: null,
        originOk: Boolean(identity.origin),
        isWorktree: kind === 'worktree',
        notSharedWhenRequired: kind !== 'shared',
      },
      leaseIds: [],
      heartbeatAt: new Date().toISOString(),
      ttlMinutes: DEFAULT_TTL_MIN,
      integrationReceipt: null,
      preserveUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const verification = verifyCheckout(row, identity, abs);
    row.identity.verifiedAt = new Date().toISOString();
    row.writeReady = verification.writeReady;
    row.state = verification.ok ? row.state || 'ready' : 'failed';
    const saved = upsertCheckout(ledger, row);
    writeLedgerAtomic(paths, ledger);
    return { row: saved, verification };
  });
}

function heartbeat(identity, paths, checkoutId) {
  return withLock(paths, () => {
    const ledger = readLedger(paths, identity);
    const row = ledger.checkouts.find((c) => c.checkoutId === checkoutId);
    if (!row) throw new Error(`unknown checkoutId ${checkoutId}`);
    row.heartbeatAt = new Date().toISOString();
    row.updatedAt = row.heartbeatAt;
    if (row.worker) row.worker.pid = process.pid;
    writeLedgerAtomic(paths, ledger);
    return row;
  });
}

function mirrorToRepo(identity, paths, repoRoot) {
  const ledger = readLedger(paths, identity);
  const mirrorPath = path.join(repoRoot, MIRROR_REL);
  const mirror = {
    schemaVersion: 1,
    spec: SPEC,
    note: 'Committed mirror only. Runtime authority is ~/.tnf/checkouts/<fingerprint>/ledger.json resolved via git-common-dir.',
    repo: ledger.repo,
    mirroredAt: new Date().toISOString(),
    checkouts: ledger.checkouts.map((c) => ({
      checkoutId: c.checkoutId,
      kind: c.kind,
      path: c.path,
      branch: c.branch,
      taskId: c.taskId,
      state: c.state,
      workerAgentId: c.worker?.agentId || null,
      // model/provider intentionally omitted from committed mirror by default
    })),
  };
  fs.mkdirSync(path.dirname(mirrorPath), { recursive: true });
  fs.writeFileSync(mirrorPath, `${JSON.stringify(mirror, null, 2)}\n`);
  return mirrorPath;
}

function findRowForCwd(ledger, cwd) {
  const real = realpathSafe(cwd);
  return (
    ledger.checkouts.find((c) => realpathSafe(c.path) === real || realpathSafe(c.pathReal || c.path) === real) ||
    null
  );
}

function parseArgs(argv) {
  const opts = {
    cmd: null,
    json: false,
    enforce: false,
    path: null,
    kind: null,
    task: null,
    agent: null,
    branch: null,
    provider: null,
    model: null,
    pid: null,
    checkoutId: null,
    cwd: null,
    baseRef: null,
    failOnDuplicate: false,
    lockAgeMin: null,
    stagedDeleteMax: null,
  };
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--enforce') opts.enforce = true;
    else if (a === '--fail-on-duplicate') opts.failOnDuplicate = true;
    else if (a === '--lock-age-min') opts.lockAgeMin = Number(argv[++i]);
    else if (a === '--staged-delete-max') opts.stagedDeleteMax = Number(argv[++i]);
    else if (a === '--path') opts.path = argv[++i];
    else if (a === '--kind') opts.kind = argv[++i];
    else if (a === '--task') opts.task = argv[++i];
    else if (a === '--agent') opts.agent = argv[++i];
    else if (a === '--branch') opts.branch = argv[++i];
    else if (a === '--provider') opts.provider = argv[++i];
    else if (a === '--model') opts.model = argv[++i];
    else if (a === '--pid') opts.pid = argv[++i];
    else if (a === '--checkout-id') opts.checkoutId = argv[++i];
    else if (a === '--cwd') opts.cwd = argv[++i];
    else if (a === '--base-ref') opts.baseRef = argv[++i];
    else if (!a.startsWith('-')) positionals.push(a);
  }
  opts.cmd = positionals[0] || null;
  return opts;
}

function main(argv) {
  const opts = parseArgs(argv);
  if (!opts.cmd) {
    console.error(
      '[checkout-ledger] usage: migrate|list|verify|register|heartbeat|mirror|hygiene [--json]'
    );
    return 2;
  }
  const start = opts.cwd || opts.path || process.cwd();
  const repoRoot = findRepoRoot(start);
  if (!repoRoot) {
    console.error('[checkout-ledger] repo root not found from cwd; failing open.');
    return opts.enforce ? 1 : 0;
  }
  const identity = repoIdentity(repoRoot);
  const paths = ledgerPaths(identity);

  try {
    if (opts.cmd === 'migrate') {
      const result = migrate(identity, paths);
      if (opts.json) console.log(JSON.stringify({ ok: true, ...result, ledgerPath: paths.ledger }, null, 2));
      else {
        console.log(
          `[checkout-ledger] migrate fingerprint=${identity.fingerprint} added=${result.added} updated=${result.updated} total=${result.total}`
        );
        console.log(`  ledger: ${paths.ledger}`);
      }
      return 0;
    }

    if (opts.cmd === 'hygiene') {
      const res = worktreeHygiene(repoRoot, {
        lockAgeMin: opts.lockAgeMin,
        stagedDeleteMax: opts.stagedDeleteMax,
      });
      if (opts.json) {
        console.log(JSON.stringify({ ok: res.counts.HAZARD === 0, ...res }, null, 2));
      } else {
        console.log(
          `[checkout-ledger] hygiene: ${res.scanned} worktree(s) — ` +
            `${res.counts.HAZARD} hazard, ${res.counts.WARN} warn, ${res.counts.UNKNOWN} unknown`
        );
        for (const f of res.findings) {
          console.log(`  ${f.severity.padEnd(7)} ${f.kind.padEnd(16)} ${f.name}`);
          console.log(`          ${f.detail}`);
          if (f.remedy) console.log(`          fix: ${f.remedy}`);
        }
        if (!res.findings.length) console.log('  all worktrees clean');
      }
      // UNKNOWN never passes silently under --enforce: a scan that could not
      // look is not a scan that found nothing.
      const bad = res.counts.HAZARD + res.counts.UNKNOWN;
      return opts.enforce && bad > 0 ? 1 : 0;
    }

    if (opts.cmd === 'list') {
      const ledger = readLedger(paths, identity);
      if (opts.json) console.log(JSON.stringify(ledger, null, 2));
      else {
        console.log(`[checkout-ledger] ${ledger.checkouts.length} checkout(s) @ ${paths.ledger}`);
        for (const c of ledger.checkouts) {
          console.log(
            `  ${c.checkoutId}  ${c.kind.padEnd(8)}  ${c.state.padEnd(10)}  writeReady=${c.writeReady}  ${c.branch || '-'}  ${c.path}`
          );
        }
      }
      return 0;
    }

    if (opts.cmd === 'register') {
      if (!opts.path) {
        console.error('[checkout-ledger] register requires --path');
        return 2;
      }
      const result = register(identity, paths, opts);
      if (opts.json) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(
          `[checkout-ledger] registered ${result.row.checkoutId} kind=${result.row.kind} writeReady=${result.row.writeReady}`
        );
        if (!result.verification.ok) {
          console.log(`  verify issues: ${result.verification.reasons.join('; ')}`);
        }
      }
      return result.verification.ok || !opts.enforce ? 0 : 1;
    }

    if (opts.cmd === 'heartbeat') {
      if (!opts.checkoutId) {
        console.error('[checkout-ledger] heartbeat requires --checkout-id');
        return 2;
      }
      const row = heartbeat(identity, paths, opts.checkoutId);
      if (opts.json) console.log(JSON.stringify(row, null, 2));
      else console.log(`[checkout-ledger] heartbeat ${row.checkoutId} @ ${row.heartbeatAt}`);
      return 0;
    }

    if (opts.cmd === 'mirror') {
      const mirrorPath = mirrorToRepo(identity, paths, identity.sharedPrimary);
      if (opts.json) console.log(JSON.stringify({ mirrorPath }, null, 2));
      else console.log(`[checkout-ledger] mirrored → ${mirrorPath}`);
      return 0;
    }

    if (opts.cmd === 'verify') {
      const cwd = opts.cwd || process.cwd();
      const ledger = readLedger(paths, identity);
      let row = opts.checkoutId
        ? ledger.checkouts.find((c) => c.checkoutId === opts.checkoutId)
        : findRowForCwd(ledger, cwd);
      if (!row) {
        // Auto-register shared primary when verifying there (append-only convenience).
        if (realpathSafe(cwd) === identity.sharedPrimary) {
          const reg = register(identity, paths, {
            path: cwd,
            kind: 'shared',
            agent: 'shared-primary',
            task: opts.task || null,
          });
          row = reg.row;
        }
      }
      if (!row) {
        const payload = {
          ok: false,
          writeReady: false,
          reasons: [`no checkout ledger row for cwd ${realpathSafe(cwd)} — run migrate or register`],
          ledgerPath: paths.ledger,
        };
        if (opts.json) console.log(JSON.stringify(payload, null, 2));
        else console.log(`[checkout-ledger] VERIFY FAIL: ${payload.reasons[0]}`);
        return opts.enforce ? 1 : 0;
      }
      const verification = verifyCheckout(row, identity, cwd);
      // Persist refreshed writeReady (best-effort).
      try {
        withLock(paths, () => {
          const live = readLedger(paths, identity);
          const i = live.checkouts.findIndex((c) => c.checkoutId === row.checkoutId);
          if (i >= 0) {
            live.checkouts[i].writeReady = verification.writeReady;
            live.checkouts[i].identity = {
              ...(live.checkouts[i].identity || {}),
              verifiedAt: new Date().toISOString(),
            };
            live.checkouts[i].heartbeatAt = new Date().toISOString();
            writeLedgerAtomic(paths, live);
          }
        });
      } catch {
        /* verify still reports */
      }
      const payload = {
        ok: verification.ok,
        writeReady: verification.writeReady,
        checkoutId: row.checkoutId,
        kind: row.kind,
        path: row.path,
        branch: row.branch,
        taskId: row.taskId,
        worker: row.worker,
        reasons: verification.reasons,
        ledgerPath: paths.ledger,
        policyNote:
          'Acceptance depends on work evidence (diffs/commands/results), not provider/model identity.',
      };
      if (opts.json) console.log(JSON.stringify(payload, null, 2));
      else {
        console.log(
          `[checkout-ledger] VERIFY ${payload.ok ? 'OK' : 'FAIL'} id=${payload.checkoutId} writeReady=${payload.writeReady}`
        );
        for (const r of payload.reasons) console.log(`  - ${r}`);
      }
      return payload.ok || !opts.enforce ? 0 : 1;
    }

    console.error(`[checkout-ledger] unknown command ${opts.cmd}`);
    return 2;
  } catch (err) {
    console.error(`[checkout-ledger] ${err.message}`);
    return opts.enforce ? 1 : 2;
  }
}

module.exports = {
  worktreeHygiene,
  repoIdentity,
  ledgerPaths,
  migrate,
  register,
  verifyCheckout,
  findRowForCwd,
  readLedger,
  main,
};

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`[checkout-ledger] internal error, failing open: ${err.message}`);
    process.exit(0);
  }
}
