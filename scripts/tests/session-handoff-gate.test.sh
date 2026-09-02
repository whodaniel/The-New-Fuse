#!/bin/bash
set -e
echo "Running Hermetic Adversarial Tests for Session Handoff Gate"

# Save absolute paths
REPO_ROOT=$(pwd)
GATE="$REPO_ROOT/scripts/protocols/enforce-session-handoff.cjs"
SCHEMA_JSON="$REPO_ROOT/docs/protocols/schemas/tnf-session-handoff.schema.json"
TEMPLATE_JSON="$REPO_ROOT/docs/protocols/reports/SESSION_HANDOFF_LATEST.json"
NODE_BIN=$(command -v node)

# Setup temp repo
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

git init --initial-branch=main >/dev/null 2>&1
git config user.name "Test Bot"
git config user.email "test@thenewfuse.com"
git remote add origin https://github.com/whodaniel/tnf-monorepo.git
git commit --allow-empty -m "Initial commit" >/dev/null 2>&1

mkdir -p scripts/protocols docs/protocols/reports docs/protocols/schemas data/protocols
# The script enforce-session-handoff.cjs requires the schema to exist relative to its execution directory
# or relative to process.cwd() since we run it in the temp dir.
cp "$SCHEMA_JSON" docs/protocols/schemas/
cp "$TEMPLATE_JSON" docs/protocols/reports/SESSION_HANDOFF_LATEST.json

function run_gate() {
  "$NODE_BIN" "$GATE" --mode=staged >/dev/null 2>&1
}

function make_valid_json() {
  local file=$1
  local paths=$2
  local created=${3:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}
  local overrides=${4:-"{}"}
  
  "$NODE_BIN" -e "
    const fs = require('fs');
    const dir = require('path').dirname('$file');
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
    const h = JSON.parse(fs.readFileSync('$TEMPLATE_JSON', 'utf8'));
    h.handoff_id = require('crypto').randomUUID();
    h.created_at = '$created';
    h.changed_paths = $paths;
    
    let activeBranch;
    try { activeBranch = require('child_process').execSync('git symbolic-ref --short HEAD').toString().trim(); } catch {}
    h.branch = activeBranch || 'main';
    
    let activeSha;
    try { activeSha = require('child_process').execSync('git rev-parse HEAD').toString().trim(); } catch {}
    h.head_sha = activeSha || '0000000000000000000000000000000000000000';
    
    h.repository_context = h.repository_context || {};
    h.repository_context.actual = require('path').basename(process.cwd());
    
    const overrides = $overrides;
    for (const [k, v] of Object.entries(overrides)) {
      if (typeof v === 'object' && v !== null && h[k]) {
        Object.assign(h[k], v);
      } else {
        h[k] = v;
      }
    }
    
    fs.writeFileSync('$file', JSON.stringify(h, null, 2));
  "
}

echo "Test 1 - critical mutation without receipt"
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
git add scripts/dummy-critical.js
if run_gate; then
  echo "❌ Failed: Should have blocked!"
  exit 1
else
  echo "✅ Passed: Blocked correctly"
fi
git reset HEAD scripts/dummy-critical.js

echo "Test 2 - critical mutation with valid scoped receipt"
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_TEST1.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.json', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_TEST1.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_TEST1.*
if run_gate; then
  echo "✅ Passed: Allowed correctly"
