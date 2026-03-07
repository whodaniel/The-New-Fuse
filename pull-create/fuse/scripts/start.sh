#!/bin/bash

# Navigate to the VS Code extension directory
cd src/vscode-extension

# Check if the minimal launch script exists, create if not
if [ ! -f "minimal-launch.sh" ]; then
  cat > minimal-launch.sh << 'EOF'
#!/bin/bash

echo "===================================================="
echo "  The New Fuse - Minimal Launch Script"
echo "===================================================="
echo ""

# Create necessary directories
mkdir -p out
mkdir -p ai-communication

# Launch VS Code with the extension
echo "Launching VS Code with the extension..."
code --extensionDevelopmentPath="$(pwd)"

echo ""
echo "The New Fuse should now be running in VS Code."
echo "Look for the rocket icon ($(rocket)) in the status bar."
echo ""
EOF
  chmod +x minimal-launch.sh
fi

# Run the minimal launch script
./minimal-launch.sh
