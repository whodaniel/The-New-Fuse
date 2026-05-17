#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const out = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const body = raw.slice(2);
    const eq = body.indexOf('=');
    if (eq === -1) {
      out[body] = true;
      continue;
    }
    out[body.slice(0, eq)] = body.slice(eq + 1);
  }
  return out;
}

function normalizePath(input) {
  return String(input || '').replace(/\\/g, '/').trim();
}

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 128,
  }).trim();
}

function readFileList(filePath) {
  if (!filePath) return [];
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) return [];
  return fs
    .readFileSync(resolved, 'utf8')
    .split('\n')
    .map((line) => normalizePath(line))
    .filter(Boolean);
}

function getChangedFiles(mode, explicitListPath) {
  const fromFile = readFileList(explicitListPath);
  if (fromFile.length) return fromFile;

  if (mode === 'staged') {
    const out = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
    return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
  }

  if (mode === 'pre-push') {
    try {
      const out = runGit(['diff', '--name-only', '--diff-filter=ACMR', '@{u}..HEAD']);
      return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
    } catch {
      const out = runGit(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD~1..HEAD']);
      return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
    }
  }

  if (mode === 'ci') {
    try {
      const out = runGit(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD~1..HEAD']);
      return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  if (mode === 'repo') {
    const out = runGit(['ls-files']);
    return out ? out.split('\n').map(normalizePath).filter(Boolean) : [];
  }

  throw new Error(`Unsupported mode: ${mode}`);
}

const surfaceRules = [
  { regex: /^apps\//i, surface: 'apps' },
  { regex: /^packages\//i, surface: 'packages' },
  { regex: /^scripts\//i, surface: 'scripts' },
  { regex: /^docs\//i, surface: 'docs' },
  { regex: /^\.github\//i, surface: 'github' },
  { regex: /^supabase\//i, surface: 'supabase' },
  { regex: /^data\//i, surface: 'data' },
];

const hardEscalationPatterns = [
  /^\.github\/workflows\//i,
  /^scripts\/protocols\//i,
  /^supabase\//i,
  /^\.gitmodules$/i,
];

const attributionPatterns = [
  /^package\.json$/i,
  /^pnpm-lock\.yaml$/i,
  /^\.husky\//i,
  /^scripts\/security\//i,
  /^scripts\/protocols\//i,
  /^docs\/protocols\//i,
];

function detectSurface(filePath) {
  for (const rule of surfaceRules) {
    if (rule.regex.test(filePath)) return rule.surface;
  }
  return 'root';
}

function listGitlinks() {
  const out = runGit(['ls-files', '-s']);
  const lines = out ? out.split('\n') : [];
  const map = new Map();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)\s+([0-9a-f]{40})\s+\d+\t(.+)$/i);
    if (!match) continue;
    const mode = match[1];
    const sha = match[2];
    const filePath = normalizePath(match[3]);
    if (mode === '160000') {
      map.set(filePath, sha);
    }
  }
  return map;
}

function classify(files) {
  if (!files.length) {
    return {
      tier: 'isolate',
      reasons: ['No changed files detected.'],
      recommended_action: 'No coordination action required.',
    };
  }

  const surfaces = new Set(files.map(detectSurface));
  const gitlinkMap = listGitlinks();
  const changedGitlinks = files.filter((file) => gitlinkMap.has(file));
  const hardEscalations = files.filter((file) =>
    hardEscalationPatterns.some((pattern) => pattern.test(file)),
  );
  const attributionHits = files.filter((file) =>
    attributionPatterns.some((pattern) => pattern.test(file)),
  );
  const docsOnly = files.every((file) => /^docs\//i.test(file) || /\.md$/i.test(file));

  const reasons = [];

  if (changedGitlinks.length) {
    reasons.push(`Changed gitlinks detected: ${changedGitlinks.slice(0, 8).join(', ')}`);
  }
  if (hardEscalations.length) {
    reasons.push(
      `High-risk protocol/workflow surfaces changed: ${hardEscalations.slice(0, 8).join(', ')}`,
    );
  }
  if (surfaces.size > 1) {
    reasons.push(`Cross-surface change set spans ${surfaces.size} surfaces: ${Array.from(surfaces).join(', ')}`);
  }
  if (attributionHits.length) {
    reasons.push(
      `Shared ownership files changed: ${Array.from(new Set(attributionHits)).slice(0, 8).join(', ')}`,
    );
  }

  if (hardEscalations.length || changedGitlinks.length || files.length > 120) {
    return {
      tier: 'escalate',
      reasons: reasons.length ? reasons : ['High-risk conditions met.'],
      recommended_action:
        'Escalate to synchronized review before merge. Require explicit owner acknowledgment on each touched surface.',
    };
  }

  if (docsOnly && surfaces.size <= 1) {
    return {
      tier: 'isolate',
      reasons: ['Docs-only scoped update with single-surface ownership.'],
      recommended_action: 'Proceed as isolated change with standard checks.',
    };
  }

  if (surfaces.size === 1 && attributionHits.length === 0 && files.length <= 30) {
    return {
      tier: 'isolate',
      reasons: ['Single-surface scoped update without shared ownership signals.'],
      recommended_action: 'Proceed as isolated change with standard checks.',
    };
  }

  return {
    tier: 'merge-with-attribution',
    reasons: reasons.length ? reasons : ['Cross-owner or shared-surface changes detected.'],
    recommended_action:
      'Merge with attribution: include ownership ledger entry and explicit co-ownership notes in handoff/PR summary.',
  };
}

function maybeFail(tier, failOn) {
  if (failOn === 'none') return;
  if (failOn === 'merge-with-attribution' && (tier === 'merge-with-attribution' || tier === 'escalate')) {
    process.exitCode = 1;
  }
  if (failOn === 'escalate' && tier === 'escalate') {
    process.exitCode = 1;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = String(args.mode || 'pre-push');
  const outputJson = Boolean(args.json);
  const failOn = String(args['fail-on'] || 'none');
  const explicitFileList =
    args['file-list'] ||
    process.env.TNF_CHANGE_FILE_LIST ||
    process.env.TNF_HANDOFF_FILE_LIST ||
    process.env.PRIVACY_GUARD_FILE_LIST ||
    process.env.TNF_GITLINK_FILE_LIST;

  const files = Array.from(new Set(getChangedFiles(mode, explicitFileList))).sort();
  const decision = classify(files);
  const payload = {
    spec: 'tnf/change-conflict-tier/0.1',
    decided_at: new Date().toISOString(),
    mode,
    fail_on: failOn,
    file_count: files.length,
    files_sample: files.slice(0, 80),
    truncated: files.length > 80,
    tier: decision.tier,
    reasons: decision.reasons,
    recommended_action: decision.recommended_action,
  };

  if (outputJson) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`[change-tier] tier=${payload.tier} files=${payload.file_count} mode=${mode}`);
    for (const reason of payload.reasons) {
      console.log(` - ${reason}`);
    }
    console.log(` - Recommended: ${payload.recommended_action}`);
  }

  maybeFail(payload.tier, failOn);
  if (process.exitCode) {
    console.error(`[change-tier] BLOCKED: tier=${payload.tier} exceeds fail-on=${failOn}`);
    process.exit(process.exitCode);
  }
}

main();
