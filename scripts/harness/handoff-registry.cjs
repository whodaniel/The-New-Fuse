#!/usr/bin/env node
/**
 * handoff-registry.cjs — canonical registry of individual turn-end handoffs
 * (TNF-0108), aligned with the checkout ledger (TNF-0106/0107).
 *
 * Authority model
 * ---------------
 *   - Canonical schema: docs/protocols/schemas/tnf-session-handoff.schema.json
 *     (spec 0.3 adds session/checkout/task/supersession/acceptance fields).
 *   - Canonical emitter: scripts/protocols/emit-session-handoff.cjs — the only
 *     writer that validates then publishes a handoff, exactly once.
 *   - Individual handoff record: immutable JSON body, one per publication,
 *     host-local at ~/.tnf/checkouts/<repoFingerprint>/handoffs/. Write-once:
 *     corrections create a new record with explicit `supersedes`.
 *   - Registry index: ~/.tnf/handoffs/<repoFingerprint>/registry.json —
 *     metadata-only rows keyed by handoff_id, with explicit supersession,
 *     turn/task status, and acceptance state. Bodies stay in records; the
 *     index never holds handoff bodies.
 *   - Committed mirror: docs/protocols/handoff-registry.json — broadcast-only,
 *     metadata-only. Body URIs for private/restricted records are redacted;
 *     public/internal bodies are additionally copied under
 *     docs/protocols/reports/handoffs/<YYYY>/ for durability.
 *
 * Repository identity: sha256(origin|git-common-dir)[:16], identical to
 * scripts/harness/checkout-ledger.cjs (TNF-0107) so every checkout of the same
 * repository resolves the same registry.
 *
 * Views: SESSION_HANDOFF_LATEST.{json,md} and ~/.tnf/handoff-current*.json are
 * GENERATED compatibility views of a scoped active record. Scope is declared
 * (checkout|session|task|repo|global); most-recently-written never becomes
 * everyone's next directive by default.
 *
 * Crash recovery: records are truth, the index is a derived projection. A
 * record written but not indexed is reconciled deterministically on the next
 * reconcile/verify/publish pass (replay with hash check).
 *
 * Usage
 *   node scripts/harness/handoff-registry.cjs publish --file <handoff.json>
 *        [--supersedes <id>] [--checkout-id <id>] [--session-id <id>]
 *        [--task-id <id>] [--turn-status turn_complete|turn_incomplete]
 *        [--task-status in_progress|task_complete] [--no-supersede] [--json]
 *   node scripts/harness/handoff-registry.cjs latest
 *        [--scope checkout|session|task|repo|global] [--checkout-id ...]
 *        [--session-id ...] [--task-id ...] [--json]
 *   node scripts/harness/handoff-registry.cjs list [--state active] [--task <id>] [--json]
 *   node scripts/harness/handoff-registry.cjs supersede --handoff-id <id> --by <id> [--reason <r>] [--json]
 *   node scripts/harness/handoff-registry.cjs accept|reject --handoff-id <id> --by <who> [--basis <b>] [--json]
 *   node scripts/harness/handoff-registry.cjs reconcile [--json]
 *   node scripts/harness/handoff-registry.cjs verify [--enforce] [--json]
 *   node scripts/harness/handoff-registry.cjs backfill [--reports-dir <path>] [--json]
 *   node scripts/harness/handoff-registry.cjs mirror [--json]
 *
 * Exit: 0 ok; 1 verify failure under --enforce; 2 usage.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { repoIdentity, readLedger, findRowForCwd } = require('./checkout-ledger.cjs');

const SPEC = 'docs/protocols/HANDOFF_REGISTRY_PROTOCOL.md';
const REGISTRY_VERSION = 1;
const MIRROR_REL = path.join('docs', 'protocols', 'handoff-registry.json');
const BODY_MIRROR_DIR_REL = path.join('docs', 'protocols', 'reports', 'handoffs');
const COMMITTED_BODY_CLASSIFICATIONS = new Set(['public', 'internal']);
const LOCK_TTL_MS = 30_000;
const SCOPES = new Set(['checkout', 'session', 'task', 'repo', 'global']);
const REQUIRED_BODY_KEYS = ['spec', 'handoff_id', 'created_at', 'branch', 'head_sha'];

/** Home for runtime state; tests override with TNF_HANDOFF_HOME. */
function stateHome() {
  return process.env.TNF_HANDOFF_HOME || path.join(os.homedir(), '.tnf');
}

