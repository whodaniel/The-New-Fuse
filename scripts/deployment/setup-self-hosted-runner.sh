#!/usr/bin/env bash
# TNF Self-Hosted GitHub Actions Runner Setup
# Enables free, unlimited CI/CD execution without consuming GitHub Actions paid minutes.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

RUNNER_VERSION="2.321.0"
RUNNER_DIR="${TNF_RUNNER_DIR:-$HOME/.tnf-actions-runner}"

echo "======================================================="
echo "  TNF Self-Hosted Runner Provisioning"
echo "  Eliminates GitHub Actions compute billing / minute limits"
echo "======================================================="

# 1. Detect OS and Architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    RUNNER_OS="osx"
    ;;
  Linux)
    RUNNER_OS="linux"
    ;;
  *)
    echo "❌ Unsupported OS: $OS. Please use macOS or Linux."
    exit 1
    ;;
esac

case "$ARCH" in
  arm64|aarch64)
    RUNNER_ARCH="arm64"
    ;;
  x86_64|amd64)
    RUNNER_ARCH="x64"
    ;;
  *)
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

RUNNER_TAR="actions-runner-${RUNNER_OS}-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
DOWNLOAD_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_TAR}"

# 2. Determine Repository
REPO_NAME=""
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
fi

if [ -z "$REPO_NAME" ]; then
  REMOTE_URL=$(git config --get remote.origin.url || true)
  if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+/[^/.]+)(\.git)?$ ]]; then
    REPO_NAME="${BASH_REMATCH[1]}"
  else
    REPO_NAME="whodaniel/tnf-monorepo"
  fi
fi

echo "📍 Target Repository: $REPO_NAME"
echo "🖥️  Platform: $RUNNER_OS ($RUNNER_ARCH)"
echo "📂 Runner Directory: $RUNNER_DIR"

# 3. Obtain Registration Token
REG_TOKEN=""
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  echo "🔑 Fetching runner registration token via GitHub CLI..."
  REG_TOKEN=$(gh api --method POST "repos/$REPO_NAME/actions/runners/registration-token" -q .token 2>/dev/null || true)
fi

if [ -z "$REG_TOKEN" ]; then
  echo ""
  echo "⚠️  Could not automatically generate a registration token with 'gh'."
  echo "   Please visit: https://github.com/$REPO_NAME/settings/actions/runners/new"
  read -rp "Enter the Runner Registration Token: " REG_TOKEN
fi

if [ -z "$REG_TOKEN" ]; then
  echo "❌ No registration token provided. Aborting."
  exit 1
fi

# 4. Download and Extract Runner
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f "config.sh" ]; then
  echo "📥 Downloading GitHub Actions Runner v${RUNNER_VERSION}..."
  curl -fsSL -o "$RUNNER_TAR" "$DOWNLOAD_URL"
  echo "📦 Extracting runner..."
  tar -xzf "$RUNNER_TAR"
  rm -f "$RUNNER_TAR"
fi

# 5. Configure Runner
RUNNER_NAME="tnf-runner-$(hostname -s 2>/dev/null || echo 'host')"
LABELS="self-hosted,${RUNNER_OS},${RUNNER_ARCH},tnf"

echo "⚙️  Configuring runner '$RUNNER_NAME' with labels: $LABELS..."
./config.sh \
  --url "https://github.com/$REPO_NAME" \
  --token "$REG_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$LABELS" \
  --unattended \
  --replace

echo ""
echo "======================================================="
echo "✅ Runner successfully configured!"
echo "======================================================="
echo ""
echo "To start the runner in the foreground right now:"
echo "  cd $RUNNER_DIR && ./run.sh"
echo ""
echo "To install the runner as a background system service:"
if [ "$RUNNER_OS" = "osx" ]; then
  echo "  cd $RUNNER_DIR && ./svc.sh install && ./svc.sh start"
else
  echo "  sudo cd $RUNNER_DIR && sudo ./svc.sh install && sudo ./svc.sh start"
fi
echo ""
