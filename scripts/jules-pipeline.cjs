#!/usr/bin/env node
/**
 * jules-pipeline.cjs
 *
 * Full end-to-end Jules session lifecycle manager.
 *
 * Commands:
 *   start   <task-file>   Start up to 15 Jules sessions from a task list file
 *   status               Poll all tracked sessions and update state
 *   publish              Publish completed sessions as branches (no UI click needed)
 *   pr                   Open draft PRs for published branches
 *   merge                Attempt auto-merge of approved PRs
 *   all     <task-file>   Run full pipeline: start → poll → publish → pr
 *
 * State file: .agent/jules-logs/pipeline-state.json
 *
 * Publish strategy (no git checkout, no index.lock):
 *   jules remote pull → git apply --3way → git add -A → git write-tree
 *   → git commit-tree → git update-ref → git push
 *
 * Usage:
 *   node scripts/jules-pipeline.cjs status
 *   node scripts/jules-pipeline.cjs publish
 *   node scripts/jules-pipeline.cjs pr
 *   node scripts/jules-pipeline.cjs all tasks.txt
 */

/* eslint-disable no-process-exit */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Config ───────────────────────────────────────────────────────────────────
const REPO_ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const STATE_FILE = path.join(REPO_ROOT, '.agent/jules-logs/pipeline-state.json');
const LOG_DIR = path.join(REPO_ROOT, '.agent/jules-logs');
const BASE_BRANCH = 'main';
const BRANCH_PREFIX = 'jules-auto';
const GITHUB_REPO = 'whodaniel/fuse';
const MAX_SESSIONS = 15;
const POLL_INTERVAL_MS = 30_000; // 30s between status polls
const JULES_API_BASE = process.env.JULES_API_BASE_URL || 'https://jules.googleapis.com';
const JULES_API_KEY = process.env.JULES_API_KEY || '';

// ── Helpers ──────────────────────────────────────────────────────────────────
function sh(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: REPO_ROOT,
      ...opts,
    }).trim();
  } catch (e) {
    throw new Error(`Command failed: ${cmd}\n${(e.stderr || e.message || '').slice(0, 400)}`);
  }
}

function shSafe(cmd, opts = {}) {
  const result = spawnSync('bash', ['-c', cmd], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
    ...opts,
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    status: result.status,
  };
}

function isManualFrontendViewingTask(task) {
  const normalized = String(task || '').toLowerCase();
  const manualIntent =
    /(manual|manually|visual|visually|look at|view|see|browser|screenshot|screen recording|human qa|click through|ui review|ux review)/;
  const frontendSurface = /(frontend|ui|ux|page|screen|route|component|website|web app|browser)/;
  const explicitPhrases =
    /(manual\s+(frontend|ui|ux|browser|website|testing)|visual\s+(qa|review|check|inspection))/;
  return (
    explicitPhrases.test(normalized) ||
    (manualIntent.test(normalized) && frontendSurface.test(normalized))
  );
}

function log(msg) {
  process.stdout.write(msg + '\n');
}
function sep() {
  log('─'.repeat(50));
}

function clearIndexLock() {
  const lockFile = path.join(REPO_ROOT, '.git/index.lock');
  if (fs.existsSync(lockFile)) {
    try {
      const ageMs = Date.now() - fs.statSync(lockFile).mtimeMs;
      if (ageMs < 120_000) {
        log(`WARNING: .git/index.lock exists and appears active (${Math.round(ageMs / 1000)}s old).`);
        return;
      }
      fs.unlinkSync(lockFile);
      log('WARNING: Removed stale .git/index.lock');
    } catch (error) {
      log(`WARNING: Failed to remove .git/index.lock: ${String(error.message || error)}`);
    }
  }
}

