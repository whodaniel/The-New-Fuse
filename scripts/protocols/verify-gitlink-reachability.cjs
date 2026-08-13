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

function runGit(args, cwd = process.cwd()) {
  return execFileSync('git', args, {
    cwd,
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

function listGitlinks() {
  const out = runGit(['ls-files', '-s']);
  const lines = out ? out.split('\n') : [];
  const entries = [];
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+([0-9a-f]{40})\s+\d+\t(.+)$/i);
    if (!match) continue;
    if (match[1] !== '160000') continue;
    entries.push({
      path: normalizePath(match[3]),
      sha: match[2],
    });
  }
  return entries;
}

function containsCommitInRemote(submodulePath, remoteName, commitSha) {
  const remoteRefs = runGit(
    ['for-each-ref', '--format=%(refname:short)', `refs/remotes/${remoteName}`, '--contains', commitSha],
    submodulePath,
  );
  const tagRefs = runGit(['for-each-ref', '--format=%(refname:short)', 'refs/tags', '--contains', commitSha], submodulePath);
  const refs = []
    .concat(remoteRefs ? remoteRefs.split('\n') : [])
    .concat(tagRefs ? tagRefs.split('\n') : [])
    .map((line) => line.trim())
    .filter(Boolean);
  return refs;
}

function verifyOne(entry, preferredRemote, skipFetch) {
  const submoduleAbs = path.resolve(entry.path);
  if (!fs.existsSync(submoduleAbs)) {
    return {
      path: entry.path,
      sha: entry.sha,
      status: 'error',
      reason: `Path missing: ${entry.path}`,
    };
  }

  let remoteName = preferredRemote;
  try {
    if (!remoteName) {
      const remotes = runGit(['remote'], submoduleAbs)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      remoteName = remotes.includes('origin') ? 'origin' : remotes[0];
    }
    if (!remoteName) {
      return {
        path: entry.path,
        sha: entry.sha,
        status: 'error',
        reason: 'No remote configured in gitlink repository.',
      };
    }

    if (!skipFetch) {
      runGit(
        [
          'fetch',
          '--prune',
          remoteName,
          `+refs/heads/*:refs/remotes/${remoteName}/*`,
          '+refs/tags/*:refs/tags/*',
        ],
        submoduleAbs,
      );
    }

    const objType = runGit(['cat-file', '-t', entry.sha], submoduleAbs);
    if (objType !== 'commit') {
      return {
        path: entry.path,
        sha: entry.sha,
        status: 'error',
        reason: `Referenced object is not a commit (${objType}).`,
      };
    }

    const containingRefs = containsCommitInRemote(submoduleAbs, remoteName, entry.sha);
    if (!containingRefs.length) {
      return {
        path: entry.path,
        sha: entry.sha,
        status: 'error',
        remote: remoteName,
        reason: `Commit ${entry.sha} not reachable from any ${remoteName} remote ref/tag.`,
      };
    }

    return {
      path: entry.path,
      sha: entry.sha,
      remote: remoteName,
      status: 'ok',
      refs: containingRefs.slice(0, 10),
    };
  } catch (error) {
    return {
      path: entry.path,
      sha: entry.sha,
      remote: remoteName || null,
      status: 'error',
      reason: error.message,
    };
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = String(args.mode || 'pre-push');
  const outputJson = Boolean(args.json);
  const failOnError = args['fail-on-error'] !== 'false';
  const remoteName = args.remote ? String(args.remote) : null;
  const skipFetch = Boolean(args['skip-fetch']);
  const verifyAll = Boolean(args.all);
  const explicitFileList =
    args['file-list'] ||
    process.env.TNF_GITLINK_FILE_LIST ||
    process.env.TNF_CHANGE_FILE_LIST ||
    process.env.TNF_HANDOFF_FILE_LIST ||
    process.env.PRIVACY_GUARD_FILE_LIST;

  const changedFiles = Array.from(new Set(getChangedFiles(mode, explicitFileList)));
  const gitlinks = listGitlinks();
  const gitlinkMap = new Map(gitlinks.map((entry) => [entry.path, entry]));

  let candidates;
  if (verifyAll) {
    candidates = gitlinks;
  } else {
    candidates = changedFiles.filter((file) => gitlinkMap.has(file)).map((file) => gitlinkMap.get(file));
  }

  const results = [];
  for (const candidate of candidates) {
    results.push(verifyOne(candidate, remoteName, skipFetch));
  }

  const failed = results.filter((item) => item.status !== 'ok');
  const payload = {
    spec: 'tnf/gitlink-reachability/0.1',
    checked_at: new Date().toISOString(),
    mode,
    verify_all: verifyAll,
    candidate_count: candidates.length,
    failed_count: failed.length,
    changed_file_count: changedFiles.length,
    results,
  };

  if (outputJson) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    if (!candidates.length) {
      console.log('[gitlink-reachability] OK: no gitlink paths in changed file set.');
    } else {
      for (const item of results) {
        if (item.status === 'ok') {
          console.log(
            `[gitlink-reachability] OK ${item.path} @ ${item.sha} via ${item.remote} (${(item.refs || []).join(', ')})`,
          );
        } else {
          console.error(`[gitlink-reachability] FAIL ${item.path} @ ${item.sha}: ${item.reason}`);
        }
      }
    }
  }

  if (failOnError && failed.length > 0) {
    process.exit(1);
  }
}

main();
