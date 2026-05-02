#!/bin/bash
# Shared Voice Bridge path and migration helpers.

voicebridge_default_project_root() {
  local env_root="${VOICEBRIDGE_PROJECT_ROOT:-${THE_NEW_FUSE_HOME:-}}"
  if [[ -n "$env_root" && -d "$env_root" ]]; then
    printf '%s\n' "$env_root"
    return
  fi

  local cur="$PWD"
  while [[ "$cur" != "/" ]]; do
    if [[ "$(basename "$cur")" == "The-New-Fuse" && -d "$cur/apps" ]]; then
      printf '%s\n' "$cur"
      return
    fi
    cur="$(dirname "$cur")"
  done

  local candidate
  for candidate in \
    "$HOME/The-New-Fuse" \
    "$HOME/Desktop/The-New-Fuse" \
    "$HOME/Projects/The-New-Fuse"; do
    if [[ -d "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return
    fi
  done

  local glob_candidate
  local old_nullglob
  old_nullglob="$(shopt -p nullglob || true)"
  shopt -s nullglob
  for glob_candidate in \
    "$HOME"/Desktop/*/The-New-Fuse \
    "$HOME"/Projects/*/The-New-Fuse \
    "$HOME"/*/The-New-Fuse; do
    if [[ -d "$glob_candidate" ]]; then
      eval "$old_nullglob" 2>/dev/null || true
      printf '%s\n' "$glob_candidate"
      return
    fi
  done
  eval "$old_nullglob" 2>/dev/null || true

  printf '%s\n' "$HOME/.local/share/The-New-Fuse"
}

VOICEBRIDGE_PROJECT_ROOT="${VOICEBRIDGE_PROJECT_ROOT:-$(voicebridge_default_project_root)}"
VOICEBRIDGE_STATE_DIR="${VOICEBRIDGE_STATE_DIR:-$VOICEBRIDGE_PROJECT_ROOT/.voicebridge}"
VOICEBRIDGE_LEGACY_STATE_DIR="${VOICEBRIDGE_LEGACY_STATE_DIR:-$HOME/.openclaw}"
VOICEBRIDGE_PROFILE="${VOICEBRIDGE_PROFILE:-main}"

voicebridge_normalize_profile() {
  local raw="${1:-main}"
  raw="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]')"
  raw="${raw//[^a-z0-9_-]/_}"
  raw="${raw##_}"
  raw="${raw%%_}"
  if [[ -z "$raw" ]]; then
    raw="main"
  fi
  printf '%s\n' "$raw"
}

voicebridge_use_profile() {
  VOICEBRIDGE_PROFILE="$(voicebridge_normalize_profile "${1:-main}")"
  export VOICEBRIDGE_PROFILE
}

voicebridge_profile_suffix() {
  local p
  p="$(voicebridge_normalize_profile "$VOICEBRIDGE_PROFILE")"
  case "$p" in
    main|default|primary)
      printf '%s\n' ""
      ;;
    *)
      printf '_%s\n' "$p"
      ;;
  esac
}

voicebridge_state_file() {
  local name="${1:?missing state filename}"
  local suffix
  suffix="$(voicebridge_profile_suffix)"
  if [[ -z "$suffix" ]]; then
    printf '%s\n' "$VOICEBRIDGE_STATE_DIR/$name"
    return
  fi

  local stem ext
  if [[ "$name" == *.* ]]; then
    stem="${name%.*}"
    ext=".${name##*.}"
    printf '%s\n' "$VOICEBRIDGE_STATE_DIR/${stem}${suffix}${ext}"
  else
    printf '%s\n' "$VOICEBRIDGE_STATE_DIR/${name}${suffix}"
  fi
}

voicebridge_use_profile "$VOICEBRIDGE_PROFILE"

export VOICEBRIDGE_PROJECT_ROOT
export VOICEBRIDGE_STATE_DIR
export VOICEBRIDGE_LEGACY_STATE_DIR
export VOICEBRIDGE_PROFILE

voicebridge_migrate_legacy_state() {
  if [[ ! -d "$VOICEBRIDGE_LEGACY_STATE_DIR" ]]; then
    return 0
  fi

  local files=(
    voice_stream.txt
    voice_target.json
    voice_target_tty
    voice_mic_paused
    voice_response_audio_enabled
    voice_bridge_cloud.env
  )
  local file src dst
  for file in "${files[@]}"; do
    src="$VOICEBRIDGE_LEGACY_STATE_DIR/$file"
    dst="$VOICEBRIDGE_STATE_DIR/$file"
    if [[ -e "$src" && ! -e "$dst" ]]; then
      cp "$src" "$dst"
    fi
  done
}

voicebridge_init_state() {
  mkdir -p "$VOICEBRIDGE_STATE_DIR"
  voicebridge_migrate_legacy_state
}
