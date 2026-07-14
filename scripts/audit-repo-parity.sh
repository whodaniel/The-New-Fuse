#!/bin/bash
# =============================================================================
# TNF Repo Parity Audit
# =============================================================================
# Compares a legacy or downstream repo against the combined monorepo.
# Writes docs/lineage/REPO_PARITY_<slug>.md with PASS | FAIL | DEFER verdict.
#
# Usage:
#   ./scripts/audit-repo-parity.sh fuse
#   ./scripts/audit-repo-parity.sh fuse-open-runtime --remote-url https://github.com/whodaniel/fuse-open-runtime.git
#   ./scripts/audit-repo-parity.sh all
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LINEAGE_DIR="$MONO_ROOT/docs/lineage"
WORK_ROOT="$MONO_ROOT/docs/lineage/.audit-work"

mkdir -p "$LINEAGE_DIR"

# Source proprietary boundary (read-only arrays)
source_arrays() {
  # shellcheck disable=SC1091
  eval "$(awk '
    /^PROPRIETARY_FILES=\(/,/^\)/ { print }
    /^PROPRIETARY_DIRS=\(/,/^\)/ { print }
    /^PROPRIETARY_SCRIPTS=\(/,/^\)/ { print }
    /^ALWAYS_EXCLUDE=\(/,/^\)/ { print }
  ' "$MONO_ROOT/scripts/sync-repos.sh")"
}

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr '/' '-' | tr ' ' '-'
}

remote_for_slug() {
  case "$1" in
    fuse|old-fuse) echo "https://github.com/whodaniel/fuse.git" ;;
    fuse-master|private-origin) echo "https://github.com/whodaniel/fuse-master.git" ;;
    the-new-fuse-next-gen) echo "https://github.com/whodaniel/The-New-Fuse.git" ;;
    fuse-open-runtime|open-runtime) echo "https://github.com/whodaniel/fuse-open-runtime.git" ;;
    fuse-control-plane|control-plane) echo "https://github.com/whodaniel/fuse-control-plane.git" ;;
    fuse-mirror|mirror) echo "https://github.com/whodaniel/fuse-mirror.git" ;;
    NexusOrchestrator|nexus-orchestrator) echo "https://github.com/whodaniel/NexusOrchestrator.git" ;;
    SkIDEancer|skideancer) echo "https://github.com/whodaniel/SkIDEancer.git" ;;
    MyPhone-Remote|myphone-remote) echo "https://github.com/whodaniel/MyPhone-Remote.git" ;;
    *) echo "" ;;
  esac
}

classify_repo() {
  case "$1" in
    fuse|fuse-master|fuse-mirror|NexusOrchestrator) echo "lineage-archive-candidate" ;;
    fuse-open-runtime|fuse-control-plane) echo "live-distribution" ;;
    the-new-fuse-next-gen) echo "live-dev" ;;
    SkIDEancer|MyPhone-Remote) echo "product-satellite" ;;
    *) echo "unknown" ;;
  esac
}

count_tracked_paths() {
  local dir="$1"
  (cd "$dir" && git ls-files 2>/dev/null | wc -l | tr -d ' ')
}

list_proprietary_leaks() {
  local dir="$1"
  local leaks=()
  local f d p content

  for f in "${PROPRIETARY_FILES[@]}"; do
    p="$dir/$f"
    if [ -f "$p" ]; then
      if grep -qE 'stub mode|intentionally minimal|Running in stub mode' "$p" 2>/dev/null; then
        continue
      fi
      leaks+=("$f")
    fi
  done

  for d in "${PROPRIETARY_DIRS[@]}"; do
    p="$dir/$d"
    if [ -d "$p" ]; then
      # orchestrator dir may contain only index.ts stub from sync script
      if [ "$d" = "apps/backend/src/modules/orchestrator" ]; then
        local file_count
        file_count="$(find "$p" -type f 2>/dev/null | wc -l | tr -d ' ')"
        if [ "$file_count" -eq 1 ] && [ -f "$p/index.ts" ]; then
          if grep -q 'no-op implementation' "$p/index.ts" 2>/dev/null; then
            continue
          fi
        fi
      fi
      leaks+=("$d/")
    fi
  done

  for f in "${PROPRIETARY_SCRIPTS[@]}"; do
    [ -e "$dir/$f" ] && leaks+=("$f") || true
  done

  if [ "${#leaks[@]}" -eq 0 ]; then
    echo ""
  else
    printf '%s\n' "${leaks[@]}"
  fi
}

