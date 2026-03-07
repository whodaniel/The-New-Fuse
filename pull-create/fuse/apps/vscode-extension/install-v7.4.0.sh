#!/bin/bash

# The New Fuse v7.4.0 Installation Script
# Installs the VSCode extension and provides verification

set -e

echo "=========================================="
echo "The New Fuse v7.4.0 Installation"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VSIX_FILE="$SCRIPT_DIR/the-new-fuse-7.4.0.vsix"

echo "📦 Package Information:"
echo "   Location: $VSIX_FILE"
echo "   Version: 7.4.0"
echo "   Size: 5.61 MB"
echo ""

# Check if VSIX exists
if [ ! -f "$VSIX_FILE" ]; then
    echo -e "${RED}❌ Error: VSIX file not found at $VSIX_FILE${NC}"
    exit 1
fi

# Check if VSCode is installed
if ! command -v code &> /dev/null; then
    echo -e "${RED}❌ Error: VSCode CLI 'code' not found in PATH${NC}"
    echo "   Please install VSCode or add it to your PATH"
    exit 1
fi

echo -e "${GREEN}✅ Pre-flight checks passed${NC}"
echo ""

# Uninstall previous version if exists
echo "🔄 Checking for previous versions..."
if code --list-extensions | grep -q "thenewfuse.the-new-fuse"; then
    echo "   Found previous version, uninstalling..."
    code --uninstall-extension thenewfuse.the-new-fuse
    echo -e "${GREEN}   ✅ Previous version uninstalled${NC}"
else
    echo "   No previous version found"
fi
echo ""

# Install new version
echo "📥 Installing The New Fuse v7.4.0..."
code --install-extension "$VSIX_FILE"
echo ""

# Verify installation
echo "🔍 Verifying installation..."
if code --list-extensions | grep -q "thenewfuse.the-new-fuse"; then
    echo -e "${GREEN}✅ Installation verified!${NC}"
else
    echo -e "${RED}❌ Installation failed - extension not found${NC}"
    exit 1
fi
echo ""

# Calculate checksum
echo "🔐 Package Checksum:"
md5 "$VSIX_FILE"
echo ""

# Display next steps
echo "=========================================="
echo "✅ Installation Complete!"
echo "=========================================="
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Reload VSCode Window:"
echo "   Cmd+Shift+P → 'Reload Window'"
echo ""
echo "2. Open The New Fuse:"
echo "   Click the TNF icon in the sidebar"
echo ""
echo "3. Access MCP Configuration:"
echo "   Click the shopping cart icon 🛒"
echo ""
echo "4. Read Documentation:"
echo "   • MCP_CONFIGURATION_GUIDE.md (comprehensive)"
echo "   • MCP_QUICK_REFERENCE.md (quick start)"
echo "   • V7.4.0_RELEASE_NOTES.md (what's new)"
echo "   • INSTALLATION_TESTING_v7.4.0.md (testing)"
echo ""
echo "=========================================="
echo "🎉 Welcome to The New Fuse v7.4.0!"
echo "=========================================="
echo ""
echo "New Features:"
echo "  • Rich MCP configuration menus"
echo "  • Multi-tenant user preferences"
echo "  • Per-agent MCP setup"
echo "  • Workflow integration"
echo "  • Server discovery and browsing"
echo "  • Custom server support"
echo ""
echo "For issues or questions:"
echo "  GitHub: https://github.com/the-new-fuse/vscode-extension"
echo ""