function normalizeJulesStatus(rawStatus) {
  const value = String(rawStatus || '')
    .trim()
    .toUpperCase();
  if (!value) return 'REVIEW';
  if (value === 'PLANNING') return 'PLANNING';
  if (value === 'IN PROGRESS') return 'RUNNING';
  if (value === 'IN_PROGRESS') return 'RUNNING';
  if (value.startsWith('AWAITING PLAN')) return 'AWAITING_PLAN_APPROVAL';
  if (value === 'AWAITING_PLAN_APPROVAL') return 'AWAITING_PLAN_APPROVAL';
  if (value === 'COMPLETED') return 'COMPLETED';
  if (value === 'RUNNING') return 'RUNNING';
  if (value === 'FAILED') return 'FAILED';
  if (value === 'PENDING') return 'PENDING';
  if (value === 'CANCELLED') return 'CANCELLED';
  if (value === 'REVIEW') return 'REVIEW';
  return 'UNKNOWN';
}

async function fetchSessionMetaFromApi(id) {
  if (!JULES_API_KEY) return null;
  const url =
    `${JULES_API_BASE.replace(/\/$/, '')}/v1alpha/sessions/${id}` +
    '?fields=id,state,url,outputs(pullRequest)';
  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': JULES_API_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`GET session ${id} failed (${response.status})`);
  }
  const json = await response.json();
  const prUrls = (json.outputs || [])
    .map((o) => (o && o.pullRequest && o.pullRequest.url ? o.pullRequest.url : null))
    .filter(Boolean);
  return {
    state: normalizeJulesStatus(json.state),
    url: json.url || null,
    prUrl: prUrls[0] || null,
  };
}

// ── State management ─────────────────────────────────────────────────────────
function loadState() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) return { sessions: {}, updatedAt: null };
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { sessions: {}, updatedAt: null };
  }
}

function saveState(state) {
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Command: status ───────────────────────────────────────────────────────────
async function cmdStatus() {
  log('=== Checking Jules session status ===\n');
  const state = loadState();

  // Also pick up any sessions from the legacy session IDs file
  const legacyFile = path.join(LOG_DIR, 'jules-15-session-ids.txt');
  if (fs.existsSync(legacyFile)) {
    const ids = fs
      .readFileSync(legacyFile, 'utf8')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const id of ids) {
      if (!state.sessions[id]) {
        state.sessions[id] = { id, startedAt: null, task: 'imported', status: 'UNKNOWN' };
      }
    }
  }

  const sessionIds = Object.keys(state.sessions);
  if (sessionIds.length === 0) {
    log('No sessions tracked. Run: node scripts/jules-pipeline.cjs start <task-file>');
    return state;
  }

  log(`Checking ${sessionIds.length} sessions...\n`);

  // Use jules remote list --session to get current statuses.
  // Table is column-aligned with multi-space separators. Some rows currently
  // come back with empty status; treat those as REVIEW rather than UNKNOWN.
  const listResult = shSafe('jules remote list --session 2>/dev/null');
  let julesStatuses = {};

  if (listResult.stdout) {
    for (const line of listResult.stdout.split('\n')) {
      const trimmed = line.trimEnd();
      const idMatch = trimmed.match(/^\s*(\d{15,20})\s+/);
      if (!idMatch) continue;

      const parts = trimmed.trim().split(/\s{2,}/);
      const lineId = idMatch[1];
      const statusPart = parts.length >= 5 ? parts[4] : '';
      julesStatuses[lineId] = normalizeJulesStatus(statusPart);
    }
  }

  // API is source-of-truth for PR URLs and final state transitions.
  // If API credentials are missing we still keep CLI status behavior.
  const apiMeta = {};
  if (JULES_API_KEY) {
    for (const id of sessionIds) {
      try {
        const meta = await fetchSessionMetaFromApi(id);
        if (meta) apiMeta[id] = meta;
      } catch (error) {
        log(`  ⚠️ API refresh failed for ${id}: ${(error.message || String(error)).slice(0, 120)}`);
      }
    }
  }

  // Update state and display
  let completed = 0,
    running = 0,
    planning = 0,
    awaitingPlan = 0,
    failed = 0,
    review = 0,
    pending = 0,
    cancelled = 0,
    unknown = 0;
  for (const id of sessionIds) {
    const session = state.sessions[id];
    const apiStatus = apiMeta[id]?.state || '';
    const newStatus = apiStatus || julesStatuses[id] || session.status;
    session.status = newStatus;
    session.lastChecked = new Date().toISOString();
    if (apiMeta[id]?.url) session.url = apiMeta[id].url;
    if (apiMeta[id]?.prUrl) session.prUrl = apiMeta[id].prUrl;

    const icon =
      newStatus === 'COMPLETED'
        ? '✅'
        : newStatus === 'RUNNING'
          ? '🔄'
          : newStatus === 'PLANNING'
            ? '🧭'
            : newStatus === 'AWAITING_PLAN_APPROVAL'
              ? '📝'
          : newStatus === 'FAILED'
            ? '❌'
            : newStatus === 'REVIEW'
              ? '👁️'
              : '❓';

    const branchStatus = session.branch ? `branch:${session.branch}` : '';
    const prStatus = session.prUrl ? `PR:${session.prUrl}` : '';
    log(`  ${icon} ${id} [${newStatus}] ${branchStatus} ${prStatus}`);

    if (newStatus === 'COMPLETED') completed++;
    else if (newStatus === 'RUNNING') running++;
    else if (newStatus === 'PLANNING') planning++;
    else if (newStatus === 'AWAITING_PLAN_APPROVAL') awaitingPlan++;
    else if (newStatus === 'FAILED') failed++;
    else if (newStatus === 'REVIEW') review++;
    else if (newStatus === 'PENDING') pending++;
    else if (newStatus === 'CANCELLED') cancelled++;
    else unknown++;
  }

  log(
    `\nSummary: ✅ ${completed} completed | 🧭 ${planning} planning | 📝 ${awaitingPlan} awaiting-plan | 👁️ ${review} review | 🔄 ${running} running | ⏳ ${pending} pending | ⛔ ${cancelled} cancelled | ❌ ${failed} failed | ❓ ${unknown} unknown`
  );
  saveState(state);
  return state;
}

