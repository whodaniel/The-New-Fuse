#!/usr/bin/env bash
# harness-context-env.sh — read endpoint authority from the generated
# adaptive harness context without re-implementing resolution (#176).
#
# Authority: scripts/runtime/resolve-harness-context.cjs writes
#   .agent/runtime-state/harness-context.env  (sourceable, single-quoted values)
# Consumers source this file and call `harness_ctx_get KEY [fallback]`.
# Explicit environment still wins: callers should prefer
#   value="${!KEY:-$(harness_ctx_get KEY fallback)}"
# when they want caller-provided env to override the context file.
#
# Usage:
#   # shellcheck disable=SC1091
#   . "$(dirname "${BASH_SOURCE[0]}")/harness-context-env.sh"
#   api="$(harness_ctx_get TNF_API_BASE https://api.thenewfuse.com)"

# shellcheck shell=bash

harness_ctx_env_file() {
    if [ -n "${TNF_HARNESS_CONTEXT_ENV:-}" ] && [ -f "${TNF_HARNESS_CONTEXT_ENV}" ]; then
        printf '%s' "${TNF_HARNESS_CONTEXT_ENV}"
        return 0
    fi
    local root="${TNF_REPO_ROOT:-}"
    if [ -z "$root" ]; then
        root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    fi
    printf '%s' "$root/.agent/runtime-state/harness-context.env"
}

harness_ctx_get() {
    local key="$1"
    local fallback="${2:-}"
    local env_file line value
    env_file="$(harness_ctx_env_file)"
    if [ -f "$env_file" ]; then
        # Lines look like: export KEY='value'
        line="$(grep -E "^export ${key}=" "$env_file" | tail -n 1 || true)"
        if [ -n "$line" ]; then
            value="${line#*${key}=}"
            # Strip surrounding single quotes added by the resolver.
            case "$value" in
                \'*\') value="${value#\'}"; value="${value%\'}" ;;
            esac
            if [ -n "$value" ]; then
                printf '%s' "$value"
                return 0
            fi
        fi
    fi
    printf '%s' "$fallback"
}
