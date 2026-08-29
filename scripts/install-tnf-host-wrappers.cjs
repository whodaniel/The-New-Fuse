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
# A candidate is only accepted if it has the marker file, IS a live git work
# tree, AND has the canonical remote identity (whodaniel/tnf-monorepo, not a
# downstream publication target or unrelated repo) — see the full contract
# in docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md and
# scripts/lib/resolve-tnf-repo.cjs's header. This bootstrap wrapper must stay
# self-contained (it can't source a library living inside the checkout it
# hasn't found yet); scripts/lib/resolve-tnf-repo.sh has the identical
# algorithm for any in-checkout script that already knows its repo.
set -euo pipefail

_tnf_canonical_origin_ok() {
  local url slug
  url="\$(git -C "\$1" remote get-url origin 2>/dev/null)" || return 1
  [[ -n "\$url" ]] || return 1
  slug="\${url%.git}"
  slug="\${slug#git@*:}"
  slug="\${slug#https://*/}"
  slug="\${slug#http://*/}"
  slug="\${slug%/}"
  slug="\$(printf '%s' "\$slug" | tr '[:upper:]' '[:lower:]')"
  [[ "\$slug" == "whodaniel/tnf-monorepo" ]]
}

_tnf_candidate_ok() {
  [[ -f "\$1/scripts/runtime/tnf-status.cjs" ]] || return 1
  git -C "\$1" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1
  _tnf_canonical_origin_ok "\$1"
}

resolve_repo() {
  if [[ -n "\${TNF_REPO_DIR:-}" ]] && _tnf_candidate_ok "\${TNF_REPO_DIR}"; then
    printf '%s\\n' "\$TNF_REPO_DIR"
    return 0
  fi
  if [[ -n "\${TNF_ROOT_DIR:-}" ]] && _tnf_candidate_ok "\${TNF_ROOT_DIR}"; then
    printf '%s\\n' "\$TNF_ROOT_DIR"
    return 0
  fi
  if [[ -n "\${TNF_REPO:-}" ]] && _tnf_candidate_ok "\${TNF_REPO}"; then
    printf '%s\\n' "\$TNF_REPO"
    return 0
  fi
  if [[ -f "\$HOME/.tnf/repo-root" ]]; then
    local pointer
    pointer="\$(tr -d '[:space:]' < "\$HOME/.tnf/repo-root" || true)"
    if [[ -n "\$pointer" ]] && _tnf_candidate_ok "\$pointer"; then
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
    if _tnf_candidate_ok "\$candidate"; then
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
# Same full contract as buildStatusWrapper() in install-tnf-host-wrappers.cjs
# (marker file + live git work tree + canonical remote identity) — see
# docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md.
set -euo pipefail

_tnf_canonical_origin_ok() {
  local url slug
  url="\$(git -C "\$1" remote get-url origin 2>/dev/null)" || return 1
  [[ -n "\$url" ]] || return 1
  slug="\${url%.git}"
  slug="\${slug#git@*:}"
  slug="\${slug#https://*/}"
  slug="\${slug#http://*/}"
  slug="\${slug%/}"
  slug="\$(printf '%s' "\$slug" | tr '[:upper:]' '[:lower:]')"
  [[ "\$slug" == "whodaniel/tnf-monorepo" ]]
}

_tnf_candidate_ok() {
  [[ -f "\$1/scripts/lib/sync-handoff-cache.cjs" ]] || return 1
  git -C "\$1" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1
  _tnf_canonical_origin_ok "\$1"
}

resolve_repo() {
  if [[ -n "\${TNF_REPO_DIR:-}" ]] && _tnf_candidate_ok "\${TNF_REPO_DIR}"; then
    printf '%s\\n' "\$TNF_REPO_DIR"
    return 0
  fi
  if [[ -n "\${TNF_ROOT_DIR:-}" ]] && _tnf_candidate_ok "\${TNF_ROOT_DIR}"; then
    printf '%s\\n' "\$TNF_ROOT_DIR"
    return 0
  fi
  if [[ -n "\${TNF_REPO:-}" ]] && _tnf_candidate_ok "\${TNF_REPO}"; then
    printf '%s\\n' "\$TNF_REPO"
    return 0
  fi
  if [[ -f "\$HOME/.tnf/repo-root" ]]; then
    local pointer
    pointer="\$(tr -d '[:space:]' < "\$HOME/.tnf/repo-root" || true)"
    if [[ -n "\$pointer" ]] && _tnf_candidate_ok "\$pointer"; then
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
    if _tnf_candidate_ok "\$candidate"; then
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

// Generic "copy this file from the checkout to ~/.tnf/<destSubdir>/" step,
// with the same backup-before-overwrite discipline as the bootstrap
// wrappers above. Used both for the shared resolver library and for
// deployed runtime scripts that have no other installer (see the
// subdirector-autopilot-loop.cjs deployment below and
// docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md §4/§6).
function installRepoFile(repo, srcRelPath, destSubdir, destName, mode, results) {
  const src = path.join(repo, srcRelPath);
  if (!fs.existsSync(src)) {
    results.missing.push(src);
    return;
  }
  const destDir = path.join(TNF_DIR, destSubdir);
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, destName);
  const bak = backupIfNeeded(dest);
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, mode);
  results.installed.push(dest);
  if (bak) results.backups.push(bak);
}

function installLibraryFile(repo, relSrc, destName, results) {
  installRepoFile(repo, path.join('scripts', 'lib', relSrc), 'lib', destName, 0o644, results);
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

  // Also deploy the shared resolver library itself (not just the two
  // bootstrap wrappers above) so other installed ~/.tnf/ scripts can
  // require/source the same canonical, git-validated algorithm instead of
  // each carrying their own drifting copy. See
  // docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md.
  const libResults = { installed: [], backups: [], missing: [] };
  installLibraryFile(repo, 'resolve-tnf-repo.cjs', 'resolve-tnf-repo.cjs', libResults);
  installLibraryFile(repo, 'resolve-tnf-repo.sh', 'resolve-tnf-repo.sh', libResults);

  // Closes the previously-undocumented manual deployment path for
  // subdirector-autopilot-loop.cjs (it consumes ../lib/resolve-tnf-repo.cjs,
  // so it needs an owner the same way the wrappers above do — see
  // docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md §4/§6). This is the
  // *installer*; scripts/runtime/subdirector-autopilot-service.sh remains
  // the *service* that launches the deployed copy — separate concerns.
  const binResults = { installed: [], backups: [], missing: [] };
  installRepoFile(
    repo,
    path.join('scripts', 'runtime', 'subdirector-autopilot-loop.cjs'),
    'bin',
    'subdirector-autopilot-loop.cjs',
    0o755,
    binResults
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        repoRoot: repo,
        pointer: path.join(TNF_DIR, 'repo-root'),
        installed: [statusPath, updatePath, ...libResults.installed, ...binResults.installed],
        backups: [statusBak, updateBak, ...libResults.backups, ...binResults.backups].filter(Boolean),
        libraryMissing: libResults.missing,
        binMissing: binResults.missing,
      },
      null,
      2
    )
  );
}

main();
