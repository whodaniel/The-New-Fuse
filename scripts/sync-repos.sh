#!/bin/bash
set -euo pipefail

# =============================================================================
# TNF Repo Separation Sync Script
# =============================================================================
#
# PURPOSE:
#   Syncs the combined monorepo (whodaniel/fuse) to the two downstream repos:
#     1. whodaniel/fuse-open-runtime   (90% open-source)
#     2. whodaniel/fuse-control-plane  (10% proprietary)
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
      echo "  --open      Sync only fuse-open-runtime"
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
echo "Source: whodaniel/fuse @ $MONO_HEAD"
echo "        \"$MONO_MSG\""
echo ""

# ─────────────────────────────────────────────────────────────────────
# PROPRIETARY EXCLUSION LIST
# ─────────────────────────────────────────────────────────────────────
# These paths are REMOVED from fuse-open-runtime and EXTRACTED to
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
  # Nexus Orchestrator app (private 3D visualization)
  "apps/nexus-orchestrator"
  # PicoClaw Overseer (private agent oversight)
  "apps/picoclaw-overseer"
  # Cloudflare SharedState worker
  "cloudflare-sharedstate"
  # Agent coordination patterns
  "packages/agent-coordination"
)

PROPRIETARY_SCRIPTS=(
  "tnf-master-orchestrator.ts"
  "orchestrate-blue.js"
  "orchestrate-claude-blue.js"
  "orchestrate-claude-green.js"
  "orchestrate-green.js"
  "orchestrate-listener.js"
  "orchestrate-reply.js"
  "orchestrate-send-task.js"
  "orchestrate_antigravity.js"
  "orchestrate_cloud_qa.js"
  "orchestrate_ecosystem.js"
  "orchestrator-green-channel.js"
  "orchestrator-persistent.js"
  "orchestrator-red-channel.js"
  "orchestrator-yellow-channel.js"
  "tnf-orchestrator.js"
  "tnf-orchestrator-final.js"
  "tnf-orchestrator-resume.js"
  "tnf-orchestrator-status.js"
  "tnf-strategic-orchestrator.js"
)

ALWAYS_EXCLUDE=(
  # Private env files (should never be in any public repo)
  ".env"
  ".env.local"
  # Duplicated mirror directory
  "pull-create"
  # Log and generated artifacts
  "relay.log"
  "relay_log.txt"
  "prs.json"
  "railway_list.json"
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
  git clone https://github.com/whodaniel/fuse-control-plane.git "$CTRL_DIR" 2>&1 | grep -v "^$"

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
  cp -R "$MONO_ROOT/apps/nexus-orchestrator/src/"* "$CTRL_DIR/source-originals/nexus-orchestrator/" 2>/dev/null || true
  cp "$MONO_ROOT/apps/nexus-orchestrator/package.json" "$CTRL_DIR/source-originals/nexus-orchestrator/" 2>/dev/null || true

  mkdir -p "$CTRL_DIR/source-originals/picoclaw-overseer"
  find "$MONO_ROOT/apps/picoclaw-overseer" -maxdepth 1 -type f -not -name '*.map' -exec cp {} "$CTRL_DIR/source-originals/picoclaw-overseer/" \; 2>/dev/null || true
  [ -d "$MONO_ROOT/apps/picoclaw-overseer/src" ] && cp -R "$MONO_ROOT/apps/picoclaw-overseer/src" "$CTRL_DIR/source-originals/picoclaw-overseer/" 2>/dev/null || true

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
# PHASE 2: Sync fuse-open-runtime
# ─────────────────────────────────────────────────────────────────────

if [ "$SYNC_OPEN" = true ]; then
  echo "━━━ Phase 2: fuse-open-runtime ━━━"
  echo ""

  OPEN_DIR="$WORK_DIR/fuse-open-runtime"
  git clone "$MONO_ROOT" "$OPEN_DIR" --single-branch --branch main 2>&1 | grep -v "^$"

  cd "$OPEN_DIR"

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

  # Update remote to point to open-runtime
  git remote remove origin 2>/dev/null || true
  git remote add origin https://github.com/whodaniel/fuse-open-runtime.git

  git add -A
  git commit -m "sync: open-runtime ← monorepo @ $MONO_HEAD ($TIMESTAMP)

Source commit: $MONO_MSG
Proprietary content stripped. Stubs reference fuse-control-plane." 2>/dev/null || echo "Nothing to commit"

  if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN: Would force-push to fuse-open-runtime"
  else
    git push origin main --force 2>&1
    echo "✅ fuse-open-runtime pushed (force)"
  fi

  echo ""
fi

# ─────────────────────────────────────────────────────────────────────
# Cleanup
# ─────────────────────────────────────────────────────────────────────

echo "━━━ Cleanup ━━━"
rm -rf "$WORK_DIR"
echo "  Removed temp directory"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Sync complete ✅                            ║"
echo "║  Source: whodaniel/fuse @ $MONO_HEAD              ║"
echo "╚══════════════════════════════════════════════╝"
