#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
WORKSPACE_DIR="${TNF_WORKSPACE_DIR:-$(cd "$REPO_ROOT/.." && pwd)}"

usage() {
  cat <<USAGE
Usage:
  pcloud_api_offload.sh <remote_folder_path> [--delete-source] [path1 path2 ...]

Examples:
  pcloud_api_offload.sh /Offload-$(date +%F)
  pcloud_api_offload.sh /Offload-$(date +%F) --delete-source
  pcloud_api_offload.sh /Offload-$(date +%F) \
    "\$HOME/Documents/Audio Docs" \
    "\$HOME/mini-omni/checkpoint/lit_model.pth"

Credentials:
  Export either:
    PCLOUD_USER / PCLOUD_PASS
  or let the script prompt for them.

Optional:
  PCLOUD_HOST=api.pcloud.com  (or eapi.pcloud.com)
USAGE
}

json_value() {
  local expr="$1"
  local payload="${2:-}"
  /usr/bin/python3 - "$expr" "$payload" <<'PY'
import json
import sys
expr = sys.argv[1]
raw = sys.argv[2]
if not raw.strip():
    print("")
    sys.exit(0)
obj = json.loads(raw)
value = eval(expr, {"__builtins__": {}}, {"d": obj})
if value is None:
    print("")
else:
    print(value)
PY
}

api_get() {
  local host="$1"
  local method="$2"
  shift 2
  curl -fsS --get "https://${host}/${method}" "$@"
}

api_post_upload() {
  local host="$1"
  local auth="$2"
  local folderid="$3"
  local file="$4"
  curl -fsS -X POST "https://${host}/uploadfile" \
    -F "auth=${auth}" \
    -F "folderid=${folderid}" \
    -F "nopartial=1" \
    -F "renameifexists=1" \
    -F "filename=@${file}"
}

ensure_remote_folder() {
  local host="$1"
  local auth="$2"
  local parent_id="$3"
  local name="$4"

  local resp
  resp="$(api_get "$host" "createfolderifnotexists" \
    --data-urlencode "auth=${auth}" \
    --data-urlencode "folderid=${parent_id}" \
    --data-urlencode "name=${name}")"

  local result
  result="$(json_value 'd.get("result")' "$resp")"
  if [[ "$result" != "0" ]]; then
    echo "ERROR createfolderifnotexists failed (result=${result}) for name=${name}" >&2
    return 1
  fi

  json_value 'd.get("metadata", {}).get("folderid")' "$resp"
}

ensure_rel_path() {
  local host="$1"
  local auth="$2"
  local root_id="$3"
  local rel_path="$4"

  if [[ -z "$rel_path" || "$rel_path" == "." ]]; then
    echo "$root_id"
    return 0
  fi

  local current_id="$root_id"
  local partial=""
  local segment cached

  IFS='/' read -r -a parts <<< "$rel_path"
  for segment in "${parts[@]}"; do
    if [[ -z "$segment" || "$segment" == "." ]]; then
      continue
    fi

    if [[ -z "$partial" ]]; then
      partial="$segment"
    else
      partial="$partial/$segment"
    fi

    cached="$(awk -F '\t' -v p="$partial" '$1==p{print $2; exit}' "$CACHE_FILE" || true)"
    if [[ -n "$cached" ]]; then
      current_id="$cached"
      continue
    fi

    current_id="$(ensure_remote_folder "$host" "$auth" "$current_id" "$segment")"
    printf '%s\t%s\n' "$partial" "$current_id" >> "$CACHE_FILE"
  done

  echo "$current_id"
}

upload_file() {
  local host="$1"
  local auth="$2"
  local folderid="$3"
  local file="$4"

  local resp
  resp="$(api_post_upload "$host" "$auth" "$folderid" "$file")"

  local result
  result="$(json_value 'd.get("result")' "$resp")"
  if [[ "$result" != "0" ]]; then
    echo "ERROR upload failed (result=${result}) file=$file" >&2
    return 1
  fi

  return 0
}