// ── Command: publish ──────────────────────────────────────────────────────────
async function cmdPublish() {
  log('=== Publishing completed Jules sessions as branches ===\n');
  const state = loadState();

  // Fetch latest main
  sh(`git fetch origin ${BASE_BRANCH} --quiet`);
  const baseCommit = sh(`git rev-parse origin/${BASE_BRANCH}`);
  log(`Base commit: ${baseCommit.slice(0, 12)}\n`);

  // Remove stale lock if present
  clearIndexLock();

  const toPublish = Object.values(state.sessions).filter(
    (s) =>
      !s.branch && (s.status === 'COMPLETED' || s.status === 'REVIEW' || s.status === 'UNKNOWN')
  );

  if (toPublish.length === 0) {
    log('No sessions ready to publish (all either already published or not completed).');
    return;
  }

  log(`Publishing ${toPublish.length} sessions...\n`);

  for (const session of toPublish) {
    const { id } = session;
    sep();
    log(`Session: ${id}`);

    const branchName = `${BRANCH_PREFIX}/${id}`;
    const patchFile = path.join(os.tmpdir(), `jules-patch-${id}.diff`);

    try {
      // Check if branch already exists on remote
      const remoteCheck = shSafe(`git ls-remote --exit-code --heads origin ${branchName}`);
      if (remoteCheck.ok) {
        log(`  Branch already exists on remote: ${branchName}`);
        session.branch = branchName;
        saveState(state);
        continue;
      }

      // Pull patch from Jules
      log(`  Pulling patch...`);
      const pullResult = shSafe(`jules remote pull --session ${id}`);
      if (!pullResult.ok || !pullResult.stdout || pullResult.stdout.length < 50) {
        log(`  ⚠️  No patch available (session may not be finalized yet)`);
        log(`  stderr: ${pullResult.stderr.slice(0, 100)}`);
        continue;
      }

      fs.writeFileSync(patchFile, pullResult.stdout);
      log(`  Patch: ${Buffer.byteLength(pullResult.stdout, 'utf8')} bytes`);

      // Apply patch to working tree (needs main repo for --3way object store)
      clearIndexLock();
      log(`  Applying patch (--3way)...`);
      const applyResult = shSafe(`git apply --3way --ignore-whitespace ${patchFile}`);
      log(`  apply exit=${applyResult.status}`);
      if (applyResult.stderr) {
        log(`  apply stderr: ${applyResult.stderr.slice(0, 160)}`);
      }

      // Do not proceed if apply failed and produced no file changes.
      if (!applyResult.ok) {
        const postApplyStatus = shSafe('git status --porcelain');
        if (!postApplyStatus.stdout) {
          log('  No changes after failed apply. Skipping.');
          fs.unlinkSync(patchFile);
          continue;
        }
      }

      // Stage everything (including conflict markers from --3way)
      const addResult = shSafe('git add -A');
      if (!addResult.ok) {
        log(`  ❌ git add failed: ${addResult.stderr.slice(0, 160)}`);
        shSafe(
          'git restore --staged . 2>/dev/null; git restore . 2>/dev/null; git clean -fd apps/ packages/ src/ 2>/dev/null'
        );
        fs.unlinkSync(patchFile);
        continue;
      }

      // Check if anything actually changed vs HEAD
      const diffCheck = shSafe(`git diff --cached --quiet`);
      if (diffCheck.ok) {
        log(`  No changes after apply. Skipping.`);
        shSafe(
          'git restore --staged . 2>/dev/null; git restore . 2>/dev/null; git clean -fd apps/ packages/ 2>/dev/null'
        );
        fs.unlinkSync(patchFile);
        continue;
      }

      // Capture tree
      const treeHash = sh('git write-tree');
      log(`  Tree: ${treeHash.slice(0, 12)}`);

      // Restore working tree (undo the apply — we captured the tree already)
      sh('git restore --staged .');
      sh('git restore .');
      shSafe('git clean -fd apps/ packages/ src/ 2>/dev/null');

      // Build commit message
      let applyNotes = '';
      if (
        !applyResult.ok ||
        applyResult.stderr.includes('conflict') ||
        applyResult.stderr.includes('Falling back')
      ) {
        applyNotes = 'Applied with 3way merge (some conflicts resolved automatically)';
      }

      const commitMsg = [
        `feat: Jules session ${id}`,
        '',
        `Session URL: https://jules.google.com/session/${id}`,
        `Base: ${baseCommit.slice(0, 12)}`,
        applyNotes,
      ]
        .filter(Boolean)
        .join('\n');

      // Create commit + branch ref (no checkout!)
      const commitHash = sh(
        `git commit-tree ${treeHash} -p ${baseCommit} -m ${JSON.stringify(commitMsg)}`
      );
      sh(`git update-ref refs/heads/${branchName} ${commitHash}`);
      log(`  Commit: ${commitHash.slice(0, 12)}`);

      // Push
      log(`  Pushing ${branchName}...`);
      const pushResult = shSafe(`git push origin ${branchName} --force`);
      if (!pushResult.ok) {
        log(`  ❌ Push failed: ${pushResult.stderr.slice(0, 100)}`);
        continue;
      }

      session.branch = branchName;
      session.publishedAt = new Date().toISOString();
      session.applyNotes = applyNotes;
      saveState(state);
      log(`  ✅ Published: ${branchName}`);

      fs.unlinkSync(patchFile);
    } catch (err) {
      log(`  ❌ Exception: ${err.message.slice(0, 150)}`);
      // Always restore clean state
      clearIndexLock();
      shSafe('git restore --staged . 2>/dev/null; git restore . 2>/dev/null');
      shSafe('git clean -fd apps/ packages/ src/ 2>/dev/null');
      if (fs.existsSync(patchFile)) fs.unlinkSync(patchFile);
    } finally {
      clearIndexLock();
    }

    log('');
  }
}

