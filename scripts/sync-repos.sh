#!/bin/bash
set -euo pipefail

# =============================================================================
# TNF Repo Separation Sync Script
# =============================================================================
#
# PURPOSE:
#   Syncs the combined private monorepo (whodaniel/tnf-monorepo) to the two
#   downstream publication repos:
#     1. whodaniel/The-New-Fuse        (PUBLIC, ~90% open-source runtime)
#     2. whodaniel/fuse-control-plane  (PRIVATE, ~10% proprietary control plane)
#
#   NAMING (swapped 2026-07-25): the flagship name The-New-Fuse now belongs to the
#   PUBLIC publication repo. The private development monorepo — this one — is
#   whodaniel/tnf-monorepo. Older slugs (The-New-Fuse as monorepo,
#   The-New-Fuse, the-new-fuse-next-gen) refer to the pre-swap layout.
#   Anything still pointing a monorepo remote at whodaniel/The-New-Fuse is now
#   aimed at the PUBLIC repo — repoint it at tnf-monorepo.
#
# USAGE:
#   pnpm run sync:repos              # sync both
#   pnpm run sync:repos -- --open    # open-runtime only
#   pnpm run sync:repos -- --control # control-plane only
#   pnpm run sync:repos -- --dry-run # preview without pushing
#
# SEE ALSO:
#   docs/REPO_SEPARATION.md — full architecture and rationale
#
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORK_DIR="/tmp/tnf-repo-sync-$(date +%Y%m%d_%H%M%S)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Parse flags
SYNC_OPEN=true
SYNC_CONTROL=true
DRY_RUN=false
FORCE=false

for arg in "$@"; do
  case "$arg" in
    --open)    SYNC_CONTROL=false ;;
    --control) SYNC_OPEN=false ;;
    --dry-run) DRY_RUN=true ;;
    --force)   FORCE=true ;;
    --help)
      echo "Usage: sync-repos.sh [--open] [--control] [--dry-run] [--force]"
      echo "  --open      Sync only The-New-Fuse (public)"
      echo "  --control   Sync only fuse-control-plane"
      echo "  --dry-run   Preview changes without pushing"
      echo "  --force     Force push even if no changes detected"
      exit 0
      ;;
  esac
done

echo "╔══════════════════════════════════════════════╗"
echo "║  TNF Repo Separation Sync                   ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

mkdir -p "$WORK_DIR"

# Get current commit for tagging
MONO_HEAD=$(cd "$MONO_ROOT" && git rev-parse --short HEAD)
MONO_MSG=$(cd "$MONO_ROOT" && git log -1 --format='%s')
echo "Source: whodaniel/tnf-monorepo @ $MONO_HEAD"
echo "        \"$MONO_MSG\""
echo ""

if [ -z "${GITHUB_PAT:-}" ]; then
  echo "ERROR: GITHUB_PAT is empty. Set repository secret TNF_SYNC_PAT on whodaniel/tnf-monorepo"
  echo "       (classic or fine-grained PAT with repo scope for fuse-control-plane + The-New-Fuse)."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────
# PROPRIETARY EXCLUSION LIST
# ─────────────────────────────────────────────────────────────────────
# These paths are REMOVED from the public The-New-Fuse export and EXTRACTED to
# fuse-control-plane. This is the single source of truth for what
# is proprietary.
# ─────────────────────────────────────────────────────────────────────

PROPRIETARY_FILES=(
  # Core proprietary relay implementations
  "packages/relay-core/src/master-clock.ts"
  "packages/relay-core/src/broker-agent.ts"
  "packages/relay-core/dist/master-clock.js"
  "packages/relay-core/dist/master-clock.d.ts"
  "packages/relay-core/dist/master-clock.js.map"
  "packages/relay-core/dist/master-clock.d.ts.map"
  "packages/relay-core/dist/broker-agent.js"
  "packages/relay-core/dist/broker-agent.d.ts"
  "packages/relay-core/dist/broker-agent.js.map"
  "packages/relay-core/dist/broker-agent.d.ts.map"
)

