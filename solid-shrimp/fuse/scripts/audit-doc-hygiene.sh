#!/usr/bin/env bash
set -euo pipefail

# Guardrail: fail if tracked files include personal/dev doc artifacts.

if ! command -v rg >/dev/null 2>&1; then
  echo "Error: ripgrep (rg) is required for docs hygiene check." >&2
  exit 2
fi

PATTERN='(^|/)\.tmp-agent-home/|(^|/)\.![0-9]+!|(^|/)home_verification\.png$|(^|/)login_debug\.png$|(^|/).+\.backup$|(^|/).+\.bak$|(^|/)build_log(_[0-9]+)?\.txt$|(^|/)docs/(personal|business|strategy)/|(^|/)\.agent/handoff_notes\.txt$|^packages/gemini-browser-skill/data/library_import/|^packages/gemini-browser-skill/data/(ProcessingStatusReport\.md|processing_state\.json|gap_analysis\.txt)$|^\.documentation-system/(analysis/|raw_manifest\.txt|classified-manifest\.json|manifest\.json)$'

matches="$(git ls-files | rg -n -e "$PATTERN" || true)"

if [[ -n "$matches" ]]; then
  echo "FAIL: tracked document hygiene violations detected."
  echo
  echo "$matches"
  echo
  echo "Next step:"
  echo "  Remove from git index while keeping local files:"
  echo "  git rm -r --cached <paths...>"
  exit 1
fi

echo "PASS: no tracked document hygiene violations found."
