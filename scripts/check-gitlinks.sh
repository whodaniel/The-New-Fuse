#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

allowlist_file=".gitlink-allowlist"
if [[ ! -f "$allowlist_file" ]]; then
  echo "Missing $allowlist_file"
  exit 1
fi

gitlinks="$(git ls-files -s | awk '$1=="160000" {print $4}' | sort)"
allowed="$(grep -v '^[[:space:]]*#' "$allowlist_file" | sed '/^[[:space:]]*$/d' | sort)"

unknown=()
while IFS= read -r p; do
  [[ -z "$p" ]] && continue
  if ! printf '%s\n' "$allowed" | grep -qx "$p"; then
    unknown+=("$p")
  fi
done <<< "$gitlinks"

if (( ${#unknown[@]} > 0 )); then
  echo "Unknown gitlinks not present in $allowlist_file:"
  printf ' - %s\n' "${unknown[@]}"
  exit 1
fi

missing=()
while IFS= read -r p; do
  [[ -z "$p" ]] && continue
  if ! printf '%s\n' "$gitlinks" | grep -qx "$p"; then
    missing+=("$p")
  fi
done <<< "$allowed"

if (( ${#missing[@]} > 0 )); then
  echo "Allowlist contains paths that are not gitlinks anymore:"
  printf ' - %s\n' "${missing[@]}"
  exit 1
fi

dirty=()
while IFS= read -r line; do
  # line format for submodules: "<prefix><sha> <path> ..."
  path="$(awk '{print $2}' <<< "$line")"
  prefix="$(cut -c1 <<< "$line")"
  # '-' means not initialized. '+' means SHA mismatch. 'U' means merge conflict.
  if [[ "$prefix" != " " ]]; then
    dirty+=("$path ($prefix)")
  fi
done < <(git submodule status 2>/dev/null || true)

if (( ${#dirty[@]} > 0 )); then
  echo "Gitlinks with detached/uninitialized/mismatch state:"
  printf ' - %s\n' "${dirty[@]}"
  exit 1
fi

count="$(printf '%s\n' "$gitlinks" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "Gitlink integrity check passed (${count} tracked)."
