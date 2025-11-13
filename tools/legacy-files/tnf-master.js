#!/usr/bin/env node

/**
 * TNF Relay Master Command Center
 * Complete control over the TNF Relay package creation and management
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class TNFMasterControl {
    constructor() {
        this.workspaceDir = path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The New Fuse');
        this.packageDir = path.join(this.workspaceDir, 'tnf-relay-package');
    }

    showBanner() {
        console.log(`
┌─────────────────────────────────────────────────────────────┐
│  🚀 TNF Relay Master Command Center v4.0                   │
│  Complete AI API Interception & Management System          │
└─────────────────────────────────────────────────────────────┘
        `);
    }

    showMenu() {
        console.log(`
📋 Available Commands:

1️⃣  verify     - Check existing files and show package summary
2️⃣  create     - Create complete TNF Relay package
3️⃣  install    - Install the created package
4️⃣  start      - Start the TNF Relay system
5️⃣  status     - Check system status
6️⃣  dashboard  - Open the management dashboard
7️⃣  setup      - Quick setup for Claude Code/VS Code
8️⃣  clean      - Remove all TNF Relay files
9️⃣  help       - Show detailed help information

🔧 Quick Commands:
   • all        - Run verify → create → install → start
   • quick      - Create and install package
   • demo       - Start demo mode with test data

Usage: node tnf-master.js [command]
        `);
    }

    async executeCommand(command) {
        switch (command) {
            case 'verify':
                await this.verify();
                break;
            case 'create':
                await this.create();
                break;
            case 'install':
                await this.install();
                break;
            case 'start':
                await this.start();
                break;
            case 'status':
                await this.status();
                break;
            case 'dashboard':
                await this.dashboard();
                break;
            case 'setup':
                await this.setup();
                break;
            case 'clean':
                await this.clean();
                break;
            case 'all':
                await this.all();
                break;
            case 'quick':
                await this.quick();
                break;
            case 'demo':
                await this.demo();
                break;
            case 'help':
                await this.help();
                break;
            default:
                this.showMenu();
        }
    }

    async verify() {
        console.log('🔍 Running verification...\n');
        execSync('node verify-tnf-package.js', { stdio: 'inherit' });
    }

    async create() {
        console.log('📦 Creating TNF Relay package...\n');
        execSync('node create-complete-tnf-package.js', { stdio: 'inherit' });
    }

    async install() {
        console.log('🔧 Installing TNF Relay package...\n');
        try {
            process.chdir(this.packageDir);
            execSync('./install.sh', { stdio: 'inherit' });
        } catch (error) {
            console.error('❌ Installation failed. Please create package first with: node tnf-master.js create');
        }
    }

    async start() {
        console.log('🚀 Starting TNF Relay system...\n');
        try {
            process.chdir(this.packageDir);
            execSync('npm start', { stdio: 'inherit' });
        } catch (error) {
            console.error('❌ Start failed. Please install package first with: node tnf-master.js install');
        }
    }

    async status() {
        console.log('📊 Checking system status...\n');
        try {
            const response = await fetch('http://localhost:3000/status');
            const data = await response.json();
            
            console.log('✅ TNF Relay is running!');
            console.log(`   Relay ID: ${data.relayId}`);
            console.log(`   Version: ${data.version}`);
            console.log(`   Agents: ${data.stats.agents}`);
            console.log(`   Messages: ${data.stats.interceptedMessages}`);
            console.log(`   Connections: ${data.stats.activeConnections}`);
        } catch (error) {
            console.log('❌ TNF Relay is not running');
            console.log('   Start with: node tnf-master.js start');
        }
    }

    async dashboard() {
        console.log('🌐 Opening dashboard...\n');
        execSync('open http://localhost:3002');
        console.log('Dashboard opened in browser: http://localhost:3002');
    }

    async setup() {
        console.log('⚙️ Running setup wizard...\n');
        
        console.log('1. Setting up Claude Code environment...');
        try {
            execSync('chmod +x scripts/setup-claude-code.sh && ./scripts/setup-claude-code.sh', { 
                stdio: 'inherit',
                cwd: this.workspaceDir 
            });
        } catch (error) {
            console.log('ℹ️ Claude Code setup script not found - will be created during package installation');
        }
        
        console.log('\n2. Generating VS Code proxy configuration...');
        const vsCodeConfig = {
            "http.proxy": "http://localhost:8888",
            "http.proxyStrictSSL": false,
            "http.proxySupport": "on"
        };
        
        console.log('VS Code Proxy Settings:');
        console.log(JSON.stringify(vsCodeConfig, null, 2));
        console.log('\nAdd these to your VS Code settings.json');
        
        console.log('\n3. System proxy instructions:');
        console.log('Enable:  networksetup -setwebproxy "Wi-Fi" localhost 8888');
        console.log('Disable: networksetup -setwebproxystate "Wi-Fi" off');
    }

    async clean() {
        console.log('🧹 Cleaning TNF Relay files...\n');
        
        try {
            await fs.rmdir(this.packageDir, { recursive: true });
            console.log('✅ Package directory removed');
        } catch (error) {
            console.log('ℹ️ No package directory to remove');
        }
        
        try {
            execSync('pkill -f "comprehensive-tnf-relay" || true');
            console.log('✅ Stopped running processes');
        } catch (error) {
            console.log('ℹ️ No running processes found');
        }
        
        console.log('🧹 Cleanup complete');
    }

    async all() {
        console.log('🎯 Running complete TNF Relay setup...\n');
        
        await this.verify();
        console.log('\n' + '─'.repeat(60) + '\n');
        
        await this.create();
        console.log('\n' + '─'.repeat(60) + '\n');
        
        await this.install();
        console.log('\n' + '─'.repeat(60) + '\n');
        
        console.log('🎉 Complete setup finished!');
        console.log('🚀 Ready to start with: node tnf-master.js start');
    }

    async quick() {
        console.log('⚡ Quick TNF Relay setup...\n');
        
        await this.create();
        console.log('\n' + '─'.repeat(30) + '\n');
        await this.install();
        
        console.log('\n🎉 Quick setup complete!');
        console.log('🚀 Start with: node tnf-master.js start');
    }

    async demo() {
        console.log('🎪 Starting TNF Relay demo mode...\n');
        
        // Check if package exists
        try {
            await fs.access(this.packageDir);
            console.log('📦 Package found, starting demo...');
            process.chdir(this.packageDir);
            
            // Start with demo data
            console.log('🎯 Demo features:');
            console.log('  • HTTP/HTTPS proxy on port 8888');
            console.log('  • Management dashboard on port 3002');
            console.log('  • WebSocket API on port 3001');
            console.log('  • REST API on port 3000');
            console.log('\n🚀 Starting demo...');
            
            execSync('npm start', { stdio: 'inherit' });
        } catch (error) {
            console.log('❌ Package not found. Creating demo package...');
            await this.quick();
            await this.demo();
        }
    }

    async help() {
        console.log(`
📖 TNF Relay Master Control Help

🎯 What is TNF Relay?
The TNF (The New Fuse) Relay is a comprehensive AI API interception system that:
• Intercepts API calls from Claude Code, VS Code, and other applications
• Routes them through a proxy server for monitoring and control
• Formats and sends intercepted content to Claude Desktop
• Provides real-time dashboard for system management

🔧 System Architecture:
┌─────────────────┐    ┌─────────────────┐
│   Claude Code   │    │   VS Code Ext   │
│   (Terminal)    │    │                 │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │ HTTP_PROXY           │ http.proxy
          │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │     TNF Proxy Server       │
                    │        (Port 8888)         │
                    └─────────────┬──────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │   TNF Management Relay     │
                    │  HTTP:3000, WS:3001, UI:3002│
                    └─────────────┬──────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │     Claude Desktop         │
                    │   (Message Display)        │
                    └────────────────────────────┘

📋 Command Reference:

verify    - Check existing files and show what will be created
create    - Generate complete TNF Relay package with all components  
install   - Install dependencies and configure environment
start     - Launch the TNF Relay system (all servers)
status    - Check if system is running and show statistics
dashboard - Open web management interface
setup     - Configure Claude Code, VS Code, and system proxy
clean     - Remove all TNF files and stop processes
all       - Complete setup: verify → create → install
quick     - Fast setup: create → install  
demo      - Start demo mode with example configuration

🚀 Quick Start:
1. node tnf-master.js verify    # Check what you have
2. node tnf-master.js all       # Complete setup
3. node tnf-master.js start     # Launch system
4. Open http://localhost:3002   # Access dashboard

💡 Pro Tips:
• Use 'quick' for fastest setup
• Use 'demo' to see the system in action
• Check 'status' to verify everything is working
• Dashboard provides visual management of all features

🆘 Troubleshooting:
• If commands fail, try 'clean' then 'all'
• Check port availability (3000, 3001, 3002, 8888)
• Ensure Node.js and npm are installed
• Check logs in tnf-relay-package/logs/
        `);
    }

    async run() {
        this.showBanner();
        
        const command = process.argv[2];
        
        if (!command) {
            this.showMenu();
            return;
        }
        
        await this.executeCommand(command);
    }
}

// Run the master control
if (require.main === module) {
    const master = new TNFMasterControl();
    master.run().catch(console.error);
}

module.exports = TNFMasterControl;