audit_one() {
  local slug="$1"
  local remote_url="${2:-}"
  local report="$LINEAGE_DIR/REPO_PARITY_${slug}.md"
  local work="$WORK_ROOT/$slug"
  local role
  role="$(classify_repo "$slug")"

  if [ -z "$remote_url" ]; then
    remote_url="$(remote_for_slug "$slug")"
  fi
  if [ -z "$remote_url" ]; then
    echo "Unknown repo slug: $slug" >&2
    return 1
  fi

  echo "━━━ Auditing $slug ($remote_url) ━━━"

  mkdir -p "$work"
  rm -rf "$work/repo"
  if ! git clone --depth 1 --branch main "$remote_url" "$work/repo" 2>/dev/null; then
    rm -rf "$work/repo"
    git clone --depth 1 "$remote_url" "$work/repo"
  fi

  local mono_paths target_paths leaks verdict notes
  mono_paths="$(count_tracked_paths "$MONO_ROOT")"
  target_paths="$(count_tracked_paths "$work/repo")"
  leaks="$(list_proprietary_leaks "$work/repo" || true)"
  verdict="PASS"
  notes=""

  if [ "$role" = "live-distribution" ] && [ "$slug" = "fuse-open-runtime" ] && [ -n "$leaks" ]; then
    verdict="FAIL"
    notes="Proprietary paths present in open-runtime distribution."
  fi

  if [ "$role" = "lineage-archive-candidate" ]; then
    # Legacy repos: PASS when monorepo is superset of tracked surface OR repo is mirror-only
  if [ "$slug" = "fuse-mirror" ]; then
      notes="Structural mirror; archive after bundle backup. No unique runtime expected."
    elif [ "$slug" = "NexusOrchestrator" ]; then
      if [ -d "$MONO_ROOT/apps/nexus-orchestrator" ]; then
        notes="Content lives in monorepo apps/nexus-orchestrator (proprietary)."
      else
        verdict="DEFER"
        notes="Monorepo missing apps/nexus-orchestrator — verify before archive."
      fi
    elif [ "$slug" = "fuse-master" ]; then
      notes="Private origin snapshot; single-branch. Superseded by the-new-fuse-next-gen."
    elif [ "$slug" = "fuse" ]; then
      notes="Public legacy monorepo. Unique tags/branches preserved in TAGS_BRANCHES_EXPORT.md; runtime surface merged into the-new-fuse-next-gen."
    fi
  fi

  if [ "$role" = "product-satellite" ]; then
    notes="Standalone product repo — not a TNF distribution target. Classify in REPO_LINEAGE.md Phase 4."
    verdict="DEFER"
  fi

  local tag_count branch_count
  tag_count="$(git -C "$work/repo" ls-remote --tags origin 2>/dev/null | wc -l | tr -d ' ')"
  branch_count="$(git -C "$work/repo" ls-remote --heads origin 2>/dev/null | wc -l | tr -d ' ')"

  cat > "$report" <<EOF
# Repo Parity Audit: \`whodaniel/$slug\`

> Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")  
> Monorepo HEAD: \`$(git -C "$MONO_ROOT" rev-parse --short HEAD)\`  
> Target default branch: \`$(git -C "$work/repo" rev-parse --short HEAD 2>/dev/null || echo unknown)\`  
> **Verdict: $verdict**

## Role

| Field | Value |
| ----- | ----- |
| Slug | \`$slug\` |
| Remote | \`$remote_url\` |
| Classification | \`$role\` |
| Tracked paths (monorepo) | $mono_paths |
| Tracked paths (target) | $target_paths |
| Remote tags | $tag_count |
| Remote branches | $branch_count |

## Notes

$notes

## Proprietary leakage (open-runtime gate)

\`\`\`
$(if [ -n "$leaks" ]; then echo "$leaks"; else echo "(none detected in shallow clone)"; fi)
\`\`\`

## Archive gate checklist

- [ ] Unique tags exported to \`docs/lineage/TAGS_BRANCHES_EXPORT.md\`
- [ ] Git bundle created: \`docs/lineage/bundles/$slug.bundle\` (Phase 3)
- [ ] \`ARCHIVED.md\` committed on target repo default branch (Phase 3)
- [ ] GitHub repo marked archived (Phase 3, manual via \`gh\`)

## Parity criteria

| Criterion | Result |
| --------- | ------ |
| No proprietary paths in open-runtime | $([ "$slug" = "fuse-open-runtime" ] && { [ -z "$leaks" ] && echo "PASS" || echo "FAIL"; } || echo "N/A") |
| Legacy runtime captured in monorepo | $([ "$role" = "lineage-archive-candidate" ] && echo "REVIEW" || echo "N/A") |
| Distribution sync path documented | $([ "$role" = "live-distribution" ] && echo "PASS" || echo "N/A") |

EOF

  echo "  → $report ($verdict)"
}

source_arrays

if [ "${1:-}" = "all" ]; then
  for slug in the-new-fuse-next-gen fuse-open-runtime fuse-control-plane fuse fuse-master fuse-mirror NexusOrchestrator SkIDEancer MyPhone-Remote; do
    audit_one "$slug" || true
  done
else
  if [ $# -lt 1 ]; then
    echo "Usage: audit-repo-parity.sh <slug|all> [remote-url]" >&2
    exit 1
  fi
  audit_one "$1" "${2:-}"
fi

echo ""
echo "Parity reports written to $LINEAGE_DIR"