PROPRIETARY_DIRS=(
  # Backend orchestrator module (Director authority)
  "apps/backend/src/modules/orchestrator"
  # Nexus Orchestrator + PicoClaw live under sibling TNF-Extensions
  # (apps/extensions is a git symlink to ../../TNF-Extensions). Do not list
  # those subpaths here: CI checkouts have a dangling symlink, so
  # check-proprietary-leakage.sh treats them as stale declarations and aborts
  # the open-runtime publish. Covered by ALWAYS_EXCLUDE "apps/extensions".
  # Cloudflare SharedState worker
  "cloudflare-sharedstate"
  # Agent coordination patterns
  "packages/agent-coordination"
  # Orchestration scripts (Director-authority channel drivers).
  # Previously listed by bare filename in PROPRIETARY_SCRIPTS, which no consumer
  # could resolve — every entry was treated as repo-root-relative, so nothing was
  # removed and the whole directory published. Covered as a directory instead so
  # new files here are proprietary by default.
  "scripts/registry/orchestrator"

  # NOTE: satellite / standalone product apps live outside this monorepo under
  # ../TNF-Extensions (apps/extensions redirect). Do not add them here unless
  # they must be extracted into fuse-control-plane.
)

# Paths are repo-root-relative, exactly like PROPRIETARY_FILES/DIRS — every
# consumer does "$EXPORT/$entry". Bare filenames silently match nothing, which is
# how these published: all 20 entries were basenames, so both the remover and
# check-proprietary-leakage.sh looked for them at the repo root and found nothing.
#
# The 11 under scripts/registry/orchestrator are also covered by PROPRIETARY_DIRS;
# they stay listed as defense in depth. Three historical entries were dropped
# because they exist nowhere in the tree: orchestrate_antigravity.js,
# orchestrate_cloud_qa.js, tnf-master-orchestrator.ts.
PROPRIETARY_SCRIPTS=(
  "scripts/registry/orchestrator/orchestrate-blue.js"
  "scripts/registry/orchestrator/orchestrate-claude-blue.js"
  "scripts/registry/orchestrator/orchestrate-claude-green.js"
  "scripts/registry/orchestrator/orchestrate-green.js"
  "scripts/registry/orchestrator/orchestrate-listener.js"
  "scripts/registry/orchestrator/orchestrate-reply.js"
  "scripts/registry/orchestrator/orchestrate-send-task.js"
  "scripts/registry/orchestrator/tnf-orchestrator.js"
  "scripts/registry/orchestrator/tnf-orchestrator-final.js"
  "scripts/registry/orchestrator/tnf-orchestrator-resume.js"
  "scripts/registry/orchestrator/tnf-orchestrator-status.js"
  "scripts/orchestrate_ecosystem.js"
  "scripts/orchestrator-red-channel.js"
  "scripts/orchestration/orchestrator-green-channel.js"
  "scripts/orchestration/orchestrator-persistent.js"
  "scripts/orchestration/orchestrator-yellow-channel.js"
  "scripts/orchestration/tnf-strategic-orchestrator.js"
)

