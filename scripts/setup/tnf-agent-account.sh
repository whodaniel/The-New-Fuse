#!/usr/bin/env bash
#
# Create a dedicated OS account for TNF agents, so the operator's signing key
# stops being readable by the processes it governs.
#
# WHY THIS EXISTS
# ---------------
# Every authority guarantee in DIRECTIVES.md D23 rests on the operator's root
# key being out of reach of agents. Today agents run as the operator's own uid,
# so `chmod 0600` on that key is a convention, not a boundary — a same-uid
# process can simply read it. A Secure Enclave would fix this, but this
# workstation (MacBookPro12,1, 2015) has none.
#
# A separate uid fixes it with no hardware: the kernel, not an agreement,
# enforces the boundary.
#
# WHAT IT DOES NOT DO
# -------------------
# Creating the account is only half. The boundary is real ONLY IF agents are
# actually launched as this user — see "AFTER RUNNING" below. tnf-trust-root.cjs
# can verify the account exists and the key permissions are right; it CANNOT
# verify that every launchd job and shell actually runs as that user. That part
# is on you, and it is the part that matters.
#
# USAGE
#   sudo bash scripts/setup/tnf-agent-account.sh            # create
#   sudo bash scripts/setup/tnf-agent-account.sh --check    # report only
#   sudo bash scripts/setup/tnf-agent-account.sh --remove   # undo
#
set -euo pipefail

AGENT_USER="${TNF_AGENT_USER:-tnf-agent}"
AGENT_GROUP="${TNF_AGENT_GROUP:-tnf-agents}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OPERATOR_USER="${SUDO_USER:-$(whoami)}"
MODE="create"

for arg in "$@"; do
  case "$arg" in
    --check) MODE="check" ;;
    --remove) MODE="remove" ;;
    -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

log()  { printf '  %s\n' "$*"; }
ok()   { printf '  ✅ %s\n' "$*"; }
warn() { printf '  ⚠️  %s\n' "$*"; }

user_exists() { id -u "$1" >/dev/null 2>&1; }

# ---------------------------------------------------------------------------
# check
# ---------------------------------------------------------------------------
if [ "$MODE" = "check" ]; then
  echo "TNF agent account status"
  if user_exists "$AGENT_USER"; then
    ok "account '$AGENT_USER' exists (uid $(id -u "$AGENT_USER"))"
  else
    warn "account '$AGENT_USER' does not exist — trust root stays 'file' (no boundary)"
  fi
  KEY="$HOME/.tnf/authority/operator.ed25519"
  if [ -f "$KEY" ]; then
    PERM=$(stat -f '%Lp' "$KEY" 2>/dev/null || stat -c '%a' "$KEY" 2>/dev/null)
    [ "$PERM" = "600" ] && ok "operator key is 0600" || warn "operator key is $PERM, expected 600"
  else
    log "operator key not yet generated (created on first grant)"
  fi
  echo
  log "Remember: the boundary is only real if agents actually RUN as '$AGENT_USER'."
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must run with sudo (it creates a system account)." >&2
  echo "  sudo bash scripts/setup/tnf-agent-account.sh" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# remove
# ---------------------------------------------------------------------------
if [ "$MODE" = "remove" ]; then
  echo "Removing TNF agent account"
  if [ "$(uname)" = "Darwin" ]; then
    user_exists "$AGENT_USER" && dscl . -delete "/Users/$AGENT_USER" && ok "deleted $AGENT_USER" || log "no $AGENT_USER to delete"
    dscl . -read "/Groups/$AGENT_GROUP" >/dev/null 2>&1 && dscl . -delete "/Groups/$AGENT_GROUP" && ok "deleted group $AGENT_GROUP" || true
  else
    user_exists "$AGENT_USER" && userdel "$AGENT_USER" && ok "deleted $AGENT_USER" || log "no $AGENT_USER to delete"
    getent group "$AGENT_GROUP" >/dev/null 2>&1 && groupdel "$AGENT_GROUP" && ok "deleted group $AGENT_GROUP" || true
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------
echo "Creating TNF agent account"
log "agent user : $AGENT_USER"
log "shared group: $AGENT_GROUP"
log "operator    : $OPERATOR_USER"
log "repo        : $REPO_ROOT"
echo

if user_exists "$AGENT_USER"; then
  ok "account '$AGENT_USER' already exists — nothing to create"
