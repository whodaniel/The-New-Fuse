#!/usr/bin/env bash
# wrapper-process-lib.sh — wrapper runtime detection shared by
# scripts/start-agent-network.sh (#176).
#
# A PID "owns" a wrapper only when the wrapper script is the FINAL argv token
# of an interpreter/launcher process:
#
#   node <...> <wrapper>.cjs
#   sudo ... <node-path> <wrapper>.cjs          (tnf-agent drop)
#   bash launch-agent-wrapper.sh <wrapper>.cjs  (brief startup stage)
#
# Foreign tools that merely mention the filename in their command line —
# `tail -f <wrapper>`, editors, grep, this script itself — never satisfy the
# signature, so boot can no longer report a false "already running".
#
# Optional fast path: TNF_WRAPPER_PID_FILE holds "pid wrapper-name" pairs
# recorded by the launcher script; live recorded PIDs are checked first.

# shellcheck shell=bash

_is_ancestor_of_self() {
    local cursor="$1"
    local hops=0
    while [ -n "$cursor" ] && [ "$cursor" != "0" ] && [ "$cursor" != "1" ] && [ "$hops" -lt 25 ]; do
        [ "$cursor" = "$$" ] && return 0
        cursor="$(ps -p "$cursor" -o ppid= 2>/dev/null | tr -d ' ')"
        hops=$((hops + 1))
    done
    return 1
}

_process_owns_wrapper() {
    local pid=$1
    local script_name=$2

    [ "$pid" = "$$" ] && return 1
    _is_ancestor_of_self "$pid" && return 1

    local cmd
    cmd="$(ps -p "$pid" -o command= 2>/dev/null | xargs)" || return 1
    case "$cmd" in
        *"$script_name") ;;
        *) return 1 ;;
    esac
    case "$cmd" in
        *"launch-agent-wrapper.sh"*) return 0 ;;
        node\ *) return 0 ;;
        */node\ *) return 0 ;;
        sudo\ *node\ *) return 0 ;;
    esac
    return 1
}

is_wrapper_running() {
    local script_name=$1
    local recorded_pid recorded_name pid

    # Fast path: PIDs this script recorded for THIS wrapper (PID ownership).
    if [ -n "${TNF_WRAPPER_PID_FILE:-}" ] && [ -f "$TNF_WRAPPER_PID_FILE" ]; then
        while read -r recorded_pid recorded_name _rest; do
            [ "${recorded_name:-}" = "$script_name" ] || continue
            if kill -0 "$recorded_pid" 2>/dev/null && _process_owns_wrapper "$recorded_pid" "$script_name"; then
                return 0
            fi
        done < "$TNF_WRAPPER_PID_FILE"
    fi

    # Signature path: candidates via pgrep, verified by process signature so
    # arbitrary command-line mentions of the filename cannot false-positive.
    for pid in $(pgrep -f "$script_name" 2>/dev/null || true); do
        if _process_owns_wrapper "$pid" "$script_name"; then
            return 0
        fi
    done
    return 1
}

kill_wrapper_by_signature() {
    local script_name=$1
    local pid
    for pid in $(pgrep -f "$script_name" 2>/dev/null || true); do
        if _process_owns_wrapper "$pid" "$script_name"; then
            kill "$pid" 2>/dev/null || true
            echo "killed ${script_name} pid ${pid}"
        fi
    done
}