ALWAYS_EXCLUDE=(
  # Private env files (should never be in any public repo)
  ".env"
  ".env.local"
  # Core apps only under apps/. Satellite tree is external:
  # The-New-Fuse/apps/extensions → ../../TNF-Extensions (symlink). Never follow
  # into public OSS export.
  "apps/extensions"
  # Non-regular top-level app placeholders/surfaces. The default public runtime
  # is the nine-app surface in data/distribution/oss-app-boundary.json; these
  # are separate satellites, hosted experiments, private SaaS surfaces, or
  # personal workstreams unless explicitly promoted through that manifest.
  "apps/ai-arcade"
  "apps/cloud-sandbox"
  "apps/gemini-bridge-extension"
  "apps/myphoneremote-api"
  "apps/nexus-orchestrator"
  "apps/poker-room"
  "apps/stripe-provider-bridge"
  "apps/telegram-mcp"
  "apps/virtual-library-blueprints"
  "apps/visualization-hub"
  # Personal-data tooling: mines the operator's Google Drive / ArDrive and hard-codes
  # a path to ~/.config/gcloud/legacy_credentials/<personal email>/. No credentials
  # live in these files, but the tooling and the PII do not belong in a public runtime.
  "scripts/personal-archaeology"
  ".agent/skills/personal-historical-archaeology"
  # Generated runtime artifacts. These carry absolute operator paths (and, in the
  # case of utp_events, agent handoff context) and are regenerated locally, so they
  # have no business in a distributed source tree. utp_events alone is ~11.5k files.
  "data/utp_events"
  ".verifier"
  "concordance_results"
  "page-analysis-results"
  "validation-results"
  # Build output committed to the tree (Rust target dir, turbo cache)
  "packages/relay-core/native/envelope-validator/target"
  "packages/relay-core/.turbo"
  # Local editor config and archived launchd plists — operator-machine specific,
  # both carry absolute home paths and neither is useful to a public consumer.
  ".cursor"
  "archive/disabled-launch-agents-20260623"
  # Benchmark run outputs (third-party SWE-bench fixtures + result dumps)
  ".agent/skills/antigravity/loki-mode/benchmarks/results"
  # Generated run records that embed absolute paths
  "data/ingestion-runs"
  "data/intelligence-artifacts"
  # Personal user data: an Apple Notes export. Not system data, not a fixture.
  "data/apple-notes-new-may-2026.json"
  # Fleet/agent run snapshots — regenerated locally, embed absolute paths
  ".agent/fleet/agent-pathway-matrix.json"
  ".agent/testing-status.json"
  ".tnf/agent-registry-snapshot.json"
  "data/agent-registry/agents.json"
  "data/video-reports"
  # Autonomous-daemon run state/logs
  "docs/operations/tnf-full-auto-daemon.log"
  "docs/operations/tnf-full-auto-runs.jsonl"
  "docs/operations/tnf-full-auto-state.json"
  # Generated audit/inventory reports (regenerated by the protocol tooling)
  "docs/protocols/reports/CODEBASE_PATHWAY_GRAPH_2026-07-24.html"
  "docs/protocols/reports/CODEBASE_PATHWAY_MAP_2026-07-24.json"
  "docs/protocols/reports/DOC_AUDIT_GROUND_TRUTH.json"
  "docs/protocols/reports/DOC_AUDIT_INVENTORY.json"
  "docs/protocols/reports/TNF_PHASE7_DIRECTIVE_CONVERSION_LATEST.json"
  "docs/protocols/reports/agent-pathway-matrix.latest.json"
  "docs/protocols/reports/tnf-cli-parity-vs-openclaw-2026-05-13.json"
  "docs/status-reports/package-lifecycle-baseline-2026-05-17.json"
  # Generated live/fleet reports embed local process listings and absolute
  # operator paths. They are regenerated by protocol tooling and should not
  # ship in the public source export.
  "docs/operations/audits"
  "docs/operations/debug"
  "docs/operations/tnf-master-reconciliation-report-latest.json"
  "docs/operations/tnf-master-reconciliation-report-latest.md"
  "docs/operations/tnf-action-receipts.jsonl"
  "docs/operations/tnf-full-auto-contention.jsonl"
  "docs/protocols/reports/FEDERATED_WS_CHANNEL_CHECK_LATEST.json"
  "docs/protocols/reports/LIVE_AGENT_WORK_CHECK_LATEST.json"
  "docs/protocols/reports/LIVE_AGENT_WORK_CHECK_LATEST.md"
  "docs/protocols/reports/MULTI_AGENT_CHAT_AUDIT_2026-08-09.md"
  ".agent/skill-bank/resource-registry-import.json"
  ".agent/skill-bank/skills-index.json"
  # Home-directory consolidation records (operator machine inventory)
  "docs/consolidation/archived-from-home"
  "docs/consolidation/home-cleanup-candidates.manifest"
  # Build cache / build output committed to the tree
  "packages/contracts/cache"
  "packages/mcp-concordance-server/dist"
  "apps/frontend/dev_logs.txt"
  "packages/sync-core/test-results.txt"
  # ── Operator-machine automation ───────────────────────────────────────────
  # These drive THIS operator's fleet: launchd wrappers, swarm daemons, autonomy
  # loops. They hard-code an absolute checkout location by nature and are useless
  # to a public consumer. This is the code-side of the system/user-data split:
  # distributable library code must be portable; operator automation need not be,
  # and therefore must not ship.
  "scripts/agents"
  "scripts/autonomy"
  "scripts/audit/swarm"
  ".deepsec"
  "scripts/gemini-wrapper-launchd.sh"
  "scripts/pi-wrapper-ctl.sh"
  "scripts/pi-wrapper-launch.sh"
  "scripts/pi-wrapper-launchd.sh"
  "scripts/execute-refactoring-consensus.ts"
  # Deprecated local install snapshot (canonical: scripts/system/)
  "voice-bridge-package-20260325"
  # Duplicated mirror directory
  "pull-create"
  # Log and generated artifacts
  "relay.log"
  "relay_log.txt"
  "prs.json"
  "cloud_runtime_list.json"
  "typecheck_output.txt"
  "chrome_processes.txt"
  "frontend_log.txt"
  "core_errors.txt"
  "release-gate-output.log"
  "deployments.txt"
  "flow_content.txt"
  "antigravity_test.txt"
  "patch_115668.diff"
  # Binary artifacts
  "dashboard_check.png"
  "home_verification.png"
  "login_verification.png"
  "workflow_builder_initial.png"
  # Junk directories
  "solid-shrimp"
  "strategic-cow"
  "~"
  "--help"
  ".venv_crawler"
)

# ─────────────────────────────────────────────────────────────────────
# PHASE 1: Sync fuse-control-plane
# ─────────────────────────────────────────────────────────────────────

if [ "$SYNC_CONTROL" = true ]; then
  echo "━━━ Phase 1: fuse-control-plane ━━━"
  echo ""

  CTRL_DIR="$WORK_DIR/fuse-control-plane"
  if [ -n "${GITHUB_PAT:-}" ]; then
    git clone "https://${GITHUB_PAT}@github.com/whodaniel/fuse-control-plane.git" "$CTRL_DIR" 2>&1 | grep -v "^$"
  else
    git clone https://github.com/whodaniel/fuse-control-plane.git "$CTRL_DIR" 2>&1 | grep -v "^$"
  fi

  cd "$CTRL_DIR"

  # Copy existing control-plane branch content (services, docs, etc.)
  cd "$MONO_ROOT"
  if git rev-parse repo-isolation/fuse-control-plane >/dev/null 2>&1; then
    for dir in services docs scripts .github; do
      git archive repo-isolation/fuse-control-plane -- "$dir/" 2>/dev/null | tar -x -C "$CTRL_DIR/" || true
    done
    git archive repo-isolation/fuse-control-plane -- README.md 2>/dev/null | tar -x -C "$CTRL_DIR/" || true
  fi

  # Ensure .gitignore
  cat > "$CTRL_DIR/.gitignore" << 'EOF'
node_modules/
dist/
.turbo/
*.map
.DS_Store
EOF

  # Sync cloudflare-sharedstate (source only)
  mkdir -p "$CTRL_DIR/cloudflare-sharedstate/src"
  for f in package.json tsconfig.json wrangler.toml schema.sql schema_v2.sql; do
    cp "$MONO_ROOT/cloudflare-sharedstate/$f" "$CTRL_DIR/cloudflare-sharedstate/" 2>/dev/null || true
  done
  cp "$MONO_ROOT/cloudflare-sharedstate/src/index.ts" "$CTRL_DIR/cloudflare-sharedstate/src/" 2>/dev/null || true

  # Sync source-originals from monorepo HEAD
  mkdir -p "$CTRL_DIR/source-originals/relay-core"
  cp "$MONO_ROOT/packages/relay-core/src/master-clock.ts" "$CTRL_DIR/source-originals/relay-core/" 2>/dev/null || true
  cp "$MONO_ROOT/packages/relay-core/src/broker-agent.ts" "$CTRL_DIR/source-originals/relay-core/" 2>/dev/null || true

  mkdir -p "$CTRL_DIR/source-originals/backend-orchestrator"
  cp "$MONO_ROOT/apps/backend/src/modules/orchestrator/"* "$CTRL_DIR/source-originals/backend-orchestrator/" 2>/dev/null || true

  mkdir -p "$CTRL_DIR/source-originals/nexus-orchestrator"
  cp -R "$MONO_ROOT/apps/extensions/nexus-orchestrator/src/"* "$CTRL_DIR/source-originals/nexus-orchestrator/" 2>/dev/null || true
  cp "$MONO_ROOT/apps/extensions/nexus-orchestrator/package.json" "$CTRL_DIR/source-originals/nexus-orchestrator/" 2>/dev/null || true

  mkdir -p "$CTRL_DIR/source-originals/picoclaw-overseer"
  find "$MONO_ROOT/apps/extensions/picoclaw-overseer" -maxdepth 1 -type f -not -name '*.map' -exec cp {} "$CTRL_DIR/source-originals/picoclaw-overseer/" \; 2>/dev/null || true
  [ -d "$MONO_ROOT/apps/extensions/picoclaw-overseer/src" ] && cp -R "$MONO_ROOT/apps/extensions/picoclaw-overseer/src" "$CTRL_DIR/source-originals/picoclaw-overseer/" 2>/dev/null || true

  if [ -d "$MONO_ROOT/packages/agent-coordination/src" ]; then
    mkdir -p "$CTRL_DIR/source-originals/agent-coordination"
    cp -R "$MONO_ROOT/packages/agent-coordination/src/"* "$CTRL_DIR/source-originals/agent-coordination/" 2>/dev/null || true
    cp "$MONO_ROOT/packages/agent-coordination/package.json" "$CTRL_DIR/source-originals/agent-coordination/" 2>/dev/null || true
  fi

  # Sync orchestration scripts
  mkdir -p "$CTRL_DIR/orchestration-scripts"
  for f in "${PROPRIETARY_SCRIPTS[@]}"; do
    cp "$MONO_ROOT/$f" "$CTRL_DIR/orchestration-scripts/" 2>/dev/null || true
  done

  # Remove any binaries >50MB
  find "$CTRL_DIR" -not -path '*/.git/*' -size +50M -type f -delete 2>/dev/null

  cd "$CTRL_DIR"
  git add -A
  CHANGES=$(git diff --cached --stat 2>/dev/null | wc -l | tr -d ' ')

  if [ "$CHANGES" -gt 0 ] || [ "$FORCE" = true ]; then
    git commit -m "sync: control-plane ← monorepo @ $MONO_HEAD ($TIMESTAMP)

