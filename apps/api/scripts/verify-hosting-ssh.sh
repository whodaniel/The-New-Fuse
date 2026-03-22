#!/usr/bin/env bash
set -euo pipefail

HOST="${HOSTING_SSH_HOST:-}"
USER_NAME="${HOSTING_SSH_USERNAME:-}"
KEY_PATH="${HOSTING_SSH_PRIVATE_KEY_PATH:-$HOME/.ssh/tnf_hostmaria_custodian}"
KNOWN_HOSTS_PATH="${HOSTING_SSH_KNOWN_HOSTS_PATH:-$HOME/.ssh/known_hosts}"
PORT="${HOSTING_SSH_PORT:-22}"
TIMEOUT_S="${HOSTING_SSH_CONNECT_TIMEOUT_S:-15}"
COMMAND="${1:-echo TNF_SSH_READY}"

if [[ -z "${HOST}" || -z "${USER_NAME}" ]]; then
  echo "status=error reason=missing_env required=HOSTING_SSH_HOST,HOSTING_SSH_USERNAME"
  exit 2
fi

if [[ ! -f "${KEY_PATH}" ]]; then
  echo "status=error reason=missing_key key_path=${KEY_PATH}"
  exit 2
fi

mkdir -p "$(dirname "${KNOWN_HOSTS_PATH}")"
touch "${KNOWN_HOSTS_PATH}"

if ! ssh-keygen -F "${HOST}" -f "${KNOWN_HOSTS_PATH}" >/dev/null 2>&1; then
  ssh-keyscan -H -p "${PORT}" "${HOST}" >>"${KNOWN_HOSTS_PATH}" 2>/dev/null || true
fi

OUT_FILE="$(mktemp)"
ERR_FILE="$(mktemp)"
trap 'rm -f "${OUT_FILE}" "${ERR_FILE}"' EXIT

SSH_ARGS=(
  -v
  -i "${KEY_PATH}"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=${KNOWN_HOSTS_PATH}"
  -o "ConnectTimeout=${TIMEOUT_S}"
  -p "${PORT}"
  "${USER_NAME}@${HOST}"
  "${COMMAND}"
)

set +e
ssh "${SSH_ARGS[@]}" >"${OUT_FILE}" 2>"${ERR_FILE}"
RC=$?
set -e

OUT="$(tr '\n' ' ' <"${OUT_FILE}" | sed 's/[[:space:]]\+/ /g' | sed 's/^ //; s/ $//')"

if [[ "${RC}" -eq 0 ]]; then
  echo "status=ready auth=publickey command_rc=0 output=\"${OUT}\""
  exit 0
fi

if grep -q "Authentication succeeded (publickey)." "${ERR_FILE}"; then
  echo "status=auth_ok_command_blocked auth=publickey command_rc=${RC} note=host_may_still_be_activating_or_shell_restricted"
  exit 0
fi

if grep -q "Permission denied (publickey" "${ERR_FILE}"; then
  echo "status=auth_failed auth=publickey command_rc=${RC}"
  exit 1
fi

echo "status=unknown_failure command_rc=${RC}"
exit 1
