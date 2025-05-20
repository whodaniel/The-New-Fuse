#!/bin/bash

echo "======================================================"
echo " The New Fuse - VS Code Extension Integration Script  "
echo "======================================================"
echo ""

# Define source and destination directories
BETA_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode_extension_newest_ example"
DEV_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"
BACKUP_DIR="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension-backup-$(date +%Y%m%d%H%M%S)"

# Step 1: Create a backup of the current development directory
echo "Step 1: Creating backup of current development directory..."
mkdir -p "$BACKUP_DIR"
cp -R "$DEV_DIR/"* "$BACKUP_DIR/"
echo "✅ Backup created at: $BACKUP_DIR"

# Step 2: Copy the newly created/modified integration files
echo "Step 2: Ensuring integration files are present..."

# List of files we've created or modified for integration
FILES_TO_CHECK=(
    "roo-integration.tsx"
    "roo-output-monitor.tsx"
    "web-ui/ai-coder-view.tsx"
    "test-integrated-extension.sh"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$DEV_DIR/$file" ]; then
        echo "✅ $file is already present"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

# Step 3: Verify package.json has required entries
echo "Step 3: Verifying package.json integration..."
if grep -q "AI Coder Connector" "$DEV_DIR/package.json"; then
    echo "✅ package.json contains AI Coder integration"
else
    echo "❌ package.json is missing AI Coder integration"
    exit 1
fi

# Step 4: Check if any beta-specific files need to be copied
echo "Step 4: Checking for additional beta files to copy..."
BETA_SPECIFIC_DIR="$BETA_DIR/your-publisher-id.vscode-ai-coder-connector-1.0.0"

if [ -f "$BETA_SPECIFIC_DIR/test-roo-monitor.ts" ] && [ ! -f "$DEV_DIR/test-roo-monitor.ts" ]; then
    echo "Copying test-roo-monitor.ts..."
    cp "$BETA_SPECIFIC_DIR/test-roo-monitor.ts" "$DEV_DIR/"
fi

# Step 5: Update build script permissions
echo "Step 5: Updating script permissions..."
chmod +x "$DEV_DIR/build.sh"
chmod +x "$DEV_DIR/test-integrated-extension.sh"
if [ -f "$DEV_DIR/launch-vscode.sh" ]; then
    chmod +x "$DEV_DIR/launch-vscode.sh"
fi
echo "✅ Script permissions updated"

# Step 6: Run the extension build
echo "Step 6: Building the integrated extension..."
cd "$DEV_DIR" && ./build.sh

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi
echo "✅ Extension built successfully"

echo ""
echo "Integration complete! To test the integrated extension, run:"
echo "cd $DEV_DIR && ./test-integrated-extension.sh"
echo ""
echo "Alternatively, you can use the 'Launch VS Code with Extension' task."
echo "======================================================"