#!/usr/bin/env node
/**
 * Publish Jules session outputs as GitHub PRs without UI clicking.
 *
 * Flow per session:
 * 1) Fetch session JSON from Jules API
 * 2) Extract unidiff patch + suggested commit message
 * 3) Create temp git worktree from origin/main
 * 4) Apply patch, commit, push branch
 * 5) Open draft PR via gh CLI
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const API_BASE = process.env.JULES_API_BASE_URL || 'https://jules.googleapis.com';
const API_KEY = process.env.JULES_API_KEY || '';

function run(bin, args, opts = {}) {
  return execFileSync(bin, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...opts,
  }).trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const getArg = (name, fallback) => {
    const i = args.findIndex((a) => a === name);
    if (i >= 0 && args[i + 1]) return args[i + 1];
    return fallback;
  };
  return {
    sessionsFile: getArg('--sessions-file', '.agent/jules-logs/jules-15-session-ids.txt'),
    mode: getArg('--mode', 'plan'), // plan | publish
    limit: Number(getArg('--limit', '15')),
    base: getArg('--base', 'main'),
    repo: getArg('--repo', 'whodaniel/fuse'),
    branchPrefix: getArg('--branch-prefix', 'jules-auto'),
  };
}

function requireAuth() {
  if (!API_KEY) {
    throw new Error('Missing JULES_API_KEY. Load .env.local first.');
  }
}

async function getSession(id) {
  const url = `${API_BASE.replace(/\/$/, '')}/v1alpha/sessions/${id}`;
  const res = await fetch(url, {
    headers: { 'X-Goog-Api-Key': API_KEY },
  });
  if (!res.ok) {
    throw new Error(`GET ${id} failed (${res.status})`);
  }
  return res.json();
}

function readIds(file) {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildPrBody(session, branch) {
  const lines = [];
  lines.push('## Source');
  lines.push(`- Jules session: ${session.url || `https://jules.google.com/session/${session.id}`}`);
  lines.push(`- Session ID: ${session.id}`);
  lines.push('');
  lines.push('## Notes');
  lines.push('- This PR was published by TNF automation from Jules change-set output.');
  lines.push(`- Branch: \`${branch}\``);
  return lines.join('\n');
}

function extractOutput(session) {
  const outputs = Array.isArray(session.outputs) ? session.outputs : [];
  for (const o of outputs) {
    const patch = o?.changeSet?.gitPatch?.unidiffPatch;
    if (patch && String(patch).trim()) {
      return {
        patch,
        suggestedCommitMessage:
          o?.changeSet?.gitPatch?.suggestedCommitMessage || `chore: apply Jules session ${session.id}`,
      };
    }
  }
  return null;
}

function now() {
  return new Date().toISOString();
}

async function main() {
  const args = parseArgs();
  requireAuth();
  const ids = readIds(args.sessionsFile).slice(0, args.limit);

  const root = run('git', ['rev-parse', '--show-toplevel']);
  const tmpBase = path.join(os.tmpdir(), 'jules-pr-publish');
  fs.mkdirSync(tmpBase, { recursive: true });

  const plan = [];
  for (const id of ids) {
    const s = await getSession(id);
    const out = extractOutput(s);
    if (!out) {
      plan.push({ id, state: s.state, publishable: false, reason: 'no_patch' });
      continue;
    }
    const branch = `${args.branchPrefix}/${id}`;
    const title = (s.title || `Jules session ${id}`).slice(0, 120);
    plan.push({
      id,
      state: s.state,
      publishable: s.state === 'COMPLETED',
      branch,
      title,
      suggestedCommitMessage: out.suggestedCommitMessage,
    });
  }

  const planFile = `.agent/jules-logs/jules-publish-plan-${Date.now()}.json`;
  fs.writeFileSync(planFile, JSON.stringify({ at: now(), plan }, null, 2));
  console.log(`plan_file=${planFile}`);
  console.log(`publishable=${plan.filter((p) => p.publishable).length}/${plan.length}`);

  if (args.mode !== 'publish') return;

  const results = [];
  for (const item of plan) {
    if (!item.publishable) {
      results.push({ id: item.id, ok: false, skipped: true, reason: item.reason || 'not_completed' });
      continue;
    }

    const s = await getSession(item.id);
    const out = extractOutput(s);
    if (!out) {
      results.push({ id: item.id, ok: false, reason: 'no_patch' });
      continue;
    }

    const wdir = path.join(tmpBase, item.id);
    const patchFile = path.join(wdir, 'session.patch');
    try {
      if (fs.existsSync(wdir)) {
        run('git', ['-C', root, 'worktree', 'remove', wdir, '--force']);
      }
      run('git', ['-C', root, 'fetch', 'origin', args.base]);
      run('git', [
        '-C',
        root,
        'worktree',
        'add',
        '-B',
        item.branch,
        wdir,
        `origin/${args.base}`,
      ]);

      fs.writeFileSync(patchFile, out.patch);
      run('git', ['-C', wdir, 'apply', '--3way', '--index', patchFile]);

      try {
        run('git', ['-C', wdir, 'diff', '--cached', '--quiet']);
        results.push({ id: item.id, ok: false, reason: 'empty_patch_after_apply' });
        continue;
      } catch {
        // expected when there are staged changes
      }

      const commitMsg = out.suggestedCommitMessage || `chore: apply Jules session ${item.id}`;
      run('git', ['-C', wdir, 'commit', '-m', commitMsg]);
      run('git', ['-C', wdir, 'push', '-u', 'origin', item.branch]);

      const body = buildPrBody(s, item.branch);
      const bodyFile = path.join(wdir, 'pr-body.md');
      fs.writeFileSync(bodyFile, body);
      const prUrl = run('gh', [
        'pr',
        'create',
        '--repo',
        args.repo,
        '--base',
        args.base,
        '--head',
        item.branch,
        '--title',
        item.title,
        '--body-file',
        bodyFile,
        '--draft',
      ]);

      results.push({ id: item.id, ok: true, branch: item.branch, prUrl });
      console.log(`published ${item.id} -> ${prUrl}`);
    } catch (error) {
      results.push({ id: item.id, ok: false, error: String(error.message || error) });
      console.log(`failed ${item.id}`);
    } finally {
      try {
        if (fs.existsSync(wdir)) {
          run('git', ['-C', root, 'worktree', 'remove', wdir, '--force']);
        }
      } catch {}
    }
  }

  const resultFile = `.agent/jules-logs/jules-publish-results-${Date.now()}.json`;
  fs.writeFileSync(resultFile, JSON.stringify({ at: now(), results }, null, 2));
  console.log(`result_file=${resultFile}`);
  console.log(`created_prs=${results.filter((r) => r.ok).length}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