function paths(repoRoot, identity) {
  const ident = identity || repoIdentity(repoRoot);
  const registryDir = path.join(stateHome(), 'handoffs', ident.fingerprint);
  const recordsDir = path.join(stateHome(), 'checkouts', ident.fingerprint, 'handoffs');
  return {
    dir: registryDir,
    registry: path.join(registryDir, 'registry.json'),
    lock: path.join(registryDir, 'registry.lock'),
    recordsDir,
    mirror: path.join(repoRoot, MIRROR_REL),
    bodyMirrorDir: path.join(repoRoot, BODY_MIRROR_DIR_REL),
  };
}

/** Deterministic, key-sorted JSON serialization (canonical form). */
function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
}

function hashBody(body) {
  // record_hash is the sha256 of the body WITHOUT itself (self-referential
  // fields are excluded so a loaded record re-hashes to the same value).
  const { record_hash: _ignored, ...rest } = body || {};
  return crypto.createHash('sha256').update(canonicalize(rest)).digest('hex');
}

function emptyRegistry(identity) {
  return {
    schemaVersion: REGISTRY_VERSION,
    spec: SPEC,
    note: 'Metadata-only index of immutable handoff records. Bodies live in records; views are generated. Supersession is explicit.',
    repo: {
      fingerprint: identity.fingerprint,
      origin: identity.origin,
      commonGitDir: identity.commonGitDir,
      sharedPrimary: identity.sharedPrimary,
    },
    rows: [],
    updatedAt: new Date().toISOString(),
  };
}

function readRegistry(p, identity) {
  try {
    const parsed = JSON.parse(fs.readFileSync(p.registry, 'utf8'));
    if (!Array.isArray(parsed.rows)) parsed.rows = [];
    return parsed;
  } catch (err) {
    if (fs.existsSync(p.registry)) {
      throw new Error(`handoff-registry unreadable: ${err.message}`);
    }
    return emptyRegistry(identity);
  }
}