else
  echo "❌ Failed: Should have allowed!"
  "$NODE_BIN" "$GATE" --mode=staged
  exit 1
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 3 - wrong branch"
git checkout -b feature-a >/dev/null 2>&1
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_TEST1.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.json', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.md']" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "{ branch: 'main' }"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_TEST1.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_TEST1.*
if run_gate; then
  echo "❌ Failed: Should have blocked due to wrong branch!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (wrong branch)"
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 4 - wrong repository"
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_TEST1.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.json', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.md']" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "{ repository: 'whodaniel/wrong-repo' }"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_TEST1.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_TEST1.*
if run_gate; then
  echo "❌ Failed: Should have blocked due to wrong repository!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (wrong repository)"
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 5 - wrong basis HEAD"
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_TEST1.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.json', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.md']" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "{ head_sha: '0000000000000000000000000000000000000000' }"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_TEST1.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_TEST1.*
if run_gate; then
  echo "❌ Failed: Should have blocked due to wrong basis HEAD!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (wrong basis HEAD)"
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 6 - stale receipt (refreshed created_at only but wrong basis)"
git checkout main >/dev/null 2>&1
echo "// test A" > scripts/dummy-critical.js
git add scripts/dummy-critical.js
git commit -m "commit A" >/dev/null 2>&1
git checkout -b feature-b HEAD~1 >/dev/null 2>&1
# We are now on a different branch, but the receipt was generated on 'main' basis
make_valid_json docs/protocols/reports/SESSION_HANDOFF_TEST1.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.json', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.md']"
# Manually tamper with branch to match active, but basis HEAD is wrong
"$NODE_BIN" -e "const fs=require('fs');const h=JSON.parse(fs.readFileSync('docs/protocols/reports/SESSION_HANDOFF_TEST1.json'));h.head_sha=require('child_process').execSync('git rev-parse main').toString().trim();fs.writeFileSync('docs/protocols/reports/SESSION_HANDOFF_TEST1.json',JSON.stringify(h));"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_TEST1.md
TNF_PROTOCOL_ACK
Next Actions
MD
echo "// test B" > scripts/dummy-critical.js
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_TEST1.*
if run_gate; then
  echo "❌ Failed: Should have blocked due to stale receipt reused!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (stale basis on reused receipt)"
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 7 - missing path coverage"
git checkout main >/dev/null 2>&1
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_TEST1.json "['docs/protocols/reports/SESSION_HANDOFF_TEST1.json', 'docs/protocols/reports/SESSION_HANDOFF_TEST1.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_TEST1.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_TEST1.*
if run_gate; then
  echo "❌ Failed: Should have blocked due to missing coverage!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (coverage)"
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 8 - concurrent independent lanes (A + B receipt mismatch)"
git checkout -b lane-a >/dev/null 2>&1
echo "// test A" > scripts/dummy-critical-a.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_A.json "['scripts/dummy-critical-a.js', 'docs/protocols/reports/SESSION_HANDOFF_A.json', 'docs/protocols/reports/SESSION_HANDOFF_A.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_A.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical-a.js docs/protocols/reports/SESSION_HANDOFF_A.*
if run_gate; then
  echo "✅ Passed: Lane A isolates correctly"
else
  echo "❌ Failed: Lane A should have passed!"
  exit 1
fi
git reset HEAD --hard >/dev/null 2>&1
git checkout main >/dev/null 2>&1
git checkout -b lane-b >/dev/null 2>&1
echo "// test B" > scripts/dummy-critical-b.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_B.json "['scripts/dummy-critical-b.js', 'docs/protocols/reports/SESSION_HANDOFF_B.json', 'docs/protocols/reports/SESSION_HANDOFF_B.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_B.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical-b.js docs/protocols/reports/SESSION_HANDOFF_B.*
if run_gate; then
  echo "✅ Passed: Lane B isolates correctly"
else
  echo "❌ Failed: Lane B should have passed!"
  exit 1
fi

echo "Now cross them: change A + receipt B"
git checkout lane-a >/dev/null 2>&1
git reset HEAD --hard >/dev/null 2>&1
echo "// test A" > scripts/dummy-critical-a.js
# Receipt B is left over from Lane B but we change branch to lane-a logic
make_valid_json docs/protocols/reports/SESSION_HANDOFF_B.json "['scripts/dummy-critical-a.js', 'docs/protocols/reports/SESSION_HANDOFF_B.json', 'docs/protocols/reports/SESSION_HANDOFF_B.md']" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "{ branch: 'lane-b' }"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_B.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical-a.js docs/protocols/reports/SESSION_HANDOFF_B.*
if run_gate; then
  echo "❌ Failed: Should have blocked crossed receipt!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (crossed receipt)"
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 9 - global LATEST retains semantics"
git checkout main >/dev/null 2>&1
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_LATEST.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json', 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_LATEST.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_LATEST.*
if run_gate; then
  echo "❌ Failed: Should have blocked because AGENT_STATUS_LEDGER.md is missing!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (LATEST requires LEDGER)"
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 10 - legitimate global handoff workflow"
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_LATEST.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json', 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md', 'docs/protocols/AGENT_STATUS_LEDGER.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_LATEST.md
TNF_PROTOCOL_ACK
Next Actions
MD
echo "update" > docs/protocols/AGENT_STATUS_LEDGER.md
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_LATEST.* docs/protocols/AGENT_STATUS_LEDGER.md
if run_gate; then
  echo "✅ Passed: Allowed legitimate global handoff"