Source commit: $MONO_MSG" 2>/dev/null

    if [ "$DRY_RUN" = true ]; then
      echo "🔍 DRY RUN: Would push $CHANGES changes to fuse-control-plane"
    else
      git push origin main 2>&1
      echo "✅ fuse-control-plane pushed ($CHANGES changes)"
    fi
  else
    echo "ℹ️  fuse-control-plane: no changes to sync"
  fi

  echo ""
fi

# ─────────────────────────────────────────────────────────────────────
# PHASE 2: Sync The-New-Fuse (public)
# ─────────────────────────────────────────────────────────────────────

if [ "$SYNC_OPEN" = true ]; then
  echo "━━━ Phase 2: The-New-Fuse (public) ━━━"
  echo ""

  OPEN_DIR="$WORK_DIR/The-New-Fuse"
  mkdir -p "$OPEN_DIR"
  echo "  Exporting monorepo HEAD via git archive (skips node_modules, dist, .turbo)..."
  (cd "$MONO_ROOT" && git archive HEAD) | tar -x -C "$OPEN_DIR"

  cd "$OPEN_DIR"
  git init -b main -q
  if [ -n "${GITHUB_PAT:-}" ]; then
    git remote add origin "https://${GITHUB_PAT}@github.com/whodaniel/The-New-Fuse.git"
  else
    git remote add origin https://github.com/whodaniel/The-New-Fuse.git
  fi

  # Remove proprietary files
  REMOVED=0
  for f in "${PROPRIETARY_FILES[@]}"; do
    [ -e "$f" ] && rm -f "$f" && ((REMOVED++)) || true
  done
  for d in "${PROPRIETARY_DIRS[@]}"; do
    [ -d "$d" ] && rm -rf "$d" && ((REMOVED++)) || true
  done
  for f in "${PROPRIETARY_SCRIPTS[@]}"; do
    [ -e "$f" ] && rm -f "$f" && ((REMOVED++)) || true
  done
  for f in "${ALWAYS_EXCLUDE[@]}"; do
    [ -e "$f" ] && rm -rf "$f" && ((REMOVED++)) || true
  done

  # Pattern-pruned build cache. These are tracked in the monorepo but are
  # regenerated locally and embed absolute operator paths in their logs
  # (packages/*/.turbo alone accounts for ~129 such files).
  while IFS= read -r d; do
    rm -rf "$d" && ((REMOVED++)) || true
  done < <(find . -type d \( -name '.turbo' -o -name 'node_modules' \) 2>/dev/null)

  # Remove temp/junk dotfiles
  rm -f .!*!home_verification.png 2>/dev/null || true

  echo "  Removed $REMOVED proprietary/excluded paths"

  # ── Create stubs ──

  mkdir -p "packages/relay-core/src"
  cat > "packages/relay-core/src/master-clock.ts" << 'STUB'
/**
 * Master Clock — Proprietary Component
 *
 * This module provides the Master Clock synchronization service for TNF.
 * The implementation is part of the proprietary control-plane
 * (https://github.com/whodaniel/fuse-control-plane).
 *
 * Public contracts are available in @the-new-fuse/control-plane-contracts.
 *
 * @see packages/control-plane-contracts for the public API surface
 */

export { MasterClockSignal, MasterClockConfig } from '@the-new-fuse/control-plane-contracts';

