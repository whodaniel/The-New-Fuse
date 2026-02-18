#!/usr/bin/env node
/**
 * jules-publish-cli.cjs
 *
 * Publishes Jules session patches as GitHub PRs.
 *
 * Strategy (no git checkout, no worktrees, minimal index.lock risk):
 *   1. jules remote pull --session <id>  → get unified diff
 *   2. git apply --3way --ignore-whitespace  → apply to working tree + main index
 *   3. git write-tree  → capture the resulting tree hash
 *   4. git restore --staged .  → unstage everything (reset index to HEAD)
 *   5. git restore .  → restore working tree to HEAD (undo apply)
 *   6. git commit-tree <tree> -p origin/main  → create commit object
 *   7. git update-ref refs/heads/<branch> <commit>  → create branch (no checkout!)
 *   8. git push origin <branch>
 *   9. gh pr create --draft
 *
 * This avoids git checkout entirely, so no index.lock from branch switching.
 * The only index writes are git apply + git restore, which are fast.
 *
 * macOS compatible. No browser interaction.
 *
 * Usage:
 *   node scripts/jules-publish-cli.cjs [--dry-run] [--limit N]
 */

/* eslint-disable no-process-exit */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Config ──────────────────────────────────────────────────────────────────
const REPO_ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const SESSION_IDS_FILE = path.join(REPO_ROOT, '.agent/jules-logs/jules-15-session-ids.txt');
const LOG_DIR = path.join(REPO_ROOT, '.agent/jules-logs');
const BASE_BRANCH = 'main';
const BRANCH_PREFIX = 'jules-auto';
const GITHUB_REPO = 'whodaniel/fuse';

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i >= 0 ? parseInt(args[i + 1], 10) : 15;
})();

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
    throw new Error(`Command failed: ${cmd}\n${(e.stderr || e.message || '').slice(0, 500)}`);
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

function log(msg) {
  process.stdout.write(msg + '\n');
}
function sep() {
  log('──────────────────────────────────────────');
}

// ── Verify prerequisites ─────────────────────────────────────────────────────
log('=== Jules Publish via CLI (Node.js) ===');
log(`Repo root:     ${REPO_ROOT}`);
log(`Sessions file: ${SESSION_IDS_FILE}`);
log(`Dry run:       ${DRY_RUN}`);
log(`Limit:         ${LIMIT}`);
log('');

for (const tool of ['jules', 'gh', 'git']) {
  const r = shSafe(`command -v ${tool}`);
  if (!r.ok) {
    log(`ERROR: '${tool}' not found in PATH`);
    process.exit(1);
  }
}

const ghAuth = shSafe('gh auth status');
if (!ghAuth.ok) {
  log('ERROR: gh CLI not authenticated. Run: gh auth login');
  process.exit(1);
}

// ── Ensure we're on main with clean state ────────────────────────────────────
const currentBranch = sh('git branch --show-current');
if (currentBranch !== BASE_BRANCH) {
  log(`WARNING: Not on ${BASE_BRANCH} (on ${currentBranch}). Switching...`);
  sh(`git checkout ${BASE_BRANCH}`);
}

// Remove any stale lock file from previous runs
const lockFile = path.join(REPO_ROOT, '.git/index.lock');
if (fs.existsSync(lockFile)) {
  log(`WARNING: Removing stale .git/index.lock`);
  fs.unlinkSync(lockFile);
}

// ── Read session IDs ─────────────────────────────────────────────────────────
const sessionIds = fs
  .readFileSync(SESSION_IDS_FILE, 'utf8')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .slice(0, LIMIT);

log(`Found ${sessionIds.length} sessions to process.\n`);

// ── Fetch latest main ────────────────────────────────────────────────────────
log(`Fetching latest origin/${BASE_BRANCH}...`);
sh(`git fetch origin ${BASE_BRANCH} --quiet`);
const baseCommit = sh(`git rev-parse origin/${BASE_BRANCH}`);
log(`Base commit: ${baseCommit.slice(0, 12)}\n`);

// ── Results tracking ─────────────────────────────────────────────────────────
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + 'Z';
const resultsFile = path.join(LOG_DIR, `jules-publish-results-${timestamp}.md`);
fs.mkdirSync(LOG_DIR, { recursive: true });

const rows = [];
let success = 0,
  skipped = 0,
  failed = 0;
const failedIds = [];