function writeRegistryAtomic(p, registry) {
  fs.mkdirSync(p.dir, { recursive: true, mode: 0o700 });
  registry.updatedAt = new Date().toISOString();
  const tmp = `${p.registry}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(registry, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tmp, p.registry);
}

/** Same token/TTL lock pattern as checkout-ledger.cjs. */
function withLock(p, fn) {
  fs.mkdirSync(p.dir, { recursive: true, mode: 0o700 });
  const now = Date.now();
  const token = `${process.pid}-${now}-${crypto.randomBytes(4).toString('hex')}`;
  if (fs.existsSync(p.lock)) {
    try {
      const existing = JSON.parse(fs.readFileSync(p.lock, 'utf8'));
      const exp = Date.parse(String(existing.expiresAt || ''));
      if (!Number.isNaN(exp) && exp > now && existing.token !== token) {
        throw new Error(`handoff-registry lock held by ${existing.holder || 'unknown'} until ${existing.expiresAt}`);
      }
    } catch (err) {
      if (/lock held/.test(err.message)) throw err;
      /* corrupt lock → take over */
    }
  }
  fs.writeFileSync(
    p.lock,
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
      const cur = JSON.parse(fs.readFileSync(p.lock, 'utf8'));
      if (cur.token === token) fs.unlinkSync(p.lock);
    } catch {
      /* best effort */
    }
  }
}

/** Validation BEFORE publication: structural subset that catches fabricated bodies. */
function validateBody(body) {
  const problems = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['handoff body must be an object'];
  }
  for (const key of REQUIRED_BODY_KEYS) {
    if (!body[key] || typeof body[key] !== 'string') problems.push(`missing/invalid required key: ${key}`);
  }
  if (body.handoff_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.handoff_id)) {
    problems.push(`handoff_id is not a UUID: ${body.handoff_id}`);
  }
  if (body.head_sha && !/^[0-9a-f]{7,40}$/.test(body.head_sha)) problems.push('head_sha is not a git SHA');
  if (body.record_hash && !/^[0-9a-f]{64}$/.test(body.record_hash)) problems.push('record_hash is not sha256 hex');
  return problems;
}

function resolveCheckoutId(repoRoot, identity, explicit) {
  if (explicit) return explicit;
  try {
    const { ledgerPaths } = require('./checkout-ledger.cjs');
    const p = ledgerPaths(identity);
    const ledger = readLedger(p, identity);
    const row = findRowForCwd(ledger, identity.toplevel);
    if (row?.checkoutId) return row.checkoutId;
  } catch {
    /* fall through */
  }
  return `co_unregistered_${identity.fingerprint}`;
}

function compactTimestamp(iso) {
  return String(iso || '').replace(/[:.]/g, '-').slice(0, 19);
}

function rowFromBody(body, recordPath, repoRoot, extras) {
  const rel = path.relative(repoRoot, recordPath);
  const committedClassification = COMMITTED_BODY_CLASSIFICATIONS.has(body.sensitive_scope)
    || COMMITTED_BODY_CLASSIFICATIONS.has(body.classification?.sensitivity);
  const candidateUri = path.join(BODY_MIRROR_DIR_REL, String(body.created_at || '').slice(0, 4), `${body.handoff_id}.json`);
  const repoBodyUri = committedClassification && (extras.bodyMirrorExpected || fs.existsSync(path.join(repoRoot, candidateUri)))
    ? candidateUri : null;
  return {
    handoff_id: body.handoff_id,
    record_hash: body.record_hash,
    created_at: body.created_at,
    task_id: extras.taskId || body.task_id || null,
    session_id: extras.sessionId || body.session_id || null,
    session_harness: body.session_harness || null,
    checkout_id: extras.checkoutId || body.checkout_id || null,
    branch: body.branch || null,
    head_sha: body.head_sha || null,
    classification: body.classification?.sensitivity || body.sensitive_scope || 'internal',
    turn_status: extras.turnStatus || body.turn_status || 'turn_complete',
    task_status: extras.taskStatus || body.task_status || 'in_progress',
    acceptance: body.acceptance || { state: 'unverified' },
    supersedes: Array.isArray(body.supersedes) ? body.supersedes : [],
    superseded_by: body.superseded_by || null,
    state: body.superseded_by ? 'superseded' : 'active',
    body_uri: recordPath,
    body_uri_redacted: !committedClassification,
    repo_body_uri: repoBodyUri,
    indexedAt: new Date().toISOString(),
  };
}

function writeCommittedBody(p, body) {
  const classification = body.classification?.sensitivity || body.sensitive_scope || 'internal';
  if (!COMMITTED_BODY_CLASSIFICATIONS.has(classification)) return null;
  const dir = path.join(p.bodyMirrorDir, String(body.created_at || '').slice(0, 4));
  fs.mkdirSync(dir, { recursive: true });
  const committed = path.join(dir, `${body.handoff_id}.json`);
  fs.writeFileSync(committed, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
  return committed;
}

/** Metadata-only committed mirror; private/restricted body URIs redacted. */
function writeMirror(repoRoot, p, registry) {
  const mirror = {
    schemaVersion: REGISTRY_VERSION,
    spec: SPEC,
    note: 'Committed metadata-only mirror. Runtime authority is ~/.tnf/handoffs/<fingerprint>/registry.json. Body URIs are redacted for private/restricted records; bodies keep checkout residency.',
    repo: { fingerprint: registry.repo.fingerprint, origin: registry.repo.origin },
    mirroredAt: new Date().toISOString(),
    rows: registry.rows.map((row) => ({
      handoff_id: row.handoff_id,
      record_hash: row.record_hash,
      created_at: row.created_at,
      task_id: row.task_id,
      session_id: row.session_id,
      checkout_id: row.checkout_id,
      branch: row.branch,
      head_sha: row.head_sha,
      classification: row.classification,
      turn_status: row.turn_status,
      task_status: row.task_status,
      acceptance: row.acceptance,
      supersedes: row.supersedes,
      superseded_by: row.superseded_by,
      state: row.state,
      body_mutability: row.body_mutability,
      repo_body_uri: row.body_uri_redacted ? null : row.repo_body_uri,
    })),
  };
  fs.mkdirSync(path.dirname(p.mirror), { recursive: true });
  const tmp = `${p.mirror}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(mirror, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, p.mirror);
  return p.mirror;
}

