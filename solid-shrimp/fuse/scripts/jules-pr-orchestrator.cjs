#!/usr/bin/env node
/**
 * Jules PR Orchestrator
 *
 * Purpose:
 * - Track delegated Jules sessions
 * - Trigger PR creation follow-ups
 * - Generate merge handoff board with GitHub actions
 *
 * Usage:
 *   node scripts/jules-pr-orchestrator.cjs status --sessions-file /tmp/jules15.txt
 *   node scripts/jules-pr-orchestrator.cjs trigger-pr --sessions-file /tmp/jules15.txt
 *   node scripts/jules-pr-orchestrator.cjs handoff --sessions-file /tmp/jules15.txt
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.JULES_API_BASE_URL || 'https://jules.googleapis.com';
const API_KEY = process.env.JULES_API_KEY || '';
const LOG_DIR = path.join('.agent', 'jules-logs');

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const getArg = (name, fallback) => {
    const idx = args.findIndex((a) => a === name);
    if (idx >= 0 && args[idx + 1]) return args[idx + 1];
    return fallback;
  };

  return {
    command,
    sessionsFile: getArg('--sessions-file', '/tmp/jules15.txt'),
    intervalMs: Number(getArg('--interval-ms', '15000')),
    timeoutMs: Number(getArg('--timeout-ms', '900000')),
    prompt: getArg('--prompt', ''),
  };
}

function ensureAuth() {
  if (!API_KEY) {
    throw new Error(
      'Missing JULES_API_KEY in environment. Load .env.local before running this script.'
    );
  }
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function readSessionIds(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Sessions file not found: ${filePath}`);
  }
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function apiGetSession(id) {
  const url = `${API_BASE.replace(/\/$/, '')}/v1alpha/sessions/${id}?fields=id,state,title,createTime,updateTime,url,outputs(pullRequest)`;
  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET session ${id} failed (${response.status}): ${text}`);
  }
  const json = await response.json();
  const prUrls = (json.outputs || [])
    .map((o) => (o && o.pullRequest && o.pullRequest.url ? o.pullRequest.url : null))
    .filter(Boolean);
  return { ...json, prUrls };
}

async function apiSendMessage(id, prompt) {
  const url = `${API_BASE.replace(/\/$/, '')}/v1alpha/sessions/${id}:sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`sendMessage ${id} failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function apiApprovePlan(id) {
  const url = `${API_BASE.replace(/\/$/, '')}/v1alpha/sessions/${id}:approvePlan`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`approvePlan ${id} failed (${response.status}): ${text}`);
  }
  return response.json();
}

function toMs(iso) {
  if (!iso) return null;
  const n = Date.parse(iso);
  return Number.isFinite(n) ? n : null;
}

function durationMs(startIso, endIso) {
  const a = toMs(startIso);
  const b = toMs(endIso);
  if (a == null || b == null) return null;
  return Math.max(0, b - a);
}

function fmtDuration(ms) {
  if (ms == null) return 'n/a';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function extractPrNumber(prUrl) {
  const m = String(prUrl).match(/\/pull\/(\d+)(?:\/|$)/);
  return m ? m[1] : null;
}

function summarizeBatchTiming(sessions) {
  const creates = sessions.map((s) => toMs(s.createTime)).filter((v) => v != null);
  const updates = sessions.map((s) => toMs(s.updateTime)).filter((v) => v != null);
  if (creates.length === 0 || updates.length === 0) {
    return { windowMs: null, minCreate: null, maxUpdate: null };
  }
  const minCreate = Math.min(...creates);
  const maxUpdate = Math.max(...updates);
  return { windowMs: Math.max(0, maxUpdate - minCreate), minCreate, maxUpdate };
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function writeJsonLog(name, payload) {
  ensureLogDir();
  const file = path.join(LOG_DIR, `${name}-${nowStamp()}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

function writeMarkdownHandoff(sessions, filePath) {
  const lines = [];
  const timing = summarizeBatchTiming(sessions);
  const withPr = sessions.filter((s) => s.prUrls && s.prUrls.length > 0);
  const withoutPr = sessions.filter((s) => !s.prUrls || s.prUrls.length === 0);

  lines.push('# Jules PR Merge Handoff');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Batch Timing');
  lines.push(`- Sessions tracked: ${sessions.length}`);
  lines.push(`- Earliest createTime: ${timing.minCreate ? new Date(timing.minCreate).toISOString() : 'n/a'}`);
  lines.push(`- Latest updateTime: ${timing.maxUpdate ? new Date(timing.maxUpdate).toISOString() : 'n/a'}`);
  lines.push(`- Total batch window: ${fmtDuration(timing.windowMs)}`);
  lines.push('');
  lines.push('## PR Coverage');
  lines.push(`- Sessions with PR URLs: ${withPr.length}`);
  lines.push(`- Sessions awaiting PR URLs: ${withoutPr.length}`);
  lines.push('');
  lines.push('## Merge Queue');
  lines.push('| Session ID | State | Session URL | PR URL | Action |');
  lines.push('|---|---|---|---|---|');
  for (const s of sessions) {
    const pr = s.prUrls && s.prUrls[0] ? s.prUrls[0] : '';
    const action = pr ? 'Review + merge' : 'Await PR creation completion';
    lines.push(`| ${s.id} | ${s.state || ''} | ${s.url || ''} | ${pr} | ${action} |`);
  }
  lines.push('');
  lines.push('## Merge Procedure');
  lines.push('1. Pull latest main and ensure clean working tree before each PR.');
  lines.push('2. Review PR diff + CI + risk scope.');
  lines.push('3. Merge low-risk PRs first (docs/tooling), then routing/auth, then framework/core.');
  lines.push('4. Re-run core quality gates after each merge wave.');
  lines.push('');
  lines.push('```bash');
  lines.push('gh pr view <PR_URL>');
  lines.push('gh pr checkout <PR_NUMBER>');
  lines.push('# run tests/build here');
  lines.push('gh pr merge <PR_NUMBER> --squash --delete-branch');
  lines.push('```');
  lines.push('');
  lines.push('## PR-Specific Commands');
  for (const s of withPr) {
    const pr = s.prUrls[0];
    const num = extractPrNumber(pr);
    if (!num) continue;
    lines.push(`- ${s.id}`);
    lines.push(`  - view: \`gh pr view ${pr}\``);
    lines.push(`  - checkout: \`gh pr checkout ${num}\``);
    lines.push(`  - merge: \`gh pr merge ${num} --squash --delete-branch\``);
  }

  fs.writeFileSync(filePath, lines.join('\n') + '\n');
}

async function fetchAll(ids) {
  const results = [];
  for (const id of ids) {
    // Sequential requests for stability/rate safety.
    const session = await apiGetSession(id);
    results.push(session);
  }
  return results;
}

async function cmdStatus(ids) {
  const sessions = await fetchAll(ids);
  const timing = summarizeBatchTiming(sessions);
  const withPr = sessions.filter((s) => s.prUrls.length > 0).length;
  console.log(`sessions=${sessions.length} with_pr=${withPr} without_pr=${sessions.length - withPr}`);
  console.log(`batch_window=${fmtDuration(timing.windowMs)}`);
  for (const s of sessions) {
    console.log(
      `${s.id} | ${s.state} | duration=${fmtDuration(durationMs(s.createTime, s.updateTime))} | pr=${s.prUrls[0] || ''}`
    );
  }
  const file = writeJsonLog('jules-pr-status', { sessions, timing });
  console.log(`status_log=${file}`);
}

async function cmdTriggerPr(ids) {
  const triggerPrompt =
    'Please create a GitHub pull request for this completed changeset against the main branch of whodaniel/fuse. Include a clear title, summary of changes, and verification notes.';
  const before = await fetchAll(ids);
  const target = before.filter((s) => s.state === 'COMPLETED' && s.prUrls.length === 0);

  for (const s of target) {
    await apiSendMessage(s.id, triggerPrompt);
    console.log(`triggered ${s.id}`);
  }

  const file = writeJsonLog('jules-pr-trigger', {
    triggeredAt: new Date().toISOString(),
    attempted: target.map((s) => s.id),
    prompt: triggerPrompt,
  });
  console.log(`trigger_log=${file}`);
}

async function cmdTrigger(ids, promptOverride) {
  const triggerPrompt =
    promptOverride ||
    'Please create a GitHub pull request for this completed changeset against the main branch of whodaniel/fuse. Include a clear title, summary of changes, and verification notes.';
  const before = await fetchAll(ids);
  const target = before.filter((s) => s.state === 'COMPLETED' && s.prUrls.length === 0);

  for (const s of target) {
    await apiSendMessage(s.id, triggerPrompt);
    console.log(`triggered ${s.id}`);
  }

  const file = writeJsonLog('jules-pr-trigger', {
    triggeredAt: new Date().toISOString(),
    attempted: target.map((s) => s.id),
    prompt: triggerPrompt,
  });
  console.log(`trigger_log=${file}`);
}

async function cmdHandoff(ids) {
  const sessions = await fetchAll(ids);
  ensureLogDir();
  const filePath = path.join(LOG_DIR, `jules-pr-merge-handoff-${nowStamp()}.md`);
  writeMarkdownHandoff(sessions, filePath);
  console.log(`handoff_file=${filePath}`);
}

async function cmdApprovePlans(ids) {
  const sessions = await fetchAll(ids);
  const target = sessions.filter((s) => s.prUrls.length === 0);
  const approved = [];
  const skipped = [];

  for (const s of target) {
    try {
      await apiApprovePlan(s.id);
      approved.push(s.id);
      console.log(`approved ${s.id}`);
    } catch (error) {
      skipped.push({ id: s.id, reason: String(error.message || error) });
      console.log(`skipped ${s.id}`);
    }
  }

  const file = writeJsonLog('jules-plan-approvals', {
    at: new Date().toISOString(),
    approved,
    skipped,
  });
  console.log(`approval_log=${file}`);
}

async function cmdAdvance(ids, promptOverride) {
  const sessions = await fetchAll(ids);
  const noPr = sessions.filter((s) => s.prUrls.length === 0);
  const prompt =
    promptOverride ||
    "Required follow-up: use 'Publish Branch' now, then open a GitHub PR to whodaniel/fuse main. Reply with BRANCH and PR_URL.";

  const approved = [];
  const triggered = [];
  const skippedApprovals = [];

  for (const s of noPr) {
    try {
      await apiApprovePlan(s.id);
      approved.push(s.id);
    } catch (error) {
      skippedApprovals.push({ id: s.id, reason: String(error.message || error) });
    }
  }

  const refreshed = await fetchAll(ids);
  const completedNoPr = refreshed.filter((s) => s.state === 'COMPLETED' && s.prUrls.length === 0);
  for (const s of completedNoPr) {
    await apiSendMessage(s.id, prompt);
    triggered.push(s.id);
  }

  const file = writeJsonLog('jules-advance-pass', {
    at: new Date().toISOString(),
    approved,
    skippedApprovals,
    triggered,
    prompt,
  });
  console.log(`advance_log=${file}`);
  console.log(`advance_summary approved=${approved.length} triggered=${triggered.length}`);
}

async function cmdWatch(ids, intervalMs, timeoutMs) {
  const start = Date.now();
  const seenTriggered = new Set();
  const triggerPrompt =
    'Please create a GitHub pull request for this completed changeset against the main branch of whodaniel/fuse. Include a clear title, summary of changes, and verification notes.';

  while (Date.now() - start < timeoutMs) {
    const sessions = await fetchAll(ids);
    const withoutPr = sessions.filter((s) => s.prUrls.length === 0);
    const inProgress = sessions.filter((s) => s.state === 'IN_PROGRESS').length;
    const withPr = sessions.length - withoutPr.length;

    // Trigger follow-up for sessions that are completed but still missing PR.
    for (const s of withoutPr) {
      if (s.state === 'COMPLETED' && !seenTriggered.has(s.id)) {
        await apiSendMessage(s.id, triggerPrompt);
        seenTriggered.add(s.id);
        console.log(`triggered ${s.id}`);
      }
    }

    const handoffPath = path.join(LOG_DIR, `jules-pr-merge-handoff-${nowStamp()}.md`);
    ensureLogDir();
    writeMarkdownHandoff(sessions, handoffPath);
    console.log(
      `watch status: with_pr=${withPr}/${sessions.length}, in_progress=${inProgress}, handoff=${handoffPath}`
    );

    if (withPr === sessions.length) {
      console.log('All sessions now have PR URLs.');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Watch timeout exceeded (${timeoutMs}ms)`);
}

async function main() {
  const args = parseArgs();
  ensureAuth();
  const ids = readSessionIds(args.sessionsFile);

  switch (args.command) {
    case 'status':
      await cmdStatus(ids);
      break;
    case 'trigger-pr':
      await cmdTriggerPr(ids);
      break;
    case 'trigger':
      await cmdTrigger(ids, args.prompt);
      break;
    case 'handoff':
      await cmdHandoff(ids);
      break;
    case 'approve-plans':
      await cmdApprovePlans(ids);
      break;
    case 'advance':
      await cmdAdvance(ids, args.prompt);
      break;
    case 'watch':
      await cmdWatch(ids, args.intervalMs, args.timeoutMs);
      break;
    default:
      throw new Error(`Unknown command: ${args.command}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
