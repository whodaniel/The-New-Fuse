#!/usr/bin/env node
/**
 * Jules Zero-Token Framework
 *
 * Purpose:
 * - Persist reusable Jules orchestration config
 * - Track session status transitions
 * - Auto-apply completed sessions (optional)
 * - Provide continuous background monitoring without LLM token usage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, '.agent', 'jules-framework.json');
const STATE_PATH = path.join(ROOT, '.agent', 'jules-logs', 'jules-framework-state.json');
const LOG_PATH = path.join(ROOT, '.agent', 'runtime-logs', 'jules-framework.jsonl');

function ensureDirs() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function logEvent(type, payload = {}) {
  const row = { ts: nowIso(), type, ...payload };
  fs.appendFileSync(LOG_PATH, `${JSON.stringify(row)}\n`, 'utf8');
  console.log(`[jules-framework] ${type}`, payload.id ? `(${payload.id})` : '');
}

function run(command) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 50 * 1024 * 1024,
    });
    return { ok: true, output: output.trim() };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

function normalizeStatus(value) {
  const s = String(value || '').toLowerCase();
  if (s.includes('completed')) return 'COMPLETED';
  if (s.includes('planning')) return 'PLANNING';
  if (s.includes('progress')) return 'IN_PROGRESS';
  if (s.includes('awaiting')) return 'AWAITING_FEEDBACK';
  if (s.includes('failed')) return 'FAILED';
  return 'UNKNOWN';
}

function parseSessionLine(line) {
  const parts = String(line || '')
    .trim()
    .split(/\s{2,}/)
    .filter(Boolean);
  if (parts.length < 5) return null;
  return {
    id: parts[0],
    description: parts[1],
    repo: parts[2],
    lastActive: parts[3],
    status: normalizeStatus(parts[4]),
  };
}

function listSessions() {
  const result = run('jules remote list --session');
  if (!result.ok || !result.output) return [];
  const lines = result.output.split('\n').slice(1);
  return lines.map(parseSessionLine).filter(Boolean);
}

function defaultConfig() {
  return {
    version: 1,
    createdAt: nowIso(),
    pollIntervalMs: 15000,
    autoApply: true,
    requireReviewBeforeApply: true,
    includeDescriptionRegex: 'Task bucket|TS|TypeScript|frontend',
    sessions: [],
  };
}

function loadConfig() {
  ensureDirs();
  if (!fs.existsSync(CONFIG_PATH)) {
    const cfg = defaultConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
    return cfg;
  }
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (cfg.requireReviewBeforeApply !== true) {
    cfg.requireReviewBeforeApply = true;
    saveConfig(cfg);
    logEvent('config_migrated', { field: 'requireReviewBeforeApply', value: true });
  }
  return cfg;
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

function loadState() {
  ensureDirs();
  if (!fs.existsSync(STATE_PATH)) {
    return { sessions: {}, lastUpdatedAt: null };
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function selectedSessions(config, allSessions) {
  const explicit = new Set((config.sessions || []).map((s) => String(s)));
  if (explicit.size > 0) {
    return allSessions.filter((s) => explicit.has(s.id));
  }

  const re = new RegExp(config.includeDescriptionRegex || '.*', 'i');
  return allSessions.filter((s) => re.test(s.description || ''));
}

function applySession(sessionId) {
  return run(`jules remote pull --session ${sessionId} --apply`);
}

function isMergeConflictError(err) {
  const msg = String(err || '');
  return /merge conflict|conflict|could not apply|failed to apply|not mergeable/i.test(msg);
}

function runCycle() {
  const config = loadConfig();
  const state = loadState();
  const sessions = listSessions();
  const targets = selectedSessions(config, sessions);
  const byId = Object.fromEntries(targets.map((s) => [s.id, s]));

  for (const session of targets) {
    const prior = state.sessions[session.id] || {};
    const previousStatus = prior.status || null;
    if (previousStatus !== session.status) {
      logEvent('status_change', {
        id: session.id,
        from: previousStatus,
        to: session.status,
        description: session.description,
      });
    }

    const row = {
      ...prior,
      id: session.id,
      description: session.description,
      repo: session.repo,
      status: session.status,
      lastActive: session.lastActive,
      observedAt: nowIso(),
    };

    const approvedForApply = !config.requireReviewBeforeApply || !!row.reviewApprovedAt;
    if (
      config.autoApply &&
      approvedForApply &&
      session.status === 'COMPLETED' &&
      !row.appliedAt &&
      !row.applyFailedAt
    ) {
      const applied = applySession(session.id);
      if (applied.ok) {
        row.appliedAt = nowIso();
        logEvent('session_applied', { id: session.id });
      } else {
        row.applyFailedAt = nowIso();
        row.applyError = applied.error;
        if (isMergeConflictError(applied.error)) {
          row.needsMergeResolution = true;
          row.reviewApprovedAt = null;
          row.reviewApprovedBy = null;
        }
        logEvent('session_apply_failed', { id: session.id, error: applied.error });
      }
    }

    state.sessions[session.id] = row;
  }

  for (const id of Object.keys(state.sessions)) {
    if (!byId[id]) {
      state.sessions[id].missingAt = nowIso();
    }
  }

  state.lastUpdatedAt = nowIso();
  saveState(state);
  return {
    selected: targets.length,
    totalListed: sessions.length,
    completed: targets.filter((s) => s.status === 'COMPLETED').length,
    inProgress: targets.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'PLANNING').length,
    awaitingReviewApproval: Object.values(state.sessions).filter(
      (s) =>
        s &&
        s.status === 'COMPLETED' &&
        !s.appliedAt &&
        !s.applyFailedAt &&
        config.requireReviewBeforeApply &&
        !s.reviewApprovedAt
    ).length,
    blockedByMergeConflicts: Object.values(state.sessions).filter(
      (s) => s && s.status === 'COMPLETED' && !!s.needsMergeResolution
    ).length,
  };
}

function cmdInit() {
  const cfg = loadConfig();
  saveConfig(cfg);
  console.log(`initialized: ${CONFIG_PATH}`);
}

function cmdAdd(ids) {
  const sanitized = ids
    .map((id) => String(id || '').trim())
    .filter((id) => id && id !== '--')
    .filter((id) => /^\d{8,}$/.test(id));
  if (sanitized.length === 0) {
    console.error('usage: add <SESSION_ID...>');
    process.exit(1);
  }
  const cfg = loadConfig();
  const existing = new Set((cfg.sessions || []).map((s) => String(s)));
  for (const id of sanitized) existing.add(String(id));
  existing.delete('--');
  cfg.sessions = Array.from(existing);
  saveConfig(cfg);
  console.log(`tracked_sessions=${cfg.sessions.length}`);
}

function cmdStatus() {
  const config = loadConfig();
  const state = loadState();
  const rows = Object.values(state.sessions || {});
  const summary = {
    requireReviewBeforeApply: !!config.requireReviewBeforeApply,
    tracked: rows.length,
    completed: rows.filter((r) => r.status === 'COMPLETED').length,
    inProgress: rows.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'PLANNING').length,
    awaitingReviewApproval: rows.filter(
      (r) => r.status === 'COMPLETED' && !r.appliedAt && !r.applyFailedAt && !r.reviewApprovedAt
    ).length,
    blockedByMergeConflicts: rows.filter((r) => r.status === 'COMPLETED' && !!r.needsMergeResolution)
      .length,
    applied: rows.filter((r) => !!r.appliedAt).length,
    applyFailed: rows.filter((r) => !!r.applyFailedAt).length,
    lastUpdatedAt: state.lastUpdatedAt || null,
  };
  console.log(JSON.stringify(summary, null, 2));
}

function cmdReview() {
  const state = loadState();
  const rows = Object.values(state.sessions || {});
  const pending = rows.filter(
    (r) => r.status === 'COMPLETED' && !r.appliedAt && !r.applyFailedAt && !r.reviewApprovedAt
  );
  if (pending.length === 0) {
    console.log('no_pending_review_sessions');
    return;
  }
  for (const row of pending) {
    console.log(
      `${row.id}\t${row.status}\tapproved=${row.reviewApprovedAt ? 'yes' : 'no'}\t${row.description || ''}`
    );
  }

  const conflicts = rows.filter((r) => r.status === 'COMPLETED' && !!r.needsMergeResolution);
  if (conflicts.length > 0) {
    console.log('---');
    console.log('merge_conflicts_require_manual_resolution');
    for (const row of conflicts) {
      console.log(`${row.id}\tapply_failed=${row.applyFailedAt || 'unknown'}\t${row.applyError || ''}`);
    }
  }
}

function cmdApprove(ids) {
  if (ids.length === 0) {
    console.error('usage: approve <SESSION_ID...>');
    process.exit(1);
  }
  const state = loadState();
  let updated = 0;
  for (const rawId of ids) {
    const id = String(rawId || '').trim();
    if (!id || id === '--') continue;
    const row = state.sessions[id];
    if (!row) continue;
    row.reviewApprovedAt = nowIso();
    row.reviewApprovedBy = process.env.USER || 'operator';
    row.applyFailedAt = null;
    row.applyError = null;
    row.needsMergeResolution = false;
    updated += 1;
    logEvent('review_approved', { id });
  }
  saveState(state);
  console.log(`approved=${updated}`);
}

function cmdOnce() {
  const summary = runCycle();
  console.log(JSON.stringify(summary, null, 2));
}

function cmdWatch() {
  const cfg = loadConfig();
  console.log(
    `[jules-framework] watching: interval=${cfg.pollIntervalMs}ms autoApply=${cfg.autoApply}`
  );
  const tick = () => {
    try {
      const summary = runCycle();
      console.log(
        `[jules-framework] cycle: selected=${summary.selected} completed=${summary.completed} in_progress=${summary.inProgress} awaiting_review=${summary.awaitingReviewApproval} conflicts=${summary.blockedByMergeConflicts}`
      );
    } catch (err) {
      logEvent('cycle_error', { error: String(err?.message || err) });
    }
  };
  tick();
  const timer = setInterval(tick, Number(cfg.pollIntervalMs || 15000));
  process.on('SIGINT', () => {
    clearInterval(timer);
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    clearInterval(timer);
    process.exit(0);
  });
}

function main() {
  ensureDirs();
  const args = process.argv.slice(2);
  const cmd = args[0] || 'status';
  if (cmd === 'init') return cmdInit();
  if (cmd === 'add') return cmdAdd(args.slice(1));
  if (cmd === 'once') return cmdOnce();
  if (cmd === 'watch') return cmdWatch();
  if (cmd === 'status') return cmdStatus();
  if (cmd === 'review') return cmdReview();
  if (cmd === 'approve') return cmdApprove(args.slice(1));
  console.log('usage: jules-zero-token-framework.cjs <init|add|once|watch|status|review|approve>');
}

if (require.main === module) {
  main();
}
