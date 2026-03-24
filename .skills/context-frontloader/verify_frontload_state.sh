#!/usr/bin/env bash
set -euo pipefail

echo "[tnf-frontload] verify"

zshrc="$HOME/.zshrc"
tnf_dir="$HOME/.tnf"
cache="$tnf_dir/handoff-current.json"
status_bin="$tnf_dir/tnf-status"
claude_env="$HOME/.tnf-claude-env"

fail=0

if [[ ! -d "$tnf_dir" ]]; then
  echo "FAIL: missing $tnf_dir"
  fail=1
fi

if [[ ! -x "$status_bin" ]]; then
  echo "FAIL: missing or not executable $status_bin"
  fail=1
fi

if [[ ! -f "$cache" ]]; then
  echo "WARN: missing $cache (banner may not show)"
fi

if [[ -f "$zshrc" ]]; then
  if ! rg -n "\\.tnf/tnf-status" "$zshrc" >/dev/null 2>&1; then
    echo "WARN: $zshrc does not appear to run ~/.tnf/tnf-status"
  fi
  if ! rg -n "\\.tnf-claude-env" "$zshrc" >/dev/null 2>&1; then
    echo "WARN: $zshrc does not source ~/.tnf-claude-env"
  fi
else
  echo "FAIL: missing $zshrc"
  fail=1
fi

if [[ ! -f "$claude_env" ]]; then
  echo "WARN: missing $claude_env"
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "OK"