// ── Process each session ─────────────────────────────────────────────────────
for (const sessionId of sessionIds) {
  sep();
  log(`Processing session: ${sessionId}`);

  const branchName = `${BRANCH_PREFIX}-${sessionId}`;
  const patchFile = path.join(os.tmpdir(), `jules-patch-${sessionId}.diff`);

  try {
    // Check if branch + PR already exist on remote
    const remoteCheck = shSafe(`git ls-remote --exit-code --heads origin ${branchName}`);
    if (remoteCheck.ok) {
      log(`  Branch ${branchName} already exists on remote.`);
      const existingPr = shSafe(
        `gh pr list --repo ${GITHUB_REPO} --head ${branchName} --json url --jq '.[0].url'`
      );
      if (existingPr.ok && existingPr.stdout && existingPr.stdout !== 'null') {
        log(`  PR already exists: ${existingPr.stdout}`);
        rows.push(
          `| ${sessionId} | \`${branchName}\` | ${existingPr.stdout} | ✅ Already exists | |`
        );
        skipped++;
        continue;
      }
    }

    // Pull patch from Jules
    log(`  Pulling patch from Jules...`);
    const pullResult = shSafe(`jules remote pull --session ${sessionId}`);

    if (!pullResult.ok || !pullResult.stdout) {
      log(`  ERROR: jules remote pull failed:\n  ${pullResult.stderr}`);
      rows.push(`| ${sessionId} | - | - | ❌ Failed | jules pull failed |`);
      failed++;
      failedIds.push(sessionId);
      continue;
    }

    fs.writeFileSync(patchFile, pullResult.stdout);
    const patchSize = Buffer.byteLength(pullResult.stdout, 'utf8');
    log(`  Patch size: ${patchSize} bytes`);

    if (patchSize < 50) {
      log(`  WARNING: Patch is empty or too small. Skipping.`);
      rows.push(`| ${sessionId} | - | - | ⚠️ Skipped | Empty patch (${patchSize}b) |`);
      skipped++;
      fs.unlinkSync(patchFile);
      continue;
    }

    if (DRY_RUN) {
      const preview = pullResult.stdout.split('\n').slice(0, 5).join('\n');
      log(`  [DRY RUN] Would create branch ${branchName} and apply patch`);
      log(`  Patch preview:\n${preview}`);
      rows.push(
        `| ${sessionId} | \`${branchName}\` | (dry run) | 🔵 Dry run | ${patchSize}b patch |`
      );
      fs.unlinkSync(patchFile);
      continue;
    }

    // ── Ensure clean state before applying ──────────────────────────────────
    // Reset index and working tree to HEAD (fast, no branch switch)
    shSafe('git restore --staged . 2>/dev/null || git reset HEAD -- . 2>/dev/null');
    shSafe('git restore . 2>/dev/null || git checkout -- . 2>/dev/null');

    // ── Apply patch to working tree + index ─────────────────────────────────
    log(`  Applying patch...`);
    const applyResult = shSafe(`git apply --3way --ignore-whitespace ${patchFile}`);
    log(`  apply exit=${applyResult.status}`);
    if (applyResult.stderr) log(`  apply stderr: ${applyResult.stderr.slice(0, 200)}`);

    // Check what changed
    const statusResult = shSafe('git status --porcelain');
    const changedFiles = statusResult.stdout.trim();
    if (!changedFiles) {
      log(`  No changes after applying patch. Skipping.`);
      rows.push(`| ${sessionId} | \`${branchName}\` | - | ⚠️ Skipped | no changes after apply |`);
      skipped++;
      fs.unlinkSync(patchFile);
      continue;
    }
    log(`  Changed:\n${changedFiles.split('\n').slice(0, 8).join('\n')}`);

    let applyNotes = '';
    if (applyResult.stderr.includes('conflict') || applyResult.stderr.includes('Falling back')) {
      applyNotes = 'Applied with 3way merge conflicts';
      log(`  ⚠️  3way merge conflicts present`);
    }

    // ── Stage everything and capture tree ───────────────────────────────────
    sh('git add -A');
    const treeHash = sh('git write-tree');
    log(`  Tree: ${treeHash.slice(0, 12)}`);

    // ── Restore working tree + index to HEAD (undo the apply) ───────────────
    sh('git restore --staged .');
    sh('git restore .');
    log(`  Working tree restored to HEAD.`);

    // ── Create commit object (no checkout needed!) ───────────────────────────
    const commitMsg = [
      `feat: Jules session ${sessionId} - auto-published changes`,
      '',
      `Session URL: https://jules.google.com/session/${sessionId}`,
      `Published by TNF automation via jules remote pull + gh pr create`,
      applyNotes ? `Notes: ${applyNotes}` : '',
    ]
      .filter(Boolean)
      .join('\n')
      .trim();

    const commitHash = sh(
      `git commit-tree ${treeHash} -p ${baseCommit} -m ${JSON.stringify(commitMsg)}`
    );
    log(`  Commit: ${commitHash.slice(0, 12)}`);

    // ── Create branch ref (no checkout!) ────────────────────────────────────
    sh(`git update-ref refs/heads/${branchName} ${commitHash}`);
    log(`  Branch ${branchName} created.`);

    // ── Push branch ─────────────────────────────────────────────────────────
    log(`  Pushing...`);
    const pushResult = shSafe(`git push origin ${branchName} --force`);
    if (!pushResult.ok) {
      log(`  ERROR: Push failed:\n  ${pushResult.stderr}`);
      rows.push(`| ${sessionId} | \`${branchName}\` | - | ❌ Failed | push failed |`);
      failed++;
      failedIds.push(sessionId);
      fs.unlinkSync(patchFile);
      continue;
    }

    // ── Create PR ───────────────────────────────────────────────────────────
    log(`  Creating GitHub PR...`);
    const prBody = [
      '## Jules Session Auto-Publish',
      '',
      `**Session ID:** \`${sessionId}\``,
      `**Session URL:** https://jules.google.com/session/${sessionId}`,
      '',
      'This PR was automatically published by TNF automation using `jules remote pull` + `gh pr create`.',
      applyNotes ? `\n**Apply notes:** ${applyNotes}` : '',
      '',
      '---',
      '*Published by jules-publish-cli.cjs*',
    ].join('\n');

    const prResult = shSafe(
      `gh pr create --repo ${GITHUB_REPO} --base ${BASE_BRANCH} --head ${branchName} ` +
        `--title ${JSON.stringify(`Jules: Session ${sessionId}`)} ` +
        `--body ${JSON.stringify(prBody)} --draft`
    );

    if (prResult.ok && prResult.stdout) {
      log(`  ✅ PR created: ${prResult.stdout}`);
      rows.push(
        `| ${sessionId} | \`${branchName}\` | ${prResult.stdout} | ✅ Published | ${applyNotes} |`
      );
      success++;
    } else {
      log(`  ERROR: gh pr create failed:\n  ${prResult.stderr}`);
      rows.push(
        `| ${sessionId} | \`${branchName}\` | - | ❌ Failed | PR create failed: ${prResult.stderr.slice(0, 80)} |`
      );
      failed++;
      failedIds.push(sessionId);
    }

    fs.unlinkSync(patchFile);
  } catch (err) {
    log(`  EXCEPTION: ${err.message}`);
    rows.push(`| ${sessionId} | - | - | ❌ Failed | exception: ${err.message.slice(0, 100)} |`);
    failed++;
    failedIds.push(sessionId);
    // Always restore clean state on error
    shSafe('git restore --staged . 2>/dev/null; git restore . 2>/dev/null');
    if (fs.existsSync(patchFile)) fs.unlinkSync(patchFile);
  }

  log('');
}

// ── Write results ────────────────────────────────────────────────────────────
const resultsContent = [
  '# Jules Publish Results',
  `Generated: ${new Date().toISOString()}`,
  `Dry run: ${DRY_RUN}`,
  '',
  '| Session ID | Branch | PR URL | Status | Notes |',
  '|---|---|---|---|---|',
  ...rows,
  '',
  '## Summary',
  `- ✅ Published: ${success}`,
  `- ⚠️ Skipped: ${skipped}`,
  `- ❌ Failed: ${failed}`,
  failedIds.length > 0 ? `- Failed IDs: ${failedIds.join(', ')}` : '',
].join('\n');

fs.writeFileSync(resultsFile, resultsContent);

log('');
log('══════════════════════════════════════════');
log('=== RESULTS ===');
log(`  ✅ Published:  ${success}`);
log(`  ⚠️  Skipped:   ${skipped}`);
log(`  ❌ Failed:     ${failed}`);
if (failedIds.length > 0) log(`  Failed IDs:   ${failedIds.join(', ')}`);
log('');
log(`Results written to: ${resultsFile}`);
log('══════════════════════════════════════════');
