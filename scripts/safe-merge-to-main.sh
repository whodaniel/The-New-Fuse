#!/usr/bin/env bash
set -euo pipefail
# Current reviewed PR merge entrypoint. Never switches or merges a shared checkout.
if [[ $# -lt 1 || $# -gt 2 || ! "$1" =~ ^[1-9][0-9]*$ ]]; then
  echo "Usage: $0 <PR number> [--squash]" >&2
  exit 1
fi
method="${2:---merge}"
if [[ "$method" != "--merge" && "$method" != "--squash" ]]; then
  echo "Expected --squash or no second argument" >&2
  exit 1
fi
root="$(git rev-parse --show-toplevel)"
cd "$root"
exec node scripts/protocols/synchronized-review-gate.cjs "--pr=$1" "$method"
