#!/usr/bin/env bash
set -euo pipefail

TEXT_INPUT=""
FILE_INPUTS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --text)
      TEXT_INPUT="${2:-}"
      shift 2
      ;;
    --file)
      FILE_INPUTS+=("${2:-}")
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [--text 'task text'] [--file path/to/context.txt]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

aggregate="$TEXT_INPUT"
for f in "${FILE_INPUTS[@]-}"; do
  if [[ -n "$f" && -f "$f" ]]; then
    aggregate+=$'\n'
    aggregate+="$(cat "$f")"
  fi
done

normalized="$(printf '%s' "$aggregate" | tr '[:upper:]' '[:lower:]')"

manual_intent='(manual|manually|visual|visually|look at|view|see|browser|screenshot|screen recording|human qa|click through|ui review|ux review)'
frontend_surface='(frontend|ui|ux|page|screen|route|component|website|web app|browser)'

if [[ "$normalized" =~ (manual[[:space:]]+(frontend|ui|ux|browser|website|testing)) ]]; then
  echo "BLOCKED: manual frontend/browser testing or viewing task detected." >&2
  exit 1
fi

if [[ "$normalized" =~ (visual[[:space:]]+(qa|review|check|inspection)) ]]; then
  echo "BLOCKED: visual QA/review task detected." >&2
  exit 1
fi

if [[ "$normalized" =~ $manual_intent ]] && [[ "$normalized" =~ $frontend_surface ]]; then
  echo "BLOCKED: browser/frontend viewing intent detected; do not route to Jules." >&2
  exit 1
fi

exit 0
