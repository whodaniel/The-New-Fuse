#!/bin/bash
# TNF Brain Survival Utility (Librarian Tool)
# Automates Merkle Hashing, Git Snapshots, and Deep Vaulting

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
KB_DIR="${TNF_KB_DIR:-$HOME/my-ai-knowledge-base}"
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%SZ)

echo "🧠 TNF BRAIN SYNC STARTing..."

# 1. Update Merkle Tree
python3 "$PROJECT_ROOT/scripts/autonomy/generate_merkle_tree.py"
ROOT_HASH=$(cat "$PROJECT_ROOT/KNOWLEDGE_TREE.json" | grep '"root":' | cut -d'"' -f4)

if [ -z "$ROOT_HASH" ]; then
    echo "❌ ERROR: Failed to extract Merkle Root Hash. Aborting sync."
    exit 1
fi

echo "✅ Merkle Root: $ROOT_HASH"

# 2. Vectorize Intelligence (pgvector)
echo "🧬 Vectorizing Intelligence Artifacts..."
python3 "$PROJECT_ROOT/scripts/autonomy/vectorize_intelligence.py"
echo "✅ Vectorization Complete."

# 2b. Refresh Dashboard
echo "📊 Refreshing Intelligence Dashboard..."
python3 "$PROJECT_ROOT/scripts/autonomy/generate_dashboard.py"
echo "✅ Dashboard Updated."

# 3. Git Commit (Living State)
echo "📦 Committing Living State..."
cd "$PROJECT_ROOT"
git add "$PROJECT_ROOT/KNOWLEDGE_TREE.json"
git add "$PROJECT_ROOT/docs/protocols/*.md"
git add "$PROJECT_ROOT/TNF_INTELLIGENCE_DASHBOARD.html"

cd "$KB_DIR"
git add "AI_Knowledge_Base.md"
git add "video-library/ai_video_library.html"

# Combined Commit
cd "$PROJECT_ROOT"
git commit -m "Brain Sync [$TIMESTAMP]: Hash $ROOT_HASH" || echo "No changes to commit."

# 3. Deep Snapshot Vaulting (The Big Red Button)
TMP_DIR=$(mktemp -d)
SNAPSHOT_NAME="brain-snapshot-$TIMESTAMP-$ROOT_HASH.tar.gz"
echo "🔐 Creating Deep Snapshot in temporary directory..."

# Archive core intelligence and protocols to TMP_DIR
tar -czf "$TMP_DIR/$SNAPSHOT_NAME" \
    -C "$PROJECT_ROOT" docs/protocols \
    -C "$PROJECT_ROOT" KNOWLEDGE_TREE.json \
    -C "$KB_DIR" AI_Knowledge_Base.md

echo "✅ Temporary snapshot created: $TMP_DIR/$SNAPSHOT_NAME"

# 4. GitHub Release (Remote Redundancy)
echo "☁️  Uploading to GitHub Release..."
cd "$PROJECT_ROOT"
RELEASE_TAG="brain-vault-$TIMESTAMP"
gh release create "$RELEASE_TAG" "$TMP_DIR/$SNAPSHOT_NAME" \
    --title "TNF Brain Snapshot: $TIMESTAMP" \
    --notes "Automated archival backup. Merkle Root: $ROOT_HASH"

echo "✅ Remote backup complete: https://github.com/whodaniel/fuse/releases/tag/$RELEASE_TAG"

# 5. Local Cleanup
echo "🧹 Cleaning up temporary files..."
rm -rf "$TMP_DIR"
echo "✅ Local disk cleared."

# 6. Final Report
echo "---"
echo "🏁 TNF BRAIN SYNC COMPLETE"
echo "   Status: [STATUS:SYNCHRONIZED]"
echo "   Merkle Root: $ROOT_HASH"
echo "   Vault: GitHub Release ($RELEASE_TAG)"
echo "---"
