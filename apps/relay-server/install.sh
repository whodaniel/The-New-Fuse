#!/bin/bash
# TNF Relay Complete Installation Script

set -e

echo "🚀 Installing TNF Relay Complete Integration Package..."

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    if ! command -v node >/dev/null 2>&1; then
        echo "❌ Node.js is required but not installed."
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        echo "❌ npm is required but not installed."
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Main package dependencies
    pnpm install
    
    # UI dependencies (if UI directory exists and has package.json)
    if [[ -f "ui/package.json" ]]; then
        cd ui
        pnpm install
        cd ..
    fi
    
    echo "✅ Dependencies installed"
}

# Build UI
build_ui() {
    echo "🎨 Building dashboard UI..."
    
    if [[ -f "ui/package.json" ]]; then
        cd ui
        pnpm run build
        cd ..
        
        # Copy build to main package
        if [[ -d "ui/build" ]]; then
            cp -r ui/build src/ui-build
        fi
        
        echo "✅ UI built successfully"
    else
        echo "ℹ️ UI package not found, using existing build"
    fi
}

# Setup environment
setup_environment() {
    echo "🔧 Setting up environment..."
    
    # Make scripts executable
    chmod +x scripts/*.sh 2>/dev/null || true
    chmod +x *.sh 2>/dev/null || true
    
    # Create log directory
    mkdir -p logs
    mkdir -p intercepts
    mkdir -p config
    
    # Setup Claude Code environment
    if [[ -f "scripts/setup-claude-code.sh" ]]; then
        ./scripts/setup-claude-code.sh
    fi
    
    echo "✅ Environment configured"
}

# Main installation
main() {
    check_prerequisites
    install_dependencies
    build_ui
    setup_environment
    
    echo ""
    echo "🎉 TNF Relay Installation Complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Start the system: npm start"
    echo "2. Open dashboard: http://localhost:3002"
    echo "3. Configure applications using the dashboard"
    echo ""
    echo "🔧 Manual Configuration:"
    echo "   Claude Code: Already configured (restart terminal)"
    echo "   VS Code: ./scripts/setup-vscode.sh"
    echo "   System Proxy: ./scripts/system-proxy.sh enable"
    echo ""
    echo "🌐 Service URLs:"
    echo "   Dashboard: http://localhost:3002"
    echo "   HTTP API: http://localhost:3000"
    echo "   WebSocket: ws://localhost:3001"
    echo "   Proxy: http://localhost:8888"
    echo ""
    echo "📝 Logs: logs/"
    echo "🔧 Config: config/"
    echo "📊 Intercepts: intercepts/"
}

main "$@"