// ── Command: pr ───────────────────────────────────────────────────────────────
async function cmdPr() {
  log('=== Opening draft PRs for published branches ===\n');
  const state = loadState();

  // Also check for jules-auto/* branches on remote that aren't in state
  sh(`git fetch origin --quiet`);
  const remoteBranches = sh(`git branch -r`)
    .split('\n')
    .map((b) => b.trim().replace('origin/', ''))
    .filter((b) => b.startsWith(`${BRANCH_PREFIX}/`));

  for (const branch of remoteBranches) {
    const id = branch.replace(`${BRANCH_PREFIX}/`, '');
    if (!state.sessions[id]) {
      state.sessions[id] = { id, branch, status: 'COMPLETED', task: 'imported' };
    } else {
      state.sessions[id].branch = branch;
    }
  }

  const withBranch = Object.values(state.sessions).filter((s) => s.branch && !s.prUrl);
  if (withBranch.length === 0) {
    log('All published sessions already have PRs.');
    return;
  }

  log(`Creating PRs for ${withBranch.length} branches...\n`);

  for (const session of withBranch) {
    const { id, branch } = session;
    sep();
    log(`Branch: ${branch}`);

    // Check if PR already exists
    const existing = shSafe(
      `gh pr list --repo ${GITHUB_REPO} --head ${branch} --json url --jq '.[0].url'`
    );
    if (existing.ok && existing.stdout && existing.stdout !== 'null') {
      log(`  PR already exists: ${existing.stdout}`);
      session.prUrl = existing.stdout;
      saveState(state);
      continue;
    }

    const prBody = [
      '## Jules Session Auto-Publish',
      '',
      `**Session ID:** \`${id}\``,
      `**Session URL:** https://jules.google.com/session/${id}`,
      session.task ? `**Task:** ${session.task}` : '',
      session.applyNotes ? `**Notes:** ${session.applyNotes}` : '',
      '',
      'Auto-published by `jules-pipeline.cjs`.',
    ]
      .filter((l) => l !== undefined)
      .join('\n');

    const prTitle = `Jules: ${id}`;
    const prResult = shSafe(
      `gh pr create --repo ${GITHUB_REPO} --base ${BASE_BRANCH} --head ${branch} ` +
        `--title ${JSON.stringify(prTitle)} ` +
        `--body ${JSON.stringify(prBody)} --draft`
    );

    if (prResult.ok && prResult.stdout) {
      log(`  ✅ PR created: ${prResult.stdout}`);
      session.prUrl = prResult.stdout;
    } else {
      log(`  ❌ PR failed: ${prResult.stderr.slice(0, 100)}`);
    }

    saveState(state);
    log('');
  }
}

