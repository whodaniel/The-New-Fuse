#!/bin/bash

# Multi-Agent Chat Frontend Launcher
echo "🚀 Launching Complete Frontend Application with Multi-Agent Chat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Chrome is installed
check_chrome() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CHROME_CMD="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if [ ! -f "$CHROME_CMD" ]; then
            echo -e "${RED}❌ Chrome not found. Please install Chrome.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Please manually open Chrome after the server starts.${NC}"
        CHROME_CMD=""
    fi
}

# Create a simple frontend index with all pages
create_frontend_index() {
    cd apps/frontend || exit 1
    
    cat > index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The New Fuse - Frontend Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        h1 { color: #333; text-align: center; margin-bottom: 10px; font-size: 2.5em; }
        .subtitle { text-align: center; color: #666; margin-bottom: 40px; font-size: 1.2em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; margin-top: 30px; }
        .card { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 12px; border-left: 5px solid #007bff; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; color: #007bff; font-size: 1.3em; }
        .card a { display: inline-block; margin: 8px 12px 8px 0; padding: 8px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-size: 0.9em; transition: background 0.3s ease; }
        .card a:hover { background: #0056b3; }
        .highlight { background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%); border-left-color: #ff6b6b; }
        .highlight h3 { color: #ff6b6b; }
        .highlight a { background: #ff6b6b; }
        .highlight a:hover { background: #e55555; }
        .footer { text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 10px; }
        .status { display: inline-block; width: 12px; height: 12px; background: #28a745; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 The New Fuse</h1>
        <p class="subtitle">
            <span class="status"></span>
            Multi-Agent Chat & Frontend Application Dashboard
        </p>
        
        <div class="grid">
            <div class="card highlight">
                <h3>🤖 Multi-Agent Chat</h3>
                <p>New integrated multi-agent chat system with Firebase backend, real-time messaging, and agent management.</p>
                <a href="/src/components/MultiAgentChat.tsx" target="_blank">View Component</a>
                <a href="/src/pages/MultiAgentChat.tsx" target="_blank">Chat Page</a>
            </div>
            
            <div class="card">
                <h3>🏠 Main Pages</h3>
                <p>Core application pages and entry points.</p>
                <a href="/src/pages/Home.tsx" target="_blank">Home</a>
                <a href="/src/pages/Dashboard.tsx" target="_blank">Dashboard</a>
                <a href="/src/pages/Landing.tsx" target="_blank">Landing</a>
            </div>
            
            <div class="card">
                <h3>🔐 Authentication</h3>
                <p>User authentication and authorization flows.</p>
                <a href="/src/pages/auth/Login.tsx" target="_blank">Login</a>
                <a href="/src/pages/auth/Register.tsx" target="_blank">Register</a>
                <a href="/src/pages/auth/SSO.tsx" target="_blank">SSO</a>
            </div>
            
            <div class="card">
                <h3>🤖 AI & Agents</h3>
                <p>AI agent management and interaction systems.</p>
                <a href="/src/pages/Agents/index.tsx" target="_blank">Agents</a>
                <a href="/src/pages/AIAgentPortal/index.tsx" target="_blank">AI Portal</a>
                <a href="/src/pages/Chat.tsx" target="_blank">Chat</a>
            </div>
            
            <div class="card">
                <h3>⚙️ Workflows</h3>
                <p>Workflow management and automation systems.</p>
                <a href="/src/pages/Workflows.tsx" target="_blank">Workflows</a>
                <a href="/src/pages/WorkflowsEnhanced.tsx" target="_blank">Enhanced</a>
                <a href="/src/components/workflow/WorkflowNode.tsx" target="_blank">Nodes</a>
            </div>
            
            <div class="card">
                <h3>👥 Workspace</h3>
                <p>Collaborative workspace and team features.</p>
                <a href="/src/pages/workspace/Overview.tsx" target="_blank">Overview</a>
                <a href="/src/pages/workspace/Settings.tsx" target="_blank">Settings</a>
                <a href="/src/pages/WorkspaceChat/index.tsx" target="_blank">Chat</a>
            </div>
            
            <div class="card">
                <h3>🛠️ Admin</h3>
                <p>Administrative controls and system management.</p>
                <a href="/src/pages/Admin/index.tsx" target="_blank">Admin Panel</a>
                <a href="/src/pages/Admin/FeatureFlags/index.tsx" target="_blank">Feature Flags</a>
                <a href="/src/pages/Admin/Settings.tsx" target="_blank">Settings</a>
            </div>
            
            <div class="card">
                <h3>📊 Analytics & Demo</h3>
                <p>Analytics, demonstrations, and showcases.</p>
                <a href="/src/pages/Analytics.tsx" target="_blank">Analytics</a>
                <a href="/src/pages/ComponentsShowcase.tsx" target="_blank">Showcase</a>
                <a href="/src/pages/graph-demo.tsx" target="_blank">Graph Demo</a>
                <a href="/src/pages/TimelineDemo.tsx" target="_blank">Timeline</a>
            </div>
            
            <div class="card">
                <h3>🧪 Testing & Debug</h3>
                <p>Testing utilities and debugging tools.</p>
                <a href="/src/pages/Test.tsx" target="_blank">Test Page</a>
                <a href="/src/pages/SuperSimpleTest.tsx" target="_blank">Simple Test</a>
                <a href="/src/pages/Debug.tsx" target="_blank">Debug</a>
            </div>
        </div>
        
        <div class="footer">
            <h4>🌟 Server Status</h4>
            <p>Frontend server is running on <strong>http://localhost:3000</strong></p>
            <p>Multi-Agent Chat integration completed successfully!</p>
            <small>Use the links above to navigate to different parts of the application.</small>
        </div>
    </div>
</body>
</html>
HTMLEOF

    echo -e "${GREEN}✅ Created frontend index page${NC}"
}

# Start server and open Chrome
start_server_and_chrome() {
    echo -e "${BLUE}📡 Starting Python HTTP server on port 3000...${NC}"
    python3 -m http.server 3000 --bind 0.0.0.0 &
    SERVER_PID=$!
    echo -e "${GREEN}✅ Server started with PID: $SERVER_PID${NC}"
    
    # Wait a moment for server to start
    sleep 3
    
    # Check Chrome and open pages
    check_chrome
    
    if [ -n "$CHROME_CMD" ]; then
        echo -e "${YELLOW}🌐 Opening Chrome with multiple tabs...${NC}"
        
        # Main pages to open
        PAGES=(
            "http://localhost:3000"
            "http://localhost:3000/src/components/MultiAgentChat.tsx"
            "http://localhost:3000/src/pages/Dashboard.tsx"
            "http://localhost:3000/src/pages/AIAgentPortal/index.tsx"
            "http://localhost:3000/src/pages/ComponentsShowcase.tsx"
        )
        
        # Open first page in new window
        "$CHROME_CMD" --new-window "${PAGES[0]}" &
        sleep 2
        
        # Open additional pages in new tabs
        for page in "${PAGES[@]:1}"; do
            "$CHROME_CMD" --new-tab "$page" &
            sleep 1
        done
        
        echo -e "${GREEN}✅ Opened ${#PAGES[@]} pages in Chrome${NC}"
    else
        echo -e "${YELLOW}📝 Please manually open these URLs:${NC}"
        echo "   • http://localhost:3000 (Main Dashboard)"
        echo "   • http://localhost:3000/src/components/MultiAgentChat.tsx (Multi-Agent Chat)"
        echo "   • http://localhost:3000/src/pages/Dashboard.tsx (Dashboard)"
        echo "   • http://localhost:3000/src/pages/AIAgentPortal/index.tsx (AI Portal)"
    fi
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🛑 Shutting down server...${NC}"
    if [ -n "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
echo -e "${BLUE}📁 Project root: $(pwd)${NC}"
create_frontend_index
start_server_and_chrome

echo -e "${GREEN}🎉 Frontend application launched successfully!${NC}"
echo -e "${BLUE}📝 Press Ctrl+C to stop the server${NC}"

# Keep server running
wait $SERVER_PID
