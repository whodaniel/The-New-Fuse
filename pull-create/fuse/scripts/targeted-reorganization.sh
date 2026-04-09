#!/bin/bash
set -e

echo "🎯 Starting Targeted Component Reorganization"

# Function to safely move files
safe_move() {
    local src=$1
    local dest=$2
    
    if [ ! -d "$src" ]; then
        echo "⚠️  Source directory not found: $src"
        return
    fi
    
    if [ -d "$dest" ]; then
        echo "📦 Merging contents of $src into existing directory $dest"
        cp -r "$src"/* "$dest"/ 2>/dev/null || true
        rm -rf "$src"
    else
        echo "📦 Moving $src to $dest"
        mv "$src" "$dest"
    fi
}

# Create backup first
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="./backups/components_${timestamp}"
mkdir -p "$backup_dir"
cp -r ./apps/frontend/src/components "$backup_dir/"

# Create rollback script
cat > "$backup_dir/rollback.sh" << EOL
#!/bin/bash
set -e
echo "🔄 Rolling back to backup from ${timestamp}..."
rm -rf ./apps/frontend/src/components
cp -r ${backup_dir}/components ./apps/frontend/src/
echo "✅ Rollback complete!"
EOL
chmod +x "$backup_dir/rollback.sh"
echo "📝 Created rollback script at $backup_dir/rollback.sh"

# 1. Core UI Components
echo "📦 Setting up core UI components..."
mkdir -p packages/ui-components/src/core
mkdir -p packages/ui-components/src/layout

# Move core UI components
safe_move "./apps/frontend/src/components/core" "packages/ui-components/src/core"
safe_move "./apps/frontend/src/components/layout" "packages/ui-components/src/layout"

# 2. AI Feature Components
echo "🤖 Organizing AI components..."
mkdir -p packages/features/ai/{llm,embedding,vectordb}/components
safe_move "./apps/frontend/src/components/LLMSelection" "packages/features/ai/llm/components"
safe_move "./apps/frontend/src/components/EmbeddingSelection" "packages/features/ai/embedding/components"

# 3. Workspace & Collaboration Features
echo "👥 Setting up workspace components..."
mkdir -p packages/features/{workspace,collaboration}/components
safe_move "./apps/frontend/src/components/workspace" "packages/features/workspace/components"
safe_move "./apps/frontend/src/components/collaboration" "packages/features/collaboration/components"

# 4. Chat & Messaging Features
echo "💬 Organizing chat components..."
mkdir -p packages/features/chat/components
safe_move "./apps/frontend/src/components/ChatInterface" "packages/features/chat/components"
safe_move "./apps/frontend/src/components/ChatBubble" "packages/features/chat/components"
safe_move "./apps/frontend/src/components/MessageReactions" "packages/features/chat/components"

# 5. Authentication Components
echo "🔐 Setting up auth components..."
mkdir -p packages/features/auth/components
safe_move "./apps/frontend/src/components/auth" "packages/features/auth/components"

# 6. Analytics & Visualization
echo "📊 Organizing analytics components..."
mkdir -p packages/features/analytics/{components,visualization}
safe_move "./apps/frontend/src/components/AnalyticsDashboard" "packages/features/analytics/components"
safe_move "./apps/frontend/src/components/visualization" "packages/features/analytics/visualization"

# 7. Shared Components
echo "🔄 Setting up shared components..."
mkdir -p packages/shared/{components,providers}
safe_move "./apps/frontend/src/components/Preloader" "packages/shared/components"
safe_move "./apps/frontend/src/components/providers" "packages/shared/providers"

# Create index files
echo "📝 Creating index files..."
find packages -type d -name "components" -exec sh -c 'echo "export * from \"./\";" > "$0/index.ts"' {}/index.ts \;

echo "✅ Targeted reorganization complete!"
echo "
📂 New Structure:
packages/
├── ui-components/        # Core UI components
├── features/
│   ├── ai/              # LLM, Embedding, VectorDB components
│   ├── workspace/       # Workspace management
│   ├── collaboration/   # Collaboration features
│   ├── chat/           # Chat interface components
│   ├── auth/           # Authentication components
│   └── analytics/      # Analytics & visualization
└── shared/             # Shared components & providers

Next steps:
1. Update import statements
2. Run tests
3. Update documentation
4. Verify build process

💾 Backup created at: $backup_dir
🔄 Rollback script: $backup_dir/rollback.sh"
