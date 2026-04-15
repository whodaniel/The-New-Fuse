#!/bin/bash

echo "===================================================="
echo "  The New Fuse - Permission Fixer"
echo "===================================================="
echo ""

# Make the setup script executable
if [ -f "setup-extension.sh" ]; then
  echo "Making setup-extension.sh executable..."
  chmod +x setup-extension.sh
  echo "✅ setup-extension.sh is now executable"
else
  echo "❌ setup-extension.sh not found in current directory"
  
  # Check if it's in another location
  if [ -f "src/vscode-extension/setup-extension.sh" ]; then
    echo "Found setup-extension.sh in src/vscode-extension/..."
    chmod +x src/vscode-extension/setup-extension.sh
    echo "✅ src/vscode-extension/setup-extension.sh is now executable"
  fi
fi

# Make sure all other shell scripts are executable as well
echo "Making all shell scripts executable..."
for script in $(find . -name "*.sh"); do
  echo "  - Making $script executable"
  chmod +x "$script"
done

echo ""
echo "All shell scripts should now be executable."
echo ""
echo "To run the setup script, use:"
echo "  ./setup-extension.sh"
echo ""
echo "If it's in the vscode-extension subdirectory, use:"
echo "  cd src/vscode-extension && ./setup-extension.sh"
echo ""
echo "===================================================="