/**
 * Publish one handoff: validate → index transaction with explicit
 * supersession → write immutable record (final content) → row + committed
 * mirror/body copy. Idempotent by record_hash; atomic per file; crash between
 * record and index is healed by reconcile().
 */
function publish({ repoRoot, handoff, opts = {} }) {
  const identity = repoIdentity(repoRoot);
  const p = paths(repoRoot, identity);
  const problems = validateBody(handoff);
  if (problems.length) throw new Error(`handoff rejected before publication: ${problems.join('; ')}`);

  const checkoutId = resolveCheckoutId(repoRoot, identity, opts.checkoutId);
  const extras = {
    bodyMirrorExpected: opts.mirror !== false,
    checkoutId,
    sessionId: opts.sessionId || null,
    taskId: opts.taskId || null,
    turnStatus: opts.turnStatus || 'turn_complete',
    taskStatus: opts.taskStatus || 'in_progress',
  };

  return withLock(p, () => {
    const registry = readRegistry(p, identity);
    const fileName = `${compactTimestamp(handoff.created_at)}_${handoff.handoff_id}.json`;
    const recordPath = path.join(p.recordsDir, fileName);

    // Idempotent publication: if the immutable record already exists on disk
    // it is canonical (its hash is bound to its exact content). Re-index and
    // return — never rewrite it.
    if (fs.existsSync(recordPath)) {
      const existing = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
      const hash = hashBody(existing);
      if (existing.record_hash && existing.record_hash !== hash) {
        throw new Error(`existing record ${recordPath} fails its own hash — refusing to touch it`);
      }
      let row = registry.rows.find((r) => r.handoff_id === existing.handoff_id);
      if (!row) {
        row = rowFromBody(existing, recordPath, repoRoot, {
          ...extras,
          checkoutId: existing.checkout_id || extras.checkoutId,
          sessionId: existing.session_id,
          taskId: existing.task_id,
          turnStatus: existing.turn_status,
          taskStatus: existing.task_status,
        });
        registry.rows.push(row);
        writeRegistryAtomic(p, registry);
        if (opts.mirror !== false) {
          writeCommittedBody(p, existing);
          writeMirror(repoRoot, p, registry);
        }
      }
      return { row, recordPath, superseded: [], idempotent: true };
    }

    // Explicit supersession: this record supersedes the currently active
    // scoped record(s). Never implicit: the superseding id is recorded on
    // both sides, and prior records are preserved unchanged.
    const superseded = [];
    if (!opts.noSupersede && !handoff.superseded_by) {
      for (const row of registry.rows) {
        if (row.state !== 'active') continue;
        if (row.checkout_id && row.checkout_id !== checkoutId) continue;
        row.superseded_by = handoff.handoff_id;
        row.state = 'superseded';
        superseded.push(row.handoff_id);
      }
    }

    // Finalize the body BEFORE the immutable write: identity fields, declared
    // supersedes, the deterministic committed-body self-reference, then the
    // hash. The on-disk record is complete at birth.
    const body = handoff;
    body.checkout_id = checkoutId;
    if (extras.sessionId) body.session_id = extras.sessionId;
    if (extras.taskId) body.task_id = extras.taskId;
    body.turn_status = extras.turnStatus;
    body.task_status = extras.taskStatus;
    body.supersedes = [...new Set([
      ...(Array.isArray(opts.supersedes) ? opts.supersedes : []),
      ...superseded,
    ])];
    if (
      opts.mirror !== false &&
      COMMITTED_BODY_CLASSIFICATIONS.has(body.classification?.sensitivity || body.sensitive_scope || 'internal') &&
      Array.isArray(body.changed_paths)
    ) {
      // Self-reference: the committed copy of this record is a deterministic
      // path known before the immutable write, so handoff gates can require
      // coverage of it without any post-publication mutation.
      const repoBodyRel = path.join(
        BODY_MIRROR_DIR_REL,
        String(body.created_at || '').slice(0, 4),
        `${body.handoff_id}.json`,
      );
      if (!body.changed_paths.includes(repoBodyRel)) body.changed_paths.push(repoBodyRel);
    }
    body.record_hash = hashBody(body);

    fs.mkdirSync(p.recordsDir, { recursive: true, mode: 0o700 });
    const tmp = `${recordPath}.tmp.${process.pid}`;
    fs.writeFileSync(tmp, `${JSON.stringify(body, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(tmp, recordPath);

    const row = rowFromBody(body, recordPath, repoRoot, extras);
    row.supersedes = body.supersedes;
    const idx = registry.rows.findIndex((r) => r.handoff_id === row.handoff_id);
    if (idx >= 0) registry.rows[idx] = { ...registry.rows[idx], ...row };
    else registry.rows.push(row);
    writeRegistryAtomic(p, registry);
    if (opts.mirror !== false) {
      writeCommittedBody(p, body);
      writeMirror(repoRoot, p, registry);
    }
    return { row, recordPath, superseded, idempotent: false };
  });
}

/** Verify record body hashes against the index; heal missing rows. */
function reconcile({ repoRoot }) {
  const identity = repoIdentity(repoRoot);
  const p = paths(repoRoot, identity);
  const report = { added: [], removed: [], hashMismatches: [], recordsScanned: 0 };
  const records = fs.existsSync(p.recordsDir)
    ? fs.readdirSync(p.recordsDir).filter((f) => f.endsWith('.json')).sort()
    : [];

  return withLock(p, () => {
    const registry = readRegistry(p, identity);
    const seen = new Set();
    for (const file of records) {
      const recordPath = path.join(p.recordsDir, file);
      let body;
      try {
        body = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
      } catch (err) {
        report.hashMismatches.push({ handoff_id: file, reason: `unreadable record: ${err.message}` });
        continue;
      }
      report.recordsScanned += 1;
      seen.add(body.handoff_id);
      const hash = hashBody(body);
      if (body.record_hash && body.record_hash !== hash) {
        report.hashMismatches.push({ handoff_id: body.handoff_id, reason: 'record_hash mismatch — record mutated after publication' });
      }
      const row = registry.rows.find((r) => r.handoff_id === body.handoff_id);
      if (!row) {
        registry.rows.push(rowFromBody(body, recordPath, repoRoot, {}));
        report.added.push(body.handoff_id);
      } else if (!row.record_hash) {
        row.record_hash = hash;
      }
    }
    registry.rows = registry.rows.map((row) => {
      // Rows claiming a host-local record that vanished are withdrawn;
      // legacy rows pointing at committed report files are always kept.
      if (
        row.state !== 'withdrawn' &&
        row.body_uri && row.body_uri.startsWith(stateHome()) &&
        !fs.existsSync(row.body_uri)
      ) {
        row.state = 'withdrawn';
        report.removed.push(row.handoff_id);
      }
      // Normalize legacy rows imported before body_mutability existed.
      if (!row.body_mutability && row.state === 'legacy' && row.repo_body_uri) {
        row.body_mutability = /^SESSION_HANDOFF_LATEST\.(json|md)$/i.test(path.basename(row.repo_body_uri))
          ? 'view'
          : 'snapshot';
      }
      return row;
    });
    writeRegistryAtomic(p, registry);
    writeMirror(repoRoot, p, registry);
    return report;
  });
}

function verifyBodyHash(bodyPath, expectedHash) {
  try {
    const body = JSON.parse(fs.readFileSync(bodyPath, 'utf8'));
    return hashBody(body) === expectedHash ? null : `hash mismatch: ${bodyPath}`;
  } catch (err) {
    return `unreadable body ${bodyPath}: ${err.message}`;
  }
}

/** True when a legacy row's body is a generated view file, not a frozen
 *  snapshot. Views legitimately change on every emit; hash immutability
 *  does not apply to them. */
function isViewBackedRow(row) {
  return row.body_mutability === 'view';
}

function verify({ repoRoot }) {
  const identity = repoIdentity(repoRoot);
  const p = paths(repoRoot, identity);
  const registry = readRegistry(p, identity);
  const failures = [];
  for (const row of registry.rows) {
    if (!row.record_hash) continue;
    if (isViewBackedRow(row)) continue; // views change legitimately; skip hash enforcement
    const candidates = [row.body_uri, row.repo_body_uri ? path.join(repoRoot, row.repo_body_uri) : null]
      .filter(Boolean);
    if (!candidates.length) continue; // metadata-only row; nothing to verify
    let checked = false;
    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue;
      const err = verifyBodyHash(candidate, row.record_hash);
      if (err) failures.push({ handoff_id: row.handoff_id, reason: err });
      checked = true;
      break;
    }
    if (!checked) failures.push({ handoff_id: row.handoff_id, reason: `body missing: ${candidates[0]}` });
  }
  return { ok: failures.length === 0, failures, rows: registry.rows.length };
}

function activeRows(registry) {
  return registry.rows
    .filter((r) => r.state === 'active')
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function latestRow(registry, { scope = 'checkout', checkoutId, sessionId, taskId } = {}) {
  const rows = activeRows(registry);
  const match = (pred) => rows.find(pred) || null;
  switch (scope) {
    case 'global':
      return rows[0] || null;
    case 'repo':
      return rows[0] || null; // registry is already per-repo fingerprint
    case 'task':
      return taskId ? match((r) => r.task_id === taskId) : null;
    case 'session':
      return sessionId ? match((r) => r.session_id === sessionId) : null;
    case 'checkout':
    default:
      return checkoutId ? match((r) => r.checkout_id === checkoutId) || rows[0] || null : rows[0] || null;
  }
}

function listRows({ repoRoot, state, taskId }) {
  const identity = repoIdentity(repoRoot);
  const registry = readRegistry(paths(repoRoot, identity), identity);
  return registry.rows
    .filter((r) => (state ? r.state === state : true))
    .filter((r) => (taskId ? r.task_id === taskId : true))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function supersede({ repoRoot, handoffId, byId, reason }) {
  if (!handoffId || !byId) throw new Error('supersede requires --handoff-id and --by');
  const identity = repoIdentity(repoRoot);
  const p = paths(repoRoot, identity);
  return withLock(p, () => {
    const registry = readRegistry(p, identity);
    const row = registry.rows.find((r) => r.handoff_id === handoffId);
    if (!row) throw new Error(`unknown handoff_id: ${handoffId}`);
    const by = registry.rows.find((r) => r.handoff_id === byId);
    if (!by) throw new Error(`unknown superseding handoff_id: ${byId}`);
    row.superseded_by = byId;
    row.state = 'superseded';
    if (reason) row.supersede_reason = reason;
    if (!by.supersedes.includes(handoffId)) by.supersedes.push(handoffId);
    writeRegistryAtomic(p, registry);
    writeMirror(repoRoot, p, registry);
    return row;
  });
}

function setAcceptance({ repoRoot, handoffId, state, by, basis }) {
  if (!['accepted', 'rejected', 'claimed', 'unverified'].includes(state)) {
    throw new Error(`invalid acceptance state: ${state}`);
  }
  const identity = repoIdentity(repoRoot);
  const p = paths(repoRoot, identity);
  return withLock(p, () => {
    const registry = readRegistry(p, identity);
    const row = registry.rows.find((r) => r.handoff_id === handoffId);
    if (!row) throw new Error(`unknown handoff_id: ${handoffId}`);
    row.acceptance = {
      state,
      by: by || null,
      at: new Date().toISOString(),
      basis: basis || null,
    };
    writeRegistryAtomic(p, registry);
    writeMirror(repoRoot, p, registry);
    return row;
  });
}

/**
 * Import legacy committed handoff reports (SESSION_HANDOFF_*.json) as
 * `legacy` rows. Additive only: no file moves, no deletions, no body copies.
 */
function backfill({ repoRoot, reportsDir, mirror }) {
  const identity = repoIdentity(repoRoot);
  const p = paths(repoRoot, identity);
  const dir = reportsDir || path.join(repoRoot, 'docs', 'protocols', 'reports');
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    : [];
  const imported = [];
  const skipped = [];
  return withLock(p, () => {
    const registry = readRegistry(p, identity);
    const byId = new Map(registry.rows.map((r) => [r.handoff_id, r]));
    for (const file of files) {
      const filePath = path.join(dir, file);
      let body;
      try {
        body = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        skipped.push({ file, reason: 'unparseable' });
        continue;
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        skipped.push({ file, reason: 'not an object' });
        continue;
      }
      let handoffId = typeof body.handoff_id === 'string' ? body.handoff_id : null;
      if (!handoffId || !/^[0-9a-f]{8}-/i.test(handoffId)) {
        handoffId = `legacy-${crypto.createHash('sha256').update(path.relative(repoRoot, filePath)).digest('hex').slice(0, 12)}`;
      }
      if (byId.has(handoffId)) {
        skipped.push({ file, reason: `already indexed as ${handoffId}` });
        continue;
      }
      const rel = path.relative(repoRoot, filePath);
      const row = {
        handoff_id: handoffId,
        record_hash: hashBody(body),
        created_at: body.created_at || null,
        task_id: body.task_id || null,
        session_id: body.session_id || null,
        session_harness: body.session_harness || null,
        checkout_id: body.checkout_id || null,
        branch: body.branch || null,
        head_sha: body.head_sha || null,
        classification: body.classification?.sensitivity || body.sensitive_scope || 'internal',
        turn_status: body.turn_status || null,
        task_status: body.task_status || null,
        acceptance: body.acceptance || { state: 'unverified' },
        supersedes: Array.isArray(body.supersedes) ? body.supersedes : [],
        superseded_by: body.superseded_by || null,
        state: 'legacy',
        body_uri: filePath,
        body_uri_redacted: !COMMITTED_BODY_CLASSIFICATIONS.has(body.sensitive_scope || body.classification?.sensitivity || 'internal'),
        repo_body_uri: rel,
        // SESSION_HANDOFF_LATEST.json is a generated compatibility view, not a
        // frozen snapshot: it legitimately changes on every emit, so hash
        // immutability is not enforced for rows backed by it.
        body_mutability: /^SESSION_HANDOFF_LATEST\.(json|md)$/i.test(file) ? 'view' : 'snapshot',
        indexedAt: new Date().toISOString(),
      };
      registry.rows.push(row);
      byId.set(handoffId, row);
      imported.push({ file, handoff_id: handoffId });
    }
    writeRegistryAtomic(p, registry);
    if (mirror !== false) writeMirror(repoRoot, p, registry);
    return { imported, skipped, total: registry.rows.length };
  });
}

/** Generated per-checkout compatibility view of the scoped active record. */
function writeCurrentCache({ repoRoot, row, body }) {
  if (!row) return null;
  const file = path.join(stateHome(), `handoff-current-${row.checkout_id || 'unknown'}.json`);
  const payload = {
    ...body,
    _view: {
      generatedBy: 'handoff-registry.cjs',
      scope: 'checkout',
      checkout_id: row.checkout_id,
      handoff_id: row.handoff_id,
      record_hash: row.record_hash,
      state: row.state,
      generatedAt: new Date().toISOString(),
    },
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
  return file;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      if (key === 'no-supersede' || key === 'json' || key === 'enforce') args[key] = true;
      else args[key] = argv[++i];
    } else args._.push(token);
  }
  return args;
}

function main(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0];
  const repoRoot = args.cwd ? path.resolve(args.cwd) : process.cwd();
  const asJson = args.json;
  const out = (value) => console.log(asJson ? JSON.stringify(value, null, 2) : typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  try {
    switch (cmd) {
      case 'publish': {
        if (!args.file) throw new Error('publish requires --file');
        const handoff = JSON.parse(fs.readFileSync(path.resolve(args.file), 'utf8'));
        const result = publish({
          repoRoot,
          handoff,
          opts: {
            supersedes: args.supersedes ? String(args.supersedes).split(',').map((s) => s.trim()).filter(Boolean) : undefined,
            checkoutId: args['checkout-id'],
            sessionId: args['session-id'],
            taskId: args['task-id'],
            turnStatus: args['turn-status'],
            taskStatus: args['task-status'],
            noSupersede: args['no-supersede'],
          },
        });
        out(result.row);
        return 0;
      }
      case 'latest': {
        const identity = repoIdentity(repoRoot);
        const p = paths(repoRoot, identity);
        const registry = readRegistry(p, identity);
        const row = latestRow(registry, {
          scope: SCOPES.has(args.scope) ? args.scope : 'checkout',
          checkoutId: args['checkout-id'] || resolveCheckoutId(repoRoot, identity),
          sessionId: args['session-id'],
          taskId: args['task-id'],
        });
        out(row);
        return row ? 0 : 2;
      }
      case 'list': {
        out(listRows({ repoRoot, state: args.state, taskId: args.task }));
        return 0;
      }
      case 'supersede': {
        out(supersede({ repoRoot, handoffId: args['handoff-id'], byId: args.by, reason: args.reason }));
        return 0;
      }
      case 'accept':
      case 'reject': {
        const state = cmd === 'accept' ? 'accepted' : 'rejected';
        out(setAcceptance({ repoRoot, handoffId: args['handoff-id'], state, by: args.by, basis: args.basis }));
        return 0;
      }
      case 'reconcile': {
        out(reconcile({ repoRoot }));
        return 0;
      }
      case 'verify': {
        const report = verify({ repoRoot });
        out(report);
        if (args.enforce && !report.ok) return 1;
        return 0;
      }
      case 'backfill': {
        out(backfill({ repoRoot, reportsDir: args['reports-dir'] ? path.resolve(args['reports-dir']) : undefined }));
        return 0;
      }
      case 'mirror': {
        const identity = repoIdentity(repoRoot);
        const p = paths(repoRoot, identity);
        out(writeMirror(repoRoot, p, readRegistry(p, identity)));
        return 0;
      }
      default:
        console.error('usage: handoff-registry.cjs <publish|latest|list|supersede|accept|reject|reconcile|verify|backfill|mirror> [--json]');
        return 2;
    }
  } catch (err) {
    console.error(`[handoff-registry] ${err.message}`);
    return args.enforce ? 1 : 2;
  }
}

module.exports = {
  SPEC,
  paths,
  canonicalize,
  hashBody,
  validateBody,
  publish,
  reconcile,
  verify,
  latestRow,
  listRows,
  supersede,
  setAcceptance,
  backfill,
  writeCurrentCache,
  writeMirror,
  resolveCheckoutId,
  main,
};

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