else
  echo "❌ Failed: Should have allowed legitimate workflow!"
  "$NODE_BIN" "$GATE" --mode=staged
  exit 1
fi
git reset HEAD --hard >/dev/null 2>&1



echo "Test 11 - repository spoofing (renamed valid clone)"
cd "$REPO_ROOT"
SPOOF_DIR=$(mktemp -d)/renamed-repo
git clone "$TEMP_DIR" "$SPOOF_DIR" >/dev/null 2>&1
cd "$SPOOF_DIR"
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/whodaniel/tnf-monorepo.git
rm -rf .git/hooks
mkdir -p scripts/protocols docs/protocols/reports docs/protocols/schemas data/protocols
cp "$SCHEMA_JSON" docs/protocols/schemas/
echo "// spoof test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_SPOOF.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_SPOOF.json', 'docs/protocols/reports/SESSION_HANDOFF_SPOOF.md']" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "{ branch: 'main' }"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_SPOOF.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_SPOOF.*
if run_gate; then
  echo "✅ Passed: Allowed correctly (renamed clone has same origin)"
else
  echo "❌ Failed: Should have passed! (Origin matches)"
  exit 1
fi
cd "$TEMP_DIR"

echo "Test 12 - repository spoofing (fake same-name directory)"
FAKE_DIR=$(mktemp -d)/tnf-monorepo
mkdir -p "$FAKE_DIR"
cd "$FAKE_DIR"
git init --initial-branch=main >/dev/null 2>&1
git remote add origin https://github.com/evil/tnf-monorepo.git
git config user.name "Test Bot"
git config user.email "test@thenewfuse.com"
git commit --allow-empty -m "Initial commit" >/dev/null 2>&1
mkdir -p scripts/protocols docs/protocols/reports docs/protocols/schemas data/protocols
cp "$SCHEMA_JSON" docs/protocols/schemas/
echo "// fake" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_FAKE.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_FAKE.json', 'docs/protocols/reports/SESSION_HANDOFF_FAKE.md']" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "{ branch: 'main' }"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_FAKE.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_FAKE.*
if "$NODE_BIN" "$GATE" --mode=staged 2>/dev/null; then
  echo "❌ Failed: Should have blocked fake directory with wrong origin!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (fake directory)"
fi
cd "$TEMP_DIR"

echo "Test 13 - repository spoofing (wrong origin in valid-looking repo)"
cd "$REPO_ROOT"
WRONG_ORIGIN_DIR=$(mktemp -d)/tnf-monorepo
git clone "$TEMP_DIR" "$WRONG_ORIGIN_DIR" >/dev/null 2>&1
cd "$WRONG_ORIGIN_DIR"
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/wrong/tnf-monorepo.git
rm -rf .git/hooks
mkdir -p scripts/protocols docs/protocols/reports docs/protocols/schemas data/protocols
cp "$SCHEMA_JSON" docs/protocols/schemas/
echo "// spoof test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_WRONG.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_WRONG.json', 'docs/protocols/reports/SESSION_HANDOFF_WRONG.md']" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "{ branch: 'main' }"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_WRONG.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_WRONG.*
if "$NODE_BIN" "$GATE" --mode=staged 2>/dev/null; then
  echo "❌ Failed: Should have blocked valid-looking directory with wrong origin!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (wrong origin)"
fi
cd "$TEMP_DIR"