if [[ "${1:-}" == "" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 1
fi

REMOTE_ROOT="$1"
shift || true

DELETE_SOURCE=false
if [[ "${1:-}" == "--delete-source" ]]; then
  DELETE_SOURCE=true
  shift || true
fi

declare -a SOURCES
if [[ "$#" -gt 0 ]]; then
  SOURCES=("$@")
else
  SOURCES=(
    "$WORKSPACE_DIR"
    "$HOME/Documents/CODE - 2024"
    "$HOME/Documents/Audio Docs"
    "$HOME/mini-omni/checkpoint/lit_model.pth"
    "$HOME/Downloads/ai_arcade_poker_assets"
  )
fi

if [[ -z "${PCLOUD_USER:-}" ]]; then
  read -r -p "pCloud email: " PCLOUD_USER
fi
if [[ -z "${PCLOUD_PASS:-}" ]]; then
  read -r -s -p "pCloud password: " PCLOUD_PASS
  echo
fi

HOSTS=()
if [[ -n "${PCLOUD_HOST:-}" ]]; then
  HOSTS=("$PCLOUD_HOST")
else
  HOSTS=("api.pcloud.com" "eapi.pcloud.com")
fi

AUTH=""
API_HOST=""
for host in "${HOSTS[@]}"; do
  login_resp="$(api_get "$host" "userinfo" \
    --data-urlencode "getauth=1" \
    --data-urlencode "username=${PCLOUD_USER}" \
    --data-urlencode "password=${PCLOUD_PASS}" || true)"
  if [[ -z "$login_resp" ]]; then
    continue
  fi

  result="$(json_value 'd.get("result")' "$login_resp")"
  if [[ "$result" == "0" ]]; then
    auth_candidate="$(json_value 'd.get("auth")' "$login_resp")"
    if [[ -n "$auth_candidate" ]]; then
      AUTH="$auth_candidate"
      API_HOST="$host"
      break
    fi
  fi
done

if [[ -z "$AUTH" || -z "$API_HOST" ]]; then
  echo "Failed to authenticate to pCloud API." >&2
  echo "If your account is in EU, try: export PCLOUD_HOST=eapi.pcloud.com" >&2
  exit 2
fi

# Normalize remote root path.
REMOTE_ROOT="${REMOTE_ROOT#/}"
REMOTE_ROOT="${REMOTE_ROOT%/}"

CACHE_FILE="$(mktemp /tmp/pcloud-folder-cache.XXXXXX)"
trap 'rm -f "$CACHE_FILE"' EXIT

echo "Authenticated on ${API_HOST}"

dest_folder_id=0
if [[ -n "$REMOTE_ROOT" ]]; then
  IFS='/' read -r -a root_parts <<< "$REMOTE_ROOT"
  for segment in "${root_parts[@]}"; do
    if [[ -z "$segment" ]]; then
      continue
    fi
    dest_folder_id="$(ensure_remote_folder "$API_HOST" "$AUTH" "$dest_folder_id" "$segment")"
  done
fi

printf '.\t%s\n' "$dest_folder_id" >> "$CACHE_FILE"

echo "Remote destination: /${REMOTE_ROOT} (folderid=${dest_folder_id})"
echo "Delete source after upload: ${DELETE_SOURCE}"

sources_failed=0
files_uploaded=0

for src in "${SOURCES[@]}"; do
  if [[ ! -e "$src" ]]; then
    echo "SKIP missing: $src"
    continue
  fi

  echo
  echo "==> Source: $src"
  source_failed=0

  if [[ -f "$src" ]]; then
    if upload_file "$API_HOST" "$AUTH" "$dest_folder_id" "$src"; then
      files_uploaded=$((files_uploaded + 1))
      echo "Uploaded file: $(basename "$src")"
    else
      source_failed=1
    fi
  else
    while IFS= read -r -d '' file; do
      rel="${file#"$src"/}"
      rel_dir="$(dirname "$rel")"
      target_folder_id="$(ensure_rel_path "$API_HOST" "$AUTH" "$dest_folder_id" "$rel_dir")"

      if upload_file "$API_HOST" "$AUTH" "$target_folder_id" "$file"; then
        files_uploaded=$((files_uploaded + 1))
        echo "Uploaded: $rel"
      else
        source_failed=1
      fi
    done < <(find "$src" -type f -print0)
  fi

  if [[ "$source_failed" -eq 0 && "$DELETE_SOURCE" == true ]]; then
    echo "Deleting local source: $src"
    rm -rf "$src"
  elif [[ "$source_failed" -ne 0 ]]; then
    echo "Source had upload errors: $src"
    sources_failed=$((sources_failed + 1))
  fi
done

echo
if [[ "$sources_failed" -gt 0 ]]; then
  echo "Completed with errors. Sources failed: $sources_failed. Files uploaded: $files_uploaded"
  exit 3
fi

echo "Completed successfully. Files uploaded: $files_uploaded"
if [[ "$DELETE_SOURCE" == false ]]; then
  echo "Re-run with --delete-source only after you verify files in pCloud web UI."
fi
