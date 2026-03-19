#!/usr/bin/env bash
set -euo pipefail

DEFAULT_REPO_URL="https://github.com/whodaniel/fuse.git"
DEFAULT_REF="main"
DEFAULT_INSTALL_ROOT="${HOME}/.tnf-cli"
DEFAULT_BIN_DIR="${HOME}/.local/bin"

FROM_LOCAL=false
REPO_URL="${DEFAULT_REPO_URL}"
REF="${DEFAULT_REF}"
INSTALL_ROOT="${DEFAULT_INSTALL_ROOT}"
BIN_DIR="${DEFAULT_BIN_DIR}"

usage() {
  cat <<'USAGE'
Install TNF CLI wrappers (`tnf`, `tnf-agent`) into your local PATH.

Usage:
  scripts/install-tnf-cli.sh [options]

Options:
  --from-local           Install from the current repository directory.
  --repo-url <url>       Git URL to clone/update (default: https://github.com/whodaniel/fuse.git)
  --ref <git-ref>        Git branch/tag/sha to install (default: main)
  --install-root <dir>   Clone/update root for remote install (default: ~/.tnf-cli)
  --bin-dir <dir>        Target bin directory for wrappers (default: ~/.local/bin)
  -h, --help             Show this help text.
USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command not found: $1" >&2
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-local)
      FROM_LOCAL=true
      shift
      ;;
    --repo-url)
      REPO_URL="$2"
      shift 2
      ;;
    --ref)
      REF="$2"
      shift 2
      ;;
    --install-root)
      INSTALL_ROOT="$2"
      shift 2
      ;;
    --bin-dir)
      BIN_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_cmd node
require_cmd pnpm

if [[ "${FROM_LOCAL}" == "false" ]]; then
  require_cmd git
fi

if [[ "${FROM_LOCAL}" == "true" ]]; then
  REPO_DIR="$(pwd)"
  if [[ ! -f "${REPO_DIR}/tnf" || ! -f "${REPO_DIR}/packages/tnf-cli/src/cli.ts" ]]; then
    echo "Error: --from-local must be run from the TNF repository root." >&2
    exit 1
  fi
else
  REPO_DIR="${INSTALL_ROOT}/fuse"
  mkdir -p "${INSTALL_ROOT}"
  if [[ -d "${REPO_DIR}/.git" ]]; then
    echo "Updating existing TNF clone at ${REPO_DIR}..."
    git -C "${REPO_DIR}" fetch --depth=1 origin "${REF}"
    git -C "${REPO_DIR}" checkout -q "${REF}"
    git -C "${REPO_DIR}" pull --ff-only origin "${REF}"
  else
    echo "Cloning TNF repository into ${REPO_DIR}..."
    git clone --depth=1 --branch "${REF}" "${REPO_URL}" "${REPO_DIR}"
  fi
fi

echo "Installing TNF CLI dependencies..."
if ! pnpm --dir "${REPO_DIR}" install --filter @the-new-fuse/tnf-cli... --frozen-lockfile; then
  pnpm --dir "${REPO_DIR}" install --filter @the-new-fuse/tnf-cli...
fi

echo "Building TNF CLI..."
pnpm --dir "${REPO_DIR}" --filter @the-new-fuse/tnf-cli run build

mkdir -p "${BIN_DIR}"
cat > "${BIN_DIR}/tnf" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec bash "${REPO_DIR}/tnf" "\$@"
EOF
chmod +x "${BIN_DIR}/tnf"
ln -sf "${BIN_DIR}/tnf" "${BIN_DIR}/tnf-agent"

echo
echo "Installed TNF CLI wrappers:"
echo "  ${BIN_DIR}/tnf"
echo "  ${BIN_DIR}/tnf-agent"
echo

if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
  echo "Add this to your shell profile to use \`tnf\` anywhere:"
  echo "  export PATH=\"${BIN_DIR}:\$PATH\""
  echo
fi

echo "Verification:"
"${BIN_DIR}/tnf" --version || true
