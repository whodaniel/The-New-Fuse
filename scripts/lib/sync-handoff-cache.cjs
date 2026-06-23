#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Sync ~/.tnf/handoff-current.json from canonical SESSION_HANDOFF_LATEST.json.
 * Used by onboard, emit-session-handoff, and tnf boot.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function resolveRepoRoot(explicit) {
  if (explicit && fs.existsSync(path.join(explicit, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'))) {
    return explicit;
  }
  const env = process.env.TNF_REPO_DIR || process.env.TNF_REPO;
  if (env && fs.existsSync(path.join(env, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'))) {
    return env;
  }
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'))) {
    return cwd;
  }
  const fallback = path.join(os.homedir(), 'Desktop/A1-Inter-LLM-Com/The-New-Fuse');
  if (fs.existsSync(path.join(fallback, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'))) {
    return fallback;
  }
  return cwd;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function buildCacheSummary(handoff, sourcePath) {
  const continuation =
    handoff.continuation && typeof handoff.continuation === 'object' ? handoff.continuation : {};
  const workSummary = Array.isArray(handoff.work_summary) ? handoff.work_summary : [];
  const nextActions = Array.isArray(handoff.next_actions) ? handoff.next_actions : [];
  const resumeChecklist = Array.isArray(continuation.resume_checklist)
    ? continuation.resume_checklist
    : [];

  return {
    sessionKey: handoff.handoff_id || handoff.sessionKey || null,
    handoff_id: handoff.handoff_id || null,
    generatedAt: handoff.created_at || handoff.generatedAt || null,
    MISSION: workSummary.length ? [workSummary[0]] : ['TNF handoff loaded from canonical SESSION_HANDOFF_LATEST.json'],
    STATE: workSummary,
    IMMEDIATE_TASKS: nextActions,
    POINTERS: resumeChecklist,
    HANDOFF_HISTORY: [
      [
        handoff.created_at || 'unknown',
        handoff.repository || 'TNF',
        handoff.branch || 'unknown',
        handoff.handoff_id || '',
      ]
        .join(' ')
        .trim(),
    ],
    CLOUD_HEALTH: readJson(
      path.join(os.homedir(), '.openclaw/workspace/handoff/cloudflare-health.json'),
    ) || {},
    SOURCE: sourcePath,
    priority: continuation.priority || handoff.priority || null,
    branch: handoff.branch || null,
    head_sha: handoff.head_sha || null,
  };
}

function syncFromRepo(repoRoot) {
  const root = resolveRepoRoot(repoRoot);
  const canonicalPath = path.join(root, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
  const cachePath = path.join(os.homedir(), '.tnf', 'handoff-current.json');

  if (!fs.existsSync(canonicalPath)) {
    return { ok: false, reason: 'canonical-missing', canonicalPath };
  }

  const handoff = readJson(canonicalPath);
  if (!handoff || typeof handoff !== 'object') {
    return { ok: false, reason: 'canonical-invalid', canonicalPath };
  }

  const summary = buildCacheSummary(handoff, canonicalPath);
  summary.UPDATED = new Date().toISOString();

  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  return {
    ok: true,
    cachePath,
    handoff_id: handoff.handoff_id || null,
    created_at: handoff.created_at || null,
    taskCount: summary.IMMEDIATE_TASKS.length,
  };
}

function main() {
  const repoFlag = process.argv.indexOf('--repo');
  const repoRoot = repoFlag >= 0 ? process.argv[repoFlag + 1] : undefined;
  const result = syncFromRepo(repoRoot);
  if (!result.ok) {
    console.error(`[sync-handoff-cache] failed: ${result.reason}`);
    process.exit(1);
  }
  console.log(
    `[sync-handoff-cache] updated ${result.cachePath} (${result.handoff_id}, ${result.taskCount} tasks)`,
  );
}

if (require.main === module) {
  main();
}

module.exports = { syncFromRepo, buildCacheSummary };