echo "Test 14 - detached HEAD mode (CI fallback)"
cd "$REPO_ROOT"
DETACHED_DIR=$(mktemp -d)/tnf-detached
git clone "$TEMP_DIR" "$DETACHED_DIR" >/dev/null 2>&1
cd "$DETACHED_DIR"
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/whodaniel/tnf-monorepo.git
rm -rf .git/hooks
mkdir -p scripts/protocols docs/protocols/reports docs/protocols/schemas data/protocols
cp "$SCHEMA_JSON" docs/protocols/schemas/
git checkout main >/dev/null 2>&1
git checkout HEAD^0 >/dev/null 2>&1
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_DETACHED.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_DETACHED.json', 'docs/protocols/reports/SESSION_HANDOFF_DETACHED.md']" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "{ branch: 'main' }"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_DETACHED.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_DETACHED.*
git commit -m "Test commit"
# Pass CI environment variables
if GITHUB_HEAD_REF="main" "$NODE_BIN" "$GATE" --mode=ci >/dev/null 2>&1; then
  echo "✅ Passed: CI mode allowed correct branch from env vars"
else
  echo "❌ Failed: CI mode should have allowed correct branch!"
  exit 1
fi

if GITHUB_HEAD_REF="wrong" "$NODE_BIN" "$GATE" --mode=ci >/dev/null 2>&1; then
  echo "❌ Failed: CI mode should have blocked wrong branch!"
  exit 1
else
  echo "✅ Passed: CI mode blocked wrong branch"
fi
cd "$TEMP_DIR"

echo "Test 15 - per-agent receipt preferred over co-staged LATEST"
git checkout main >/dev/null 2>&1
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_AGENT1.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_AGENT1.json', 'docs/protocols/reports/SESSION_HANDOFF_AGENT1.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_AGENT1.md
TNF_PROTOCOL_ACK
Next Actions
MD
# Co-stage a global LATEST WITHOUT the status ledger. Under the old semantics
# this shape jammed every turn-end commit with "Multiple handoff JSON receipts
# found" (changedSet is lower-cased, so LATEST also matches the filter). The
# per-agent receipt must win and the co-staged LATEST must be ignored.
make_valid_json docs/protocols/reports/SESSION_HANDOFF_LATEST.json "['docs/protocols/reports/SESSION_HANDOFF_LATEST.json', 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_LATEST.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_AGENT1.* docs/protocols/reports/SESSION_HANDOFF_LATEST.*
if run_gate; then
  echo "✅ Passed: per-agent receipt preferred, co-staged LATEST ignored"
else
  echo "❌ Failed: should have allowed (per-agent receipt + co-staged LATEST)!"
  "$NODE_BIN" "$GATE" --mode=staged
  exit 1
fi
git reset HEAD --hard >/dev/null 2>&1

echo "Test 16 - two per-agent receipts remain ambiguous"
git commit --allow-empty -m "Second commit" >/dev/null 2>&1
echo "// test" > scripts/dummy-critical.js
make_valid_json docs/protocols/reports/SESSION_HANDOFF_AGENT1.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_AGENT1.json', 'docs/protocols/reports/SESSION_HANDOFF_AGENT1.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_AGENT1.md
TNF_PROTOCOL_ACK
Next Actions
MD
make_valid_json docs/protocols/reports/SESSION_HANDOFF_AGENT2.json "['scripts/dummy-critical.js', 'docs/protocols/reports/SESSION_HANDOFF_AGENT2.json', 'docs/protocols/reports/SESSION_HANDOFF_AGENT2.md']"
cat << 'MD' > docs/protocols/reports/SESSION_HANDOFF_AGENT2.md
TNF_PROTOCOL_ACK
Next Actions
MD
git add scripts/dummy-critical.js docs/protocols/reports/SESSION_HANDOFF_AGENT1.* docs/protocols/reports/SESSION_HANDOFF_AGENT2.*
if run_gate; then
  echo "❌ Failed: Should have blocked two per-agent receipts (genuine ambiguity)!"
  exit 1
else
  echo "✅ Passed: Blocked correctly (two per-agent receipts)"
fi
git reset HEAD --hard >/dev/null 2>&1

# Cleanup
cd "$REPO_ROOT"
rm -rf "$TEMP_DIR"

echo "✅ All tests completed successfully."