else
  if [ "$(uname)" = "Darwin" ]; then
    # Pick a free uid/gid in the system range (<500 keeps it off the login window).
    NEXT_UID=$(( $(dscl . -list /Users UniqueID | awk '$2 < 500 {print $2}' | sort -n | tail -1) + 1 ))
    NEXT_GID=$(( $(dscl . -list /Groups PrimaryGroupID | awk '$2 < 500 {print $2}' | sort -n | tail -1) + 1 ))

    dscl . -create "/Groups/$AGENT_GROUP"
    dscl . -create "/Groups/$AGENT_GROUP" PrimaryGroupID "$NEXT_GID"
    ok "created group $AGENT_GROUP (gid $NEXT_GID)"

    dscl . -create "/Users/$AGENT_USER"
    dscl . -create "/Users/$AGENT_USER" UserShell /usr/bin/false
    dscl . -create "/Users/$AGENT_USER" RealName "TNF Agent Runtime"
    dscl . -create "/Users/$AGENT_USER" UniqueID "$NEXT_UID"
    dscl . -create "/Users/$AGENT_USER" PrimaryGroupID "$NEXT_GID"
    dscl . -create "/Users/$AGENT_USER" NFSHomeDirectory "/var/empty"
    # No password entry at all: this account cannot be logged into.
    dscl . -create "/Users/$AGENT_USER" IsHidden 1
    ok "created $AGENT_USER (uid $NEXT_UID, no login shell, no password)"

    dseditgroup -o edit -a "$OPERATOR_USER" -t user "$AGENT_GROUP" 2>/dev/null || true
    ok "added $OPERATOR_USER to $AGENT_GROUP"
  else
    groupadd -f "$AGENT_GROUP"
    useradd -r -g "$AGENT_GROUP" -s /usr/sbin/nologin -d /nonexistent "$AGENT_USER"
    usermod -aG "$AGENT_GROUP" "$OPERATOR_USER" || true
    ok "created $AGENT_USER (system account, nologin)"
  fi
fi

# Repo access: agents need to read/write the working tree, so the tree is
# group-shared. The authority directory deliberately is NOT.
echo
log "Granting $AGENT_GROUP access to the repo working tree..."
chgrp -R "$AGENT_GROUP" "$REPO_ROOT" 2>/dev/null || warn "could not chgrp the whole tree (partial is fine)"
chmod -R g+rwX "$REPO_ROOT" 2>/dev/null || true
ok "repo is group-accessible to $AGENT_GROUP"

# The point of the whole exercise: the authority dir stays operator-only.
AUTH_DIR="/Users/$OPERATOR_USER/.tnf/authority"
[ "$(uname)" != "Darwin" ] && AUTH_DIR="/home/$OPERATOR_USER/.tnf/authority"
if [ -d "$AUTH_DIR" ]; then
  chmod 700 "$AUTH_DIR"
  chown -R "$OPERATOR_USER" "$AUTH_DIR"
  find "$AUTH_DIR" -name '*.ed25519' -exec chmod 600 {} \; 2>/dev/null || true
  ok "authority dir locked to $OPERATOR_USER only (0700)"
else
  log "authority dir not created yet — it will be 0700 on first use"
fi

cat <<EOF

────────────────────────────────────────────────────────────────────────
AFTER RUNNING — the part that actually creates the boundary
────────────────────────────────────────────────────────────────────────

The account alone changes nothing. Agents must RUN as it. Until they do,
tnf-trust-root.cjs will keep reporting the root as unenforced.

1. launchd jobs (macOS): add to each agent plist
       <key>UserName</key><string>$AGENT_USER</string>
   then: sudo launchctl unload/load the plist

2. systemd units (Linux): add under [Service]
       User=$AGENT_USER
       Group=$AGENT_GROUP

3. Ad-hoc shells:
       sudo -u $AGENT_USER <command>

4. Confirm the boundary — this runs the denial test and only then marks the
   trust root as a real boundary (it will NOT take your word for it):
       node scripts/tnf-authority.cjs confirm-isolation
   It runs \`sudo -u $AGENT_USER cat <operator key>\` and writes the isolation
   marker only if that read is actually denied. Until you run this AND it
   passes, the trust root stays DEGRADED even though the account exists — the
   account alone does not protect anything while agents still run as you.

5. Re-probe:
       node -e "require('./scripts/lib/tnf-trust-root.cjs').selectTrustRoot().then(s=>console.log(require('./scripts/lib/tnf-trust-root.cjs').describeSelection(s)))"

────────────────────────────────────────────────────────────────────────
EOF