// Stub: Master Clock implementation is in the control-plane repo.
// This file is intentionally minimal in the open-source runtime.
export class MasterClockStub {
  async start(): Promise<void> {
    console.warn('[MasterClock] Running in stub mode — connect to control-plane for full functionality');
  }
}
STUB

  cat > "packages/relay-core/src/broker-agent.ts" << 'STUB'
/**
 * Broker Agent — Proprietary Component
 *
 * This module provides the Broker Agent service for TNF.
 * The implementation is part of the proprietary control-plane
 * (https://github.com/whodaniel/fuse-control-plane).
 *
 * Public contracts are available in @the-new-fuse/control-plane-contracts.
 *
 * @see packages/control-plane-contracts for the public API surface
 */

export { BrokerConfig } from '@the-new-fuse/control-plane-contracts';

// Stub: Broker Agent implementation is in the control-plane repo.
// This file is intentionally minimal in the open-source runtime.
export class BrokerAgentStub {
  async start(): Promise<void> {
    console.warn('[BrokerAgent] Running in stub mode — connect to control-plane for full functionality');
  }
}
STUB

  mkdir -p "apps/backend/src/modules/orchestrator"
  cat > "apps/backend/src/modules/orchestrator/index.ts" << 'STUB'
/**
 * Orchestrator Module — Proprietary Component
 *
 * The orchestration engine is part of the proprietary control-plane.
 * This stub module provides a no-op implementation for the open-source runtime.
 *
 * @see https://github.com/whodaniel/fuse-control-plane
 */

import { Module } from '@nestjs/common';

@Module({
  // Orchestrator functionality requires the control-plane.
  // This is a placeholder module for the open-source runtime.
})
export class OrchestratorModule {}

export default OrchestratorModule;
STUB

  echo "  Created 3 contract stubs"

  # ── Publication gates ─────────────────────────────────────────────────────
  # These MUST run here, in the actual publish path. They previously existed only
  # in scripts/verify-open-runtime-export.sh, which is a separate script someone
  # has to remember to run — so `pnpm run sync:repos` could publish a leak while
  # the guard sat unused. Same failure shape as the bare-filename bug: a guard
  # that exists but is not in the path that matters.
  echo ""
  echo "  ━━ Publication gates ━━"

  chmod +x "$MONO_ROOT/scripts/check-proprietary-leakage.sh"
  if ! "$MONO_ROOT/scripts/check-proprietary-leakage.sh" "$OPEN_DIR"; then
    echo ""
    echo "ABORT: proprietary content present in the open-runtime export."
    echo "       Nothing was pushed."
    exit 1
  fi

  PERSONAL_HITS="$(grep -rIl -E '/Users/[a-zA-Z0-9._-]+/' "$OPEN_DIR" 2>/dev/null | grep -v '^'"$OPEN_DIR"'/\.git/' || true)"
  if [ -n "$PERSONAL_HITS" ]; then
    COUNT="$(printf '%s\n' "$PERSONAL_HITS" | grep -c . || true)"
    echo "ABORT: $COUNT file(s) contain a hard-coded /Users/<name>/ path."
    echo "       Replace the literal with runtime resolution, or exclude the file."
    printf '%s\n' "$PERSONAL_HITS" | sed "s#^$OPEN_DIR/##" | sed -n '1,20p' | sed 's/^/         /'
    echo "       Nothing was pushed."
    exit 1
  fi
  echo "  PASS: no proprietary content, no hard-coded operator paths"
  echo ""

  git add -A
  git commit -m "sync: open-runtime ← monorepo @ $MONO_HEAD ($TIMESTAMP)

Source commit: $MONO_MSG
Proprietary content stripped. Stubs reference fuse-control-plane." 2>/dev/null || echo "Nothing to commit"

  if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN: Would force-push to The-New-Fuse (public)"
  else
    git push origin main --force 2>&1
    echo "✅ The-New-Fuse (public) pushed (force)"
  fi

  echo ""
fi

# ─────────────────────────────────────────────────────────────────────
# Cleanup
# ─────────────────────────────────────────────────────────────────────

echo "━━━ Cleanup ━━━"
chmod -R u+w "$WORK_DIR" 2>/dev/null || true
rm -rf "$WORK_DIR" 2>/dev/null || true
echo "  Removed temp directory"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Sync complete ✅                            ║"
echo "║  Source: whodaniel/tnf-monorepo @ $MONO_HEAD              ║"
echo "╚══════════════════════════════════════════════╝"