// ── Command: start ────────────────────────────────────────────────────────────
async function cmdStart(taskFile) {
  if (!taskFile || !fs.existsSync(taskFile)) {
    log(`ERROR: Task file not found: ${taskFile}`);
    log('Format: one task description per line');
    process.exit(1);
  }

  const tasks = fs
    .readFileSync(taskFile, 'utf8')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_SESSIONS);

  log(`=== Starting ${tasks.length} Jules sessions ===\n`);
  const state = loadState();

  for (const task of tasks) {
    if (isManualFrontendViewingTask(task)) {
      log(`Skipping blocked task (manual frontend/browser viewing): ${task.slice(0, 80)}...`);
      continue;
    }
    log(`Starting: ${task.slice(0, 60)}...`);
    // jules remote new --repo <owner/repo> --session "<description>"
    const result = shSafe(
      `jules remote new --repo ${GITHUB_REPO} --session ${JSON.stringify(task)}`
    );
    if (result.ok && result.stdout) {
      // Extract session ID from output (numeric, 15-20 digits)
      const idMatch = result.stdout.match(/\b(\d{15,20})\b/);
      if (idMatch) {
        const id = idMatch[1];
        state.sessions[id] = {
          id,
          task,
          status: 'RUNNING',
          startedAt: new Date().toISOString(),
          branch: null,
          prUrl: null,
        };
        log(`  ✅ Started: ${id}`);
        saveState(state);
      } else {
        log(`  ⚠️  Started but couldn't parse session ID from: ${result.stdout.slice(0, 100)}`);
        log(`  Full output: ${result.stdout.slice(0, 200)}`);
      }
    } else {
      log(`  ❌ Failed to start: ${result.stderr.slice(0, 150)}`);
    }
  }

  log(`\nState saved to: ${STATE_FILE}`);
}

