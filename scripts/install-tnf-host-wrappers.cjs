#!/usr/bin/env node
'use strict';

/**
 * Install resilient ~/.tnf host wrappers for tnf-status + update-from-latest.
 *
 * Replaces the brittle #176 single-path wrappers that only looked at
 * ~/Repos/tnf-monorepo and failed loudly when that checkout was incomplete.
 *
 * Usage:
 *   node scripts/install-tnf-host-wrappers.cjs
 *   pnpm run tnf:host-wrappers:install
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  resolveTnfRepo,
  writePointer,
  statusAuthorityPath,
  hasStatusAuthority,
} = require('./lib/resolve-tnf-repo.cjs');

const HOME = os.homedir();
const TNF_DIR = path.join(HOME, '.tnf');

function buildStatusWrapper() {
  return `#!/usr/bin/env bash
# tnf-status — resilient thin wrapper (issue #176 follow-up).
# Resolves TNF checkout via candidates; does not hard-fail on a single path.
set -euo pipefail

resolve_repo() {
  if [[ -n "\${TNF_REPO_DIR:-}" && -f "\${TNF_REPO_DIR}/scripts/runtime/tnf-status.cjs" ]]; then
    printf '%s\\n' "\$TNF_REPO_DIR"
    return 0
  fi
  if [[ -n "\${TNF_REPO:-}" && -f "\${TNF_REPO}/scripts/runtime/tnf-status.cjs" ]]; then
    printf '%s\\n' "\$TNF_REPO"
    return 0
  fi
  if [[ -f "\$HOME/.tnf/repo-root" ]]; then
    local pointer
    pointer="\$(tr -d '[:space:]' < "\$HOME/.tnf/repo-root" || true)"
    if [[ -n "\$pointer" && -f "\$pointer/scripts/runtime/tnf-status.cjs" ]]; then
      printf '%s\\n' "\$pointer"
      return 0
    fi
  fi
  local candidate
  for candidate in \\
    "\$HOME/Repos/tnf-monorepo" \\
    "\$HOME/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse" \\
    "\$HOME/Desktop/A1-Inter-LLM-Com/The-New-Fuse" \\
    "\$HOME/.tnf-cli/fuse"
  do
    if [[ -f "\$candidate/scripts/runtime/tnf-status.cjs" ]]; then
      printf '%s\\n' "\$candidate"
      return 0
    fi
  done
  return 1
}

TNF_REPO="\$(resolve_repo || true)"
if [[ -z "\${TNF_REPO}" ]]; then
  echo "tnf-status: no TNF checkout with scripts/runtime/tnf-status.cjs found." >&2
  echo "Set TNF_REPO_DIR to your monorepo root, or run:" >&2
  echo "  node scripts/install-tnf-host-wrappers.cjs" >&2
  echo "from a live The-New-Fuse checkout." >&2
  exit 1
fi

printf '%s\\n' "\$TNF_REPO" > "\$HOME/.tnf/repo-root" 2>/dev/null || true
exec node "\$TNF_REPO/scripts/runtime/tnf-status.cjs" --repo "\$TNF_REPO" "\$@"
`;
}

function buildUpdateFromLatestWrapper() {
  return `#!/usr/bin/env bash
# update-from-latest.sh — resilient handoff cache sync (issue #176 follow-up).
set -euo pipefail

resolve_repo() {
  if [[ -n "\${TNF_REPO_DIR:-}" && -f "\${TNF_REPO_DIR}/scripts/lib/sync-handoff-cache.cjs" ]]; then
    printf '%s\\n' "\$TNF_REPO_DIR"
    return 0
  fi
  if [[ -n "\${TNF_REPO:-}" && -f "\${TNF_REPO}/scripts/lib/sync-handoff-cache.cjs" ]]; then
    printf '%s\\n' "\$TNF_REPO"
    return 0
  fi
  if [[ -f "\$HOME/.tnf/repo-root" ]]; then
    local pointer
    pointer="\$(tr -d '[:space:]' < "\$HOME/.tnf/repo-root" || true)"
    if [[ -n "\$pointer" && -f "\$pointer/scripts/lib/sync-handoff-cache.cjs" ]]; then
      printf '%s\\n' "\$pointer"
      return 0
    fi
  fi
  local candidate
  for candidate in \\
    "\$HOME/Repos/tnf-monorepo" \\
    "\$HOME/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse" \\
    "\$HOME/Desktop/A1-Inter-LLM-Com/The-New-Fuse" \\
    "\$HOME/.tnf-cli/fuse"
  do
    if [[ -f "\$candidate/scripts/lib/sync-handoff-cache.cjs" ]]; then
      printf '%s\\n' "\$candidate"
      return 0
    fi
  done
  return 1
}

TNF_REPO="\$(resolve_repo || true)"
if [[ -z "\${TNF_REPO}" ]]; then
  echo "sync-handoff-cache missing: no TNF checkout found." >&2
  echo "Set TNF_REPO_DIR and retry." >&2
  exit 1
fi

printf '%s\\n' "\$TNF_REPO" > "\$HOME/.tnf/repo-root" 2>/dev/null || true
exec node "\$TNF_REPO/scripts/lib/sync-handoff-cache.cjs" --repo "\$TNF_REPO" "\$@"
`;
}

function backupIfNeeded(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = `${filePath}.pre-resolve-${stamp}.bak`;
  fs.copyFileSync(filePath, bak);
  return bak;
}

function main() {
  const repo =
    resolveTnfRepo(path.resolve(__dirname, '..'), {
      preferStatusAuthority: true,
      writePointerOnHit: true,
    }) || path.resolve(__dirname, '..');

  if (!hasStatusAuthority(repo)) {
    console.error(
      `Refusing to install wrappers: missing ${statusAuthorityPath(repo)} under ${repo}`
    );
    process.exit(1);
  }

  fs.mkdirSync(TNF_DIR, { recursive: true });
  writePointer(repo);

  const statusPath = path.join(TNF_DIR, 'tnf-status');
  const updatePath = path.join(TNF_DIR, 'update-from-latest.sh');

  const statusBak = backupIfNeeded(statusPath);
  const updateBak = backupIfNeeded(updatePath);

  fs.writeFileSync(statusPath, buildStatusWrapper(), { mode: 0o755 });
  fs.chmodSync(statusPath, 0o755);
  fs.writeFileSync(updatePath, buildUpdateFromLatestWrapper(), { mode: 0o755 });
  fs.chmodSync(updatePath, 0o755);

  console.log(
    JSON.stringify(
      {
        ok: true,
        repoRoot: repo,
        pointer: path.join(TNF_DIR, 'repo-root'),
        installed: [statusPath, updatePath],
        backups: [statusBak, updateBak].filter(Boolean),
      },
      null,
      2
    )
  );
}

main();
