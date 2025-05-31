#!/bin/bash

# Roo Agent Automation Integration Script
# This script helps integrate the Roo Agent Automation System into The New Fuse platform

echo "🚀 Roo Agent Automation System - Integration Setup"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in The New Fuse directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "This script must be run from The New Fuse project root directory"
    exit 1
fi

print_info "Detected The New Fuse project structure"

# Check if required files exist
echo ""
echo "Checking integration files..."

required_files=(
    "src/services/RooAgentAutomationService.ts"
    "src/services/roo-agent-templates.ts"
    "src/controllers/roo-agent-automation.controller.ts"
    "src/modules/RooAgentAutomationModule.ts"
    "src/mcp/TNFAgentAutomationMCPServer.ts"
    "src/scripts/roo-agent-cli.ts"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found $file"
    else
        print_error "Missing $file"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    print_error "Some required files are missing. Please ensure all files are properly placed."
    exit 1
fi

# Check dependencies
echo ""
echo "Checking dependencies..."

# Read package.json to check for required dependencies
required_deps=("@nestjs/common" "@nestjs/core" "commander" "inquirer" "chalk" "ora")
missing_deps=()

for dep in "${required_deps[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        print_status "Dependency $dep found"
    else
        print_warning "Dependency $dep missing"
        missing_deps+=("$dep")
    fi
done

# Install missing dependencies
if [ ${#missing_deps[@]} -ne 0 ]; then
    echo ""
    echo "Installing missing dependencies..."
    
    # Detect package manager
    if [ -f "yarn.lock" ]; then
        PKG_MANAGER="yarn add"
    elif [ -f "package-lock.json" ]; then
        PKG_MANAGER="npm install"
    else
        PKG_MANAGER="npm install"
    fi
    
    for dep in "${missing_deps[@]}"; do
        print_info "Installing $dep..."
        $PKG_MANAGER "$dep"
    done
    
    # Install dev dependencies
    if [ -f "yarn.lock" ]; then
        yarn add -D @types/inquirer @types/node
    else
        npm install -D @types/inquirer @types/node
    fi
fi

# Check if main app module needs updating
echo ""
echo "Checking application module integration..."

if grep -q "RooAgentAutomationModule" src/app.module.ts 2>/dev/null; then
    print_status "RooAgentAutomationModule already imported in app.module.ts"
else
    print_warning "RooAgentAutomationModule not found in app.module.ts"
    echo ""
    echo "Add the following to your src/app.module.ts:"
    echo ""
    echo -e "${BLUE}import { RooAgentAutomationModule } from './modules/RooAgentAutomationModule';${NC}"
    echo ""
    echo -e "${BLUE}@Module({"
    echo "  imports: ["
    echo "    // ... your existing modules"
    echo "    RooAgentAutomationModule,"
    echo "  ],"
    echo "})${NC}"
fi

# Build the project
echo ""
echo "Building TypeScript files..."

if [ -f "yarn.lock" ]; then
    yarn build
else
    npm run build
fi

if [ $? -eq 0 ]; then
    print_status "Build completed successfully"
else
    print_error "Build failed. Please fix TypeScript errors and try again."
    exit 1
fi

# Create CLI executable
echo ""
echo "Setting up CLI tool..."

# Make CLI script executable
chmod +x src/scripts/roo-agent-cli.ts

# Create a wrapper script for easier access
cat > roo-agent << 'EOF'
#!/bin/bash
npx tsx src/scripts/roo-agent-cli.ts "$@"
EOF

chmod +x roo-agent
print_status "CLI tool created: ./roo-agent"

# Setup MCP server configuration
echo ""
echo "Setting up MCP server configuration..."

# Create MCP configuration directory
MCP_CONFIG_DIR="$HOME/.config/Code/User"
mkdir -p "$MCP_CONFIG_DIR"

# Check if MCP settings file exists
MCP_SETTINGS_FILE="$MCP_CONFIG_DIR/mcp_settings.json"

if [ -f "$MCP_SETTINGS_FILE" ]; then
    print_info "Existing MCP settings found"
    
    # Check if our server is already configured
    if grep -q "tnf-agent-automation" "$MCP_SETTINGS_FILE"; then
        print_status "TNF Agent Automation MCP server already configured"
    else
        print_warning "Adding TNF Agent Automation MCP server to existing configuration"
        
        # Backup existing file
        cp "$MCP_SETTINGS_FILE" "$MCP_SETTINGS_FILE.backup"
        
        # Add our server configuration (this is a simplified approach)
        echo "Please manually add the following to your MCP settings:"
        echo ""
        echo -e "${BLUE}\"tnf-agent-automation\": {"
        echo "  \"type\": \"stdio\","
        echo "  \"command\": \"node\","
        echo "  \"args\": [\"$(pwd)/dist/mcp/TNFAgentAutomationMCPServer.js\"],"
        echo "  \"enabled\": true"
        echo "}${NC}"
    fi
else
    print_info "Creating new MCP settings file"
    
    cat > "$MCP_SETTINGS_FILE" << EOF
{
  "mcpServers": {
    "tnf-agent-automation": {
      "type": "stdio",
      "command": "node",
      "args": ["$(pwd)/dist/mcp/TNFAgentAutomationMCPServer.js"],
      "enabled": true
    }
  }
}
EOF
    
    print_status "MCP settings file created"
fi

# Create project .roo directory
echo ""
echo "Setting up project configuration..."

if [ ! -d ".roo" ]; then
    mkdir -p .roo
    print_status "Created .roo directory for project-specific agents"
else
    print_status ".roo directory already exists"
fi

# Test the installation
echo ""
echo "Testing installation..."

# Test the service import
if node -e "require('./dist/services/RooAgentAutomationService.js')" 2>/dev/null; then
    print_status "Service import test passed"
else
    print_warning "Service import test failed - may need additional dependencies"
fi

# Test CLI
if ./roo-agent --help >/dev/null 2>&1; then
    print_status "CLI test passed"
else
    print_warning "CLI test failed - check Node.js and TypeScript setup"
fi

# Final summary
echo ""
echo "================================================="
echo -e "${GREEN}🎉 Integration Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review and update your app.module.ts if needed"
echo "2. Start your application to test the REST API"
echo "3. Test the CLI with: ./roo-agent interactive"
echo "4. Configure Roo Code to use the MCP server"
echo ""
echo "Documentation: docs/ROO_AGENT_AUTOMATION_README.md"
echo ""
echo "Quick commands:"
echo "  ./roo-agent interactive          # Interactive mode"
echo "  ./roo-agent list-templates       # List available templates"
echo "  ./roo-agent quick-create senior-developer  # Quick agent creation"
echo "  ./roo-agent quick-team fullstack # Quick team creation"
echo ""
echo -e "${BLUE}Happy agent automating! 🤖${NC}"
