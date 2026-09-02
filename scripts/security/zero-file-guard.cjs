#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Zero-file (truncation) guard — staged mode.
 *
 * Origin incident (2026-09-01): an autonomous fleet routine-update commit
 * (bf04b72a2) silently committed packages/tnf-cli/src/cli.ts as a 0-byte
 * file — an 814KB, 22,264-line entrypoint truncated mid-write by an agent
 * process, then swept into an LLM-authored `chore:` commit. The other staged
 * gates all passed (an empty file has no secrets, no PII, no type errors),
 * leaving the repo unbuildable until it was caught by hand.
 *
 * Whatever the writer's intent, committing a previously-substantial tracked
 * file as empty is never routine maintenance. Block it here.
 *
 * Scope: staged index vs HEAD. A file counts as truncated when its staged
 * blob is 0 bytes and its HEAD content was > 1 KiB. Deletions (D status)
 * are a different, deliberate operation and are not flagged.
 *
 * Escape hatch: set TNF_ALLOW_EMPTY_COMMIT_FILE=1 with a real reason in the
 * commit message (the receipt/handoff gates will still have their say).
 */
const { execFileSync } = require('node:child_process');

const mode = process.argv.find((a) => a.startsWith('--mode='))?.split('=')[1] || 'staged';
if (mode !== 'staged') {
  console.log(`[zero-file-guard] OK: nothing to do in mode '${mode}'`);
  process.exit(0);
}

const MIN_PREVIOUS_BYTES = 1024;

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

function blobSize(ref) {
  // `git cat-file -s <ref>` errors for missing blobs; treat as -1.
  try {
    return Number(git(['cat-file', '-s', ref]).trim());
  } catch {
    return -1;
  }
}

const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACM'])
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

const truncated = [];
for (const file of staged) {
  const headSize = blobSize(`HEAD:${file}`);
  if (headSize < MIN_PREVIOUS_BYTES) continue; // new or tiny files: nothing to protect
  const stagedSize = blobSize(`:${file}`);
  if (stagedSize === 0) {
    truncated.push({ file, headSize });
  }
}

if (truncated.length > 0) {
  if (process.env.TNF_ALLOW_EMPTY_COMMIT_FILE === '1') {
    console.warn(
      `[zero-file-guard] WARN: ${truncated.length} truncated file(s) allowed by TNF_ALLOW_EMPTY_COMMIT_FILE:`
    );
    for (const t of truncated) {
      console.warn(`  - ${t.file} (${t.headSize} bytes at HEAD -> 0 staged)`);
    }
    process.exit(0);
  }
  console.error('[zero-file-guard] BLOCKED: staged commit would truncate tracked files to 0 bytes:');
  for (const t of truncated) {
    console.error(`  - ${t.file} (${t.headSize} bytes at HEAD -> 0 staged)`);
  }
  console.error(
    'If a file is genuinely being emptied on purpose, delete it instead (git rm) so the intent is reviewable, or set TNF_ALLOW_EMPTY_COMMIT_FILE=1 for this commit.'
  );
  process.exit(1);
}

console.log(`[zero-file-guard] OK (staged): no truncated files among ${staged.length} staged`);