// ── Command: merge ────────────────────────────────────────────────────────────
async function cmdMerge() {
  log('=== Checking PRs for merge readiness ===\n');
  const state = loadState();

  const withPr = Object.values(state.sessions).filter((s) => s.prUrl);
  if (withPr.length === 0) {
    log('No PRs to check. Run: node scripts/jules-pipeline.cjs pr');
    return;
  }

  for (const session of withPr) {
    const { id, prUrl } = session;
    const prNum = prUrl.split('/').pop();
    sep();
    log(`PR #${prNum}: ${prUrl}`);

    // Check PR status
    const prStatus = shSafe(
      `gh pr view ${prNum} --repo ${GITHUB_REPO} --json mergeable,mergeStateStatus,reviewDecision,title --jq '{mergeable,mergeStateStatus,reviewDecision,title}'`
    );

    if (!prStatus.ok) {
      log(`  ⚠️  Could not check PR status`);
      continue;
    }

    try {
      const info = JSON.parse(prStatus.stdout);
      log(`  Title: ${info.title}`);
      log(
        `  Mergeable: ${info.mergeable} | State: ${info.mergeStateStatus} | Review: ${info.reviewDecision || 'none'}`
      );

      if (info.mergeable === 'MERGEABLE' && info.mergeStateStatus === 'CLEAN') {
        log(`  ✅ Ready to merge! Run: gh pr merge ${prNum} --repo ${GITHUB_REPO} --squash`);
        session.mergeReady = true;
      } else if (info.mergeable === 'CONFLICTING') {
        log(`  ⚠️  Has conflicts — needs manual resolution`);
        session.mergeReady = false;
      } else {
        log(`  ⏳ Not yet mergeable (${info.mergeStateStatus})`);
      }
    } catch {
      log(`  Raw: ${prStatus.stdout.slice(0, 100)}`);
    }

    saveState(state);
    log('');
  }
}

// ── Command: all ──────────────────────────────────────────────────────────────
async function cmdAll(taskFile) {
  await cmdStart(taskFile);

  log('\n=== Polling until all sessions complete ===\n');
  let allDone = false;
  let attempts = 0;
  const maxAttempts = 120; // 1 hour at 30s intervals

  while (!allDone && attempts < maxAttempts) {
    attempts++;
    const state = await cmdStatus();
    const sessions = Object.values(state.sessions);
    const pending = sessions.filter(
      (s) =>
        s.status === 'RUNNING' ||
        s.status === 'PENDING' ||
        s.status === 'UNKNOWN' ||
        s.status === 'PLANNING' ||
        s.status === 'AWAITING_PLAN_APPROVAL'
    );

    if (pending.length === 0) {
      allDone = true;
      log('\nAll sessions completed!');
    } else {
      log(`\n${pending.length} sessions still running. Waiting ${POLL_INTERVAL_MS / 1000}s...\n`);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }

  await cmdPublish();
  await cmdPr();
  log('\n=== Pipeline complete ===');
  await cmdMerge();
}

// ── Main ──────────────────────────────────────────────────────────────────────
const [, , command, ...rest] = process.argv;

(async () => {
  switch (command) {
    case 'start':
      await cmdStart(rest[0]);
      break;
    case 'status':
      await cmdStatus();
      break;
    case 'publish':
      await cmdPublish();
      break;
    case 'pr':
      await cmdPr();
      break;
    case 'merge':
      await cmdMerge();
      break;
    case 'all':
      await cmdAll(rest[0]);
      break;
    default:
      log('Jules Pipeline - Full lifecycle manager\n');
      log('Usage:');
      log('  node scripts/jules-pipeline.cjs start <task-file>  # Start sessions');
      log('  node scripts/jules-pipeline.cjs status             # Check all statuses');
      log('  node scripts/jules-pipeline.cjs publish            # Publish completed sessions');
      log('  node scripts/jules-pipeline.cjs pr                 # Open draft PRs');
      log('  node scripts/jules-pipeline.cjs merge              # Check merge readiness');
      log('  node scripts/jules-pipeline.cjs all <task-file>    # Full pipeline');
      log('');
      log(`State file: ${STATE_FILE}`);
  }
})().catch((err) => {
  log(`\nFATAL: ${err.message}`);
  process.exit(1);
});
