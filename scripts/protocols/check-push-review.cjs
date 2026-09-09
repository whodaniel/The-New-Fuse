#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { classify } = require('./classify-change-tier.cjs');
const ZERO = '0'.repeat(40);
function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
}
function changedFiles(local, remote, run = git) {
  if (![local, remote].every((sha) => /^[a-f0-9]{40}$/.test(sha)))
    throw new Error('Malformed push SHA.');
  if (local === ZERO) return [];
  const ranges =
    remote === ZERO
      ? run(['rev-list', local, '--not', '--remotes'])
          .split('\n')
          .filter(Boolean)
          .map((sha) => [
            'diff-tree',
            '--root',
            '-m',
            '--no-commit-id',
            '--name-only',
            '-z',
            '-r',
            sha,
          ])
      : [['diff', '--name-only', '-z', remote, local, '--']];
  const paths = [...new Set(ranges.flatMap((args) => run(args).split('\0').filter(Boolean)))];
  if (paths.some((p) => /[\r\n]/.test(p)))
    throw new Error('Newline in push path cannot be represented by content gates.');
  return paths;
}
function inspectPush(input, run = git) {
  const files = new Set();
  for (const line of input.split('\n').filter(Boolean)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 4) throw new Error('Malformed pre-push ref record.');
    const [, local, ref, remote] = fields;
    const protectedRef = ['refs/heads/main', 'refs/heads/master'].includes(ref);
    if (protectedRef && (local === ZERO || remote === ZERO))
      throw new Error(`Creation/deletion of ${ref} requires repository administration.`);
    const paths = changedFiles(local, remote, run);
    for (const p of paths) files.add(p);
    // Gitlink mode changes/deletions are high-risk even without a checked-out submodule.
    const gitlinks = new Map();
    if (protectedRef) {
      for (const sha of [remote, local]) {
        const tree = run(['ls-tree', '-r', sha]);
        for (const entry of tree.split('\n')) {
          const match = entry.match(/^160000 commit [a-f0-9]+\t(.+)$/);
          if (match) gitlinks.set(match[1], true);
        }
      }
      if (classify(paths, gitlinks).tier === 'escalate')
        throw new Error(
          `High-risk direct push to ${ref} is blocked. Publish a review branch, obtain synchronized review, then use scripts/safe-merge-to-main.sh <PR>.`
        );
    }
  }
  return [...files].sort();
}
if (require.main === module) {
  try {
    const output = process.argv[2];
    if (!output || process.argv.length !== 3) throw new Error('Expected output file argument.');
    const files = inspectPush(fs.readFileSync(0, 'utf8'));
    fs.writeFileSync(output, files.length ? `${files.join('\n')}\n` : '');
    console.log(`[push-review] PASS: ${files.length} changed paths inventoried`);
  } catch (error) {
    console.error(`[push-review] BLOCKED: ${error.message}`);
    process.exitCode = 1;
  }
}
module.exports = { changedFiles, inspectPush };
