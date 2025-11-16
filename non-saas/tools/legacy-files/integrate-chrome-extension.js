#!/usr/bin/env node

/**
 * TNF Relay Chrome Extension Integration Updater
 * Updates the comprehensive TNF Relay to include Chrome Extension integration
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class TNFChromeExtensionIntegrator {
    constructor() {
        this.workspaceDir = path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The New Fuse');
        this.chromeExtensionDir = path.join(this.workspaceDir, 'chrome-extension');
        this.relayFile = path.join(this.workspaceDir, 'comprehensive-tnf-relay.js');
        this.dashboardFile = path.join(this.workspaceDir, 'ui/src/TNFRelayDashboard.js');
    }

    async integrateAll() {
        console.log('🔥 Starting TNF Relay Chrome Extension Integration...\n');
        
        await this.verifyFiles();
        await this.updateTNFRelay();
        await this.updateDashboard();
        await this.createChromeExtensionSupport();
        await this.updateDocumentation();
        
        console.log('\n🎉 TNF Relay Chrome Extension Integration Complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. Restart TNF Relay: node comprehensive-tnf-relay.js');
        console.log('2. Load Chrome Extension from chrome-extension/ directory');
        console.log('3. Open Dashboard: http://localhost:3002');
        console.log('4. Test Chrome Extension on a website');
    }

    async verifyFiles() {
        console.log('🔍 Verifying existing files...');
        
        const requiredFiles = [
            this.relayFile,
            this.dashboardFile,
            path.join(this.chromeExtensionDir, 'content-tnf-integrated.js'),
            path.join(this.chromeExtensionDir, 'background-tnf-integrated.js')
        ];

        for (const file of requiredFiles) {
            try {
                await fs.access(file);
                console.log(`  ✅ ${path.basename(file)}`);
            } catch (error) {
                console.log(`  ❌ ${path.basename(file)} - Missing!`);
                throw new Error(`Required file missing: ${file}`);
            }
        }
        
        console.log('✅ All required files verified\n');
    }

    async updateTNFRelay() {
        console.log('📝 Updating TNF Relay with Chrome Extension support...');
        
        const relayContent = await fs.readFile(this.relayFile, 'utf8');
        
        // Check if Chrome Extension integration is already present
        if (relayContent.includes('handleChromeExtensionMessage')) {
            console.log('  ℹ️ Chrome Extension integration already present in TNF Relay');
            return;
        }
        
        // Add Chrome Extension integration
        const chromeExtensionIntegration = `
        // Chrome Extension Integration
        handleChromeExtensionMessage(data, ws) {
            this.log('📱 Chrome Extension message:', data.type);
            
            switch (data.type) {
                case 'REGISTER_AGENT':
                    this.handleAgentRegistration(data, ws, 'chrome_extension');
                    break;
                case 'TAB_CONTEXT_UPDATE':
                    this.handleTabContextUpdate(data, ws);
                    break;
                case 'ELEMENT_DETECTION_RESULT':
                    this.handleElementDetectionResult(data, ws);
                    break;
                case 'PAGE_ELEMENTS':
                    this.handlePageElements(data, ws);
                    break;
                case 'MESSAGE_RELAY':
                    this.handleChromeExtensionRelay(data, ws);
                    break;
                case 'CLAUDE_DESKTOP_MESSAGE':
                    this.routeToClaudeDesktop(data);
                    break;
                default:
                    this.log('❓ Unknown Chrome Extension message type:', data.type);
            }
        }

        handleTabContextUpdate(data, ws) {
            const tabId = data.content.tabId;
            const context = data.content.context;
            
            // Store tab context
            this.tabContexts.set(tabId, {
                context,
                timestamp: Date.now(),
                websocket: ws
            });
            
            this.log('📱 Tab context updated:', tabId, context.hostname);
            
            // Broadcast to dashboard
            this.broadcastToClients({
                type: 'TAB_UPDATE',
                tabId,
                context
            });
        }

        handleElementDetectionResult(data, ws) {
            const { tabId, elements, context } = data.content;
            
            this.log('🔍 Element detection result:', tabId, Object.keys(elements).filter(k => elements[k]).length, 'elements');
            
            // Store elements for this tab
            if (this.tabContexts.has(tabId)) {
                this.tabContexts.get(tabId).elements = elements;
            }
            
            // Forward to dashboard
            this.broadcastToClients({
                type: 'ELEMENT_DETECTION_UPDATE',
                tabId,
                elements,
                context
            });
        }

        handlePageElements(data, ws) {
            const { selectedElements, context } = data.content;
            
            this.log('📱 Page elements received:', Object.keys(selectedElements).filter(k => selectedElements[k]).length, 'selected');
            
            // Process and potentially forward to Claude Desktop
            const elementsMessage = {
                type: 'PAGE_CONTEXT',
                source: 'chrome_extension',
                content: {
                    url: context.url,
                    title: context.title,
                    technology: context.technology,
                    elements: selectedElements,
                    timestamp: new Date().toISOString()
                }
            };
            
            this.routeToClaudeDesktop(elementsMessage);
        }

        handleChromeExtensionRelay(data, ws) {
            const { message, context } = data.content;
            
            this.log('💬 Chrome Extension relay:', message.substring(0, 50) + '...');
            
            // Forward to Claude Desktop with context
            const relayMessage = {
                type: 'CHROME_EXTENSION_MESSAGE',
                source: 'chrome_extension',
                target: 'claude_desktop',
                content: {
                    message,
                    context,
                    timestamp: new Date().toISOString()
                }
            };
            
            this.routeToClaudeDesktop(relayMessage);
            
            // Store in message history
            this.messageHistory.push({
                id: Date.now(),
                type: 'chrome_extension_relay',
                message,
                context,
                timestamp: new Date().toISOString()
            });
        }

        // Enhanced Agent Registration for Chrome Extensions
        handleChromeExtensionAgentRegistration(data, ws) {
            const agentId = \`chrome_ext_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
            const agentInfo = {
                id: agentId,
                type: 'chrome_extension',
                capabilities: data.content.capabilities || ['element_detection', 'page_analysis', 'message_relay'],
                context: data.content.context,
                websocket: ws,
                connectedAt: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            };

            this.agents.set(agentId, agentInfo);
            this.log('📱 Chrome Extension agent registered:', agentId);

            // Send registration confirmation
            ws.send(JSON.stringify({
                type: 'AGENT_REGISTERED',
                source: 'tnf_relay',
                target: 'chrome_extension',
                content: {
                    agentId,
                    capabilities: agentInfo.capabilities,
                    timestamp: new Date().toISOString()
                }
            }));

            // Update dashboard
            this.broadcastToClients({
                type: 'AGENT_UPDATE',
                agents: Array.from(this.agents.values())
            });
        }`;

        // Insert the Chrome Extension integration before the final closing brace
        const updatedContent = relayContent.replace(
            /(\s+)\/\/ End of class/,
            chromeExtensionIntegration + '\n$1// End of class'
        );

        // Add tab contexts initialization
        const initUpdated = updatedContent.replace(
            'this.messageHistory = [];',
            'this.messageHistory = [];\n        this.tabContexts = new Map();'
        );

        // Update message handling to include Chrome Extension
        const messageHandlerUpdate = initUpdated.replace(
            'case \'chrome_extension\':',
            'case \'chrome_extension\':\n            case \'chrome_extension_background\':\n                this.handleChromeExtensionMessage(data, ws);\n                break;\n            case \'original_chrome_extension\':'
        );

        await fs.writeFile(this.relayFile, messageHandlerUpdate);
        console.log('  ✅ TNF Relay updated with Chrome Extension integration');
    }

    async updateDashboard() {
        console.log('📊 Updating Dashboard with Chrome Extension support...');
        
        const dashboardContent = await fs.readFile(this.dashboardFile, 'utf8');
        
        // Check if Chrome Extension support is already present
        if (dashboardContent.includes('Chrome Extensions')) {
            console.log('  ℹ️ Chrome Extension support already present in Dashboard');
            return;
        }

        // Add Chrome Extension tab to dashboard
        const chromeExtensionTab = `
            {id: 'chrome-extensions', label: '🔌 Chrome Extensions', icon: Extension}`;

        // Add Chrome Extension panel
        const chromeExtensionPanel = `
        {activeTab === 'chrome-extensions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chrome Extension Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Connected Tabs</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {Array.from(tabContexts.values()).length}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Active Extensions</span>
                    <span className="text-2xl font-bold text-green-600">
                      {agents.filter(a => a.type === 'chrome_extension').length}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Detected Elements</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {Array.from(tabContexts.values()).reduce((total, tab) => 
                        total + (tab.elements ? Object.keys(tab.elements).filter(k => tab.elements[k]).length : 0), 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Tabs</h3>
              <div className="space-y-3">
                {Array.from(tabContexts.entries()).map(([tabId, tabData]) => (
                  <div key={tabId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {tabData.context?.title || 'Unknown Page'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {tabData.context?.hostname} • {tabData.context?.workspace?.type}
                      </div>
                      <div className="text-xs text-gray-400">
                        Tech: {tabData.context?.technology?.join(', ') || 'Unknown'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex space-x-2">
                        {tabData.elements?.input && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">Input</span>
                        )}
                        {tabData.elements?.button && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">Button</span>
                        )}
                        {tabData.elements?.output && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded">Output</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(tabData.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                {Array.from(tabContexts.entries()).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Extension className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No Chrome Extension tabs connected</p>
                    <p className="text-sm">Install and activate the TNF Chrome Extension</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chrome Extension Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => broadcastToTabs({ type: 'SHOW_PANELS' })}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-medium text-gray-900">Show All Panels</div>
                  <div className="text-sm text-gray-600">Display TNF panels on all connected tabs</div>
                </button>
                <button
                  onClick={() => broadcastToTabs({ type: 'AUTO_DETECT_ELEMENTS' })}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-medium text-gray-900">Auto-Detect Elements</div>
                  <div className="text-sm text-gray-600">Run element detection on all tabs</div>
                </button>
                <button
                  onClick={() => broadcastToTabs({ type: 'COLLECT_CONTEXT' })}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-medium text-gray-900">Collect Context</div>
                  <div className="text-sm text-gray-600">Gather page context from all tabs</div>
                </button>
                <button
                  onClick={() => window.open('chrome://extensions/', '_blank')}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-medium text-gray-900">Manage Extensions</div>
                  <div className="text-sm text-gray-600">Open Chrome Extensions page</div>
                </button>
              </div>
            </div>
          </div>
        )}`;

        // Add state for tab contexts
        const stateAddition = `
  const [tabContexts] = useState(new Map());`;

        // Update dashboard content
        let updatedDashboard = dashboardContent.replace(
            /const tabs = \[/,
            `const tabs = [\n${chromeExtensionTab},`
        );

        updatedDashboard = updatedDashboard.replace(
            /const \[activeTab, setActiveTab\] = useState\('dashboard'\);/,
            `const [activeTab, setActiveTab] = useState('dashboard');\n${stateAddition}`
        );

        updatedDashboard = updatedDashboard.replace(
            /{activeTab === 'settings' && \(/,
            `${chromeExtensionPanel}\n\n        {activeTab === 'settings' && (`
        );

        await fs.writeFile(this.dashboardFile, updatedDashboard);
        console.log('  ✅ Dashboard updated with Chrome Extension support');
    }

    async createChromeExtensionSupport() {
        console.log('🔌 Creating Chrome Extension support files...');
        
        // Create installation guide
        const installGuide = `# Chrome Extension Installation Guide

## Quick Installation

1. **Open Chrome Extensions Page**
   - Navigate to \`chrome://extensions/\`
   - Enable "Developer mode" (toggle in top-right)

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the \`chrome-extension\` directory
   - The extension should appear in your extensions list

3. **Verify Installation**
   - Look for the TNF Relay icon in Chrome toolbar
   - Click the icon to open the popup interface
   - The extension should show "Disconnected from TNF Relay"

## Connect to TNF Relay

1. **Start TNF Relay Server**
   \`\`\`bash
   cd "The New Fuse"
   node comprehensive-tnf-relay.js
   \`\`\`

2. **Connect Extension**
   - Click the TNF Relay extension icon
   - Click "Connect to TNF" button
   - Status should change to "Connected to TNF Relay"

3. **Test on a Website**
   - Navigate to any website (e.g., claude.ai, github.com)
   - Click extension icon and then "Show TNF Panel"
   - The floating panel should appear on the page

## Features

- **🔍 Element Detection**: Auto-detect chat inputs, buttons, and output areas
- **📱 Page Analysis**: Analyze page technology and context
- **💬 Message Relay**: Send messages through TNF Relay to Claude Desktop
- **🎯 Manual Selection**: Manually select page elements
- **📊 Real-time Status**: Monitor connection and agent status

## Keyboard Shortcuts

- **Ctrl+Shift+T**: Toggle TNF panel
- **Ctrl+Shift+R**: Connect to TNF Relay

## Troubleshooting

- **Extension not loading**: Ensure developer mode is enabled
- **Cannot connect**: Verify TNF Relay server is running on port 3001
- **Panel not showing**: Refresh the page and try again
- **Elements not detected**: Try manual selection mode
`;

        await fs.writeFile(
            path.join(this.chromeExtensionDir, 'INSTALLATION.md'),
            installGuide
        );

        // Create Chrome Extension README
        const chromeReadme = `# TNF Relay Chrome Extension

Complete Chrome Extension integration for The New Fuse Relay system.

## Features

✅ **Complete TNF Relay Integration**
✅ **Real-time WebSocket Communication** 
✅ **Advanced Element Detection**
✅ **Page Context Analysis**
✅ **Cross-tab Communication**
✅ **Claude Desktop Message Routing**
✅ **Professional UI with Floating Panel**
✅ **Agent Management System**

## Files

- \`manifest-tnf-integrated.json\` - Extension manifest (rename to manifest.json)
- \`content-tnf-integrated.js\` - Enhanced content script with TNF integration
- \`background-tnf-integrated.js\` - Background service worker with TNF communication
- \`popup-tnf-integrated.html\` - Popup interface
- \`popup-tnf-integrated.js\` - Popup functionality
- \`config-tnf-integrated.js\` - Configuration and utilities

## Installation

See INSTALLATION.md for detailed setup instructions.

## Architecture

\`\`\`
Chrome Extension
├── Background Script (Service Worker)
│   ├── TNF Relay WebSocket Connection
│   ├── Cross-tab Message Routing
│   └── System Integration
├── Content Script (Per Tab)
│   ├── Floating Panel UI
│   ├── Element Detection
│   ├── Page Analysis
│   └── User Interaction
└── Popup Interface
    ├── Status Monitoring
    ├── Manual Controls
    └── Quick Actions
\`\`\`

## TNF Integration

The extension integrates with TNF Relay through:

1. **WebSocket Connection** (port 3001) - Real-time communication
2. **Agent Registration** - Identifies as chrome_extension agent
3. **Context Preservation** - Sends page context and workspace info
4. **Element Detection** - Reports detected UI elements
5. **Message Routing** - Routes messages to Claude Desktop
6. **Status Updates** - Real-time status synchronization

## Usage

1. Install extension in Chrome
2. Start TNF Relay server
3. Click extension icon and connect
4. Navigate to any website
5. Use floating panel for interaction
6. Messages route through TNF Relay to Claude Desktop
`;

        await fs.writeFile(
            path.join(this.chromeExtensionDir, 'README.md'),
            chromeReadme
        );

        console.log('  ✅ Chrome Extension support files created');
    }

    async updateDocumentation() {
        console.log('📚 Updating documentation...');
        
        const docsUpdate = `
# TNF Relay Chrome Extension Integration

## Overview

The Chrome Extension provides complete browser integration for The New Fuse Relay system, enabling:

- Real-time communication between browser tabs and TNF Relay
- Automatic detection of chat interfaces and UI elements  
- Context-aware message routing to Claude Desktop
- Cross-browser tab coordination
- Professional floating panel interface

## Installation & Setup

1. **Install Chrome Extension**
   \`\`\`bash
   # Load unpacked extension from chrome-extension directory
   # in Chrome > Extensions > Developer mode > Load unpacked
   \`\`\`

2. **Start TNF Relay with Chrome Extension Support**
   \`\`\`bash
   node comprehensive-tnf-relay.js
   \`\`\`

3. **Connect Extension to TNF Relay**
   - Click extension icon in Chrome toolbar
   - Click "Connect to TNF" button
   - Status should show "Connected to TNF Relay"

## Features

### 🔍 Smart Element Detection
- Auto-detects chat inputs, send buttons, and message areas
- Manual element selection with visual highlighting
- Cross-platform compatibility (Claude.ai, ChatGPT, GitHub, etc.)
- Real-time element validation

### 📱 Advanced Page Analysis  
- Technology stack detection (React, Vue, Angular)
- Workspace type identification (GitHub, VS Code Web, Local Dev)
- Git repository context extraction
- Page metadata and context preservation

### 💬 Seamless Message Routing
- Direct integration with TNF Relay WebSocket
- Message formatting with full context
- Automatic routing to Claude Desktop
- Bidirectional communication support

### 🎯 Professional UI
- Draggable and resizable floating panel
- Multi-section organized interface
- Real-time status indicators
- Keyboard shortcuts (Ctrl+Shift+T)

### 🤖 Agent Management
- Automatic agent registration with TNF Relay
- Unique agent ID generation
- Capability reporting and management
- Health monitoring and heartbeat

## Technical Architecture

\`\`\`
┌─────────────────────┐    ┌─────────────────────┐
│   Chrome Extension  │    │     TNF Relay       │
│                     │    │                     │
│  ┌─ Background ───┐ │    │  ┌─ WebSocket ───┐  │
│  │ - Agent Mgmt  │ │◄──►│  │ - Port 3001   │  │
│  │ - Connection  │ │    │  │ - Agent Hub   │  │
│  │ - Tab Mgmt    │ │    │  └───────────────┘  │
│  └───────────────┘ │    │                     │
│                     │    │  ┌─ HTTP API ───┐  │
│  ┌─ Content ─────┐ │    │  │ - Port 3000   │  │
│  │ - UI Panel    │ │◄──►│  │ - REST Endpoints│ │
│  │ - Element Det │ │    │  └───────────────┘  │
│  │ - Page Ctx    │ │    │                     │
│  └───────────────┘ │    │  ┌─ Dashboard ──┐  │
│                     │    │  │ - Port 3002   │  │
│  ┌─ Popup ───────┐ │    │  │ - Chrome Ext  │  │
│  │ - Status      │ │    │  │   Management  │  │
│  │ - Controls    │ │    │  └───────────────┘  │
│  └───────────────┘ │    └─────────────────────┘
└─────────────────────┘              │
                                     ▼
                           ┌─────────────────────┐
                           │   Claude Desktop    │
                           │                     │
                           │ - Message Display   │
                           │ - Context Integration│
                           │ - AppleScript Control│
                           └─────────────────────┘
\`\`\`

## Message Flow

1. **User interacts** with website through Chrome Extension
2. **Extension captures** page context and element information  
3. **Message sent** to TNF Relay via WebSocket (port 3001)
4. **TNF Relay processes** and adds workspace context
5. **Message formatted** for Claude Desktop with full context
6. **AppleScript routes** message to Claude Desktop application
7. **Real-time updates** flow back through the system

## Dashboard Integration

The TNF Relay Dashboard includes a dedicated Chrome Extensions tab showing:

- Connected browser tabs and their contexts
- Detected elements per tab  
- Agent status and capabilities
- Real-time message flow
- Bulk operations (show all panels, auto-detect elements)

## Development

### Updating the Extension

1. Modify files in \`chrome-extension/\` directory
2. Use \`*-tnf-integrated.js\` files for TNF integration
3. Reload extension in Chrome (chrome://extensions/)
4. Test with TNF Relay running

### Adding New Features

1. Update \`config-tnf-integrated.js\` for new message types
2. Add handlers in \`content-tnf-integrated.js\`
3. Update TNF Relay in \`comprehensive-tnf-relay.js\`
4. Add dashboard UI in \`TNFRelayDashboard.js\`

## Troubleshooting

### Extension Issues
- **Not loading**: Enable Developer mode in chrome://extensions/
- **Permission errors**: Check host_permissions in manifest
- **Script injection fails**: Verify content script matches

### Connection Issues  
- **Cannot connect**: Ensure TNF Relay running on port 3001
- **Frequent disconnects**: Check firewall/antivirus settings
- **Messages not routing**: Verify WebSocket connection in dashboard

### Element Detection Issues
- **No elements found**: Try manual selection mode
- **Wrong elements**: Use manual selection to override
- **Elements change**: Re-run auto-detection after page updates

## Security Considerations

- Extension only connects to localhost by default
- No external network requests except to TNF Relay
- Page content access limited to element detection
- No sensitive data storage in extension

## Performance

- Minimal memory footprint per tab
- Efficient WebSocket connection sharing
- Lazy loading of UI components
- Optimized element detection algorithms
`;

        await fs.writeFile(
            path.join(this.workspaceDir, 'docs/CHROME_EXTENSION_INTEGRATION.md'),
            docsUpdate
        );

        console.log('  ✅ Documentation updated');
    }
}

// CLI interface
if (require.main === module) {
    const integrator = new TNFChromeExtensionIntegrator();
    
    (async () => {
        try {
            await integrator.integrateAll();
        } catch (error) {
            console.error('❌ Integration failed:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = TNFChromeExtensionIntegrator;