#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
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

const ownerRules = [
  { regex: /^apps\//i, owner: 'apps' },
  { regex: /^packages\//i, owner: 'packages' },
  { regex: /^scripts\//i, owner: 'scripts' },
  { regex: /^docs\//i, owner: 'docs' },
  { regex: /^\.github\/workflows\//i, owner: 'ci' },
  { regex: /^supabase\//i, owner: 'supabase' },
  { regex: /^data\//i, owner: 'data' },
  { regex: /^archive\//i, owner: 'archive' },
];

function classifyOwner(filePath) {
  for (const rule of ownerRules) {
    if (rule.regex.test(filePath)) return rule.owner;
  }
  return 'root';
}

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function getTopLevelRoots(files) {
  const roots = new Set();
  for (const file of files) {
    const first = normalizePath(file).split('/')[0];
    roots.add(first || 'root');
  }
  return Array.from(roots).sort();
}

function computeFileHash(files) {
  return crypto.createHash('sha256').update(files.join('\n')).digest('hex');
}

function toDomainCounts(pairs) {
  const counts = new Map();
  for (const pair of pairs) {
    counts.set(pair.owner, (counts.get(pair.owner) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([owner, file_count]) => ({ owner, file_count }))
    .sort((a, b) => b.file_count - a.file_count || a.owner.localeCompare(b.owner));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = String(args.mode || 'pre-push');
  const dryRun = Boolean(args['dry-run']);
  const maxPaths = Number(args['max-paths'] || 200);
  const outputPath = path.resolve(
    String(args.output || path.join('data', 'protocols', 'CHANGE_OWNERSHIP.jsonl')),
  );
  const explicitFileList =
    args['file-list'] ||
    process.env.TNF_CHANGE_FILE_LIST ||
    process.env.TNF_HANDOFF_FILE_LIST ||
    process.env.PRIVACY_GUARD_FILE_LIST ||
    process.env.TNF_GITLINK_FILE_LIST;

  const changedFiles = Array.from(new Set(getChangedFiles(mode, explicitFileList))).sort();
  const ownershipPairs = changedFiles.map((file) => ({ path: file, owner: classifyOwner(file) }));
  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const headSha = runGit(['rev-parse', 'HEAD']);
  const runId = crypto.randomUUID();
  const source = process.env.GITHUB_ACTIONS ? 'ci' : 'local';
  const actor = process.env.GITHUB_ACTOR || process.env.USER || 'unknown';

  const record = {
    spec: 'tnf/change-ownership-ledger/0.1',
    run_id: runId,
    recorded_at: new Date().toISOString(),
    source,
    mode,
    actor,
    branch,
    head_sha: headSha,
    file_count: changedFiles.length,
    file_hash: computeFileHash(changedFiles),
    top_level_roots: getTopLevelRoots(changedFiles),
    domain_counts: toDomainCounts(ownershipPairs),
    changed_paths_sample: ownershipPairs.slice(0, Math.max(0, maxPaths)),
    truncated: ownershipPairs.length > maxPaths,
  };

  if (dryRun) {
    console.log(JSON.stringify(record, null, 2));
    return;
  }

  ensureDirFor(outputPath);
  fs.appendFileSync(outputPath, `${JSON.stringify(record)}\n`, 'utf8');
  console.log(
    `[change-ownership-ledger] wrote record ${runId} (${changedFiles.length} files) -> ${path.relative(
      process.cwd(),
      outputPath,
    )}`,
  );
}

main();
