#!/usr/bin/env bash
#
# scripts/sub-director/sync-runtime.sh
#
# Materialise the Sub-Director Lane 2 runtime from the repository into
# ~/.tnf/sub-director/, making the repo authoritative.
#
# WHY THIS EXISTS
#   Until 2026-08-12 the entire Lane 2 runtime was hand-placed and untracked:
#
#     model_resolver.py       0 tracked copies   (chooses the model for EVERY worker)
#     run_one_envelope.py     0 tracked copies   (the envelope drainer itself)
#     model-policy.yaml       0 tracked copies   (operator spend policy)
#
#   No version history, no review, no rollback, no CI, and invisible to
#   repo-wide search. That is how three provider catalogs in the repo were
#   maintained and improved while the resolver silently froze at two hardcoded
#   endpoints — see docs/protocols/TNF_PROVIDER_RESOLUTION_COHERENCE.md.
#
#   Core Tenet 5 protects .tnf/ as STATE. Code that happens to live there is
#   still code, and needs governing rather than merely preserving.
#
# WHAT IT DOES / DOES NOT TOUCH
#   Syncs CODE:    model_resolver.py, run_one_envelope.py
#   Never syncs:   model-policy.yaml — operator spend policy, same class as
#                  .env. Seeded from the example only when absent, then left
#                  alone forever. Overwriting it could silently enable paid
#                  cloud escalation.
#   Never touches: run-artifacts/, models/, logs, or anything else under
#                  ~/.tnf/sub-director/ (Tenet 5).
#
# Every replaced file is backed up next to itself with a timestamp, so a bad
# sync is recoverable without git access on the runtime host.
#
# Usage:
#   scripts/sub-director/sync-runtime.sh            # apply
#   scripts/sub-director/sync-runtime.sh --check    # report drift, change nothing
#                                                   # exit 0 in sync, 1 drifted

set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="${TNF_SUBDIRECTOR_DIR:-$HOME/.tnf/sub-director}"
CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

# Code files only. Policy is deliberately absent from this list.
CODE_FILES=(model_resolver.py run_one_envelope.py)

drift=0
mkdir -p "$RUNTIME_DIR"

for f in "${CODE_FILES[@]}"; do
  src="$REPO_DIR/$f"
  dst="$RUNTIME_DIR/$f"

  if [ ! -f "$src" ]; then
    echo "  MISSING IN REPO  $f" >&2
    drift=1
    continue
  fi

  if [ -f "$dst" ] && cmp -s "$src" "$dst"; then
    echo "  in sync          $f"
    continue
  fi

  drift=1
  if [ "$CHECK_ONLY" -eq 1 ]; then
    echo "  DRIFTED          $f  (runtime differs from repo)"
    continue
  fi

  if [ -f "$dst" ]; then
    backup="$dst.bak-$(date +%Y%m%d-%H%M%S)"
    cp "$dst" "$backup" || { echo "  BACKUP FAILED $f — refusing to overwrite" >&2; exit 2; }
    echo "  updated          $f  (previous -> $(basename "$backup"))"
  else
    echo "  installed        $f"
  fi
  cp "$src" "$dst"
  chmod +x "$dst" 2>/dev/null || true
done

# Policy: seed once, never overwrite.
policy_src="$REPO_DIR/model-policy.example.yaml"
policy_dst="$RUNTIME_DIR/model-policy.yaml"
if [ ! -f "$policy_dst" ] && [ -f "$policy_src" ]; then
  cp "$policy_src" "$policy_dst"
  echo "  seeded           model-policy.yaml (from example; edit to set spend policy)"
elif [ -f "$policy_dst" ]; then
  echo "  preserved        model-policy.yaml (operator config — never overwritten)"
fi

if [ "$CHECK_ONLY" -eq 1 ]; then
  if [ "$drift" -ne 0 ]; then
    echo "sub-director runtime has DRIFTED from the repo. Apply: scripts/sub-director/sync-runtime.sh" >&2
    exit 1
  fi
  echo "sub-director runtime matches the repo."
fi
exit 0
