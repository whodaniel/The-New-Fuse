#!/usr/bin/env node

/**
 * TNF Agent Communication Relay v2.1 - Fixed Node.js Implementation
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class TNFAgentRelay {
    constructor() {
        this.relayId = 'TNF-RELAY-001';
        this.version = '2.1';
        this.agents = new Map();
        this.workspaceDir = path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The New Fuse');
    }
    
    async log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;
        console.log(logEntry);
        
        const logPath = path.join(this.workspaceDir, 'relay-nodejs.log');
        try {
            await fs.appendFile(logPath, logEntry + '\n');
        } catch (error) {
            console.log('Log write error:', error.message);
        }
    }
    
    async discoverAgents() {
        console.log('🔍 Discovering MCP agents...');
        await this.log('Starting agent discovery', 'DISCOVERY');
        
        const agents = [];
        
        // Check for running MCP processes
        try {
            const stdout = execSync('ps aux | grep -E "(applescript-mcp|browsermcp)" | grep -v grep', { encoding: 'utf8' });
            const lines = stdout.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                const parts = line.split(/\s+/);
                if (parts.length > 10) {
                    const pid = parts[1];
                    const command = parts.slice(10).join(' ');
                    
                    if (command.includes('applescript-mcp')) {
                        agents.push({
                            id: `applescript-mcp-${pid}`,
                            name: 'AppleScript MCP Agent',
                            type: 'APPLESCRIPT_MCP',
                            pid: parseInt(pid),
                            status: 'running'
                        });
                    }
                    
                    if (command.includes('browsermcp')) {
                        agents.push({
                            id: `browser-mcp-${pid}`,
                            name: 'Browser MCP Agent',
                            type: 'BROWSER_MCP', 
                            pid: parseInt(pid),
                            status: 'running'
                        });
                    }
                }
            }
        } catch (error) {
            await this.log(`Process scan failed: ${error.message}`, 'WARN');
        }
        
        // Check MCP configuration files
        const homeDir = process.env.HOME;
        const configs = [
            { path: `${homeDir}/Library/Application Support/Claude/claude_desktop_config.json`, type: 'CLAUDE_MCP' },
            { path: `${homeDir}/Library/Application Support/Code/User/mcp_config.json`, type: 'VSCODE_MCP' },
            { path: `${homeDir}/Library/Application Support/GitHub Copilot/mcp_config.json`, type: 'COPILOT_MCP' }
        ];
        
        for (const config of configs) {
            try {
                await fs.access(config.path);
                agents.push({
                    id: config.type.toLowerCase(),
                    name: config.type.replace('_', ' ') + ' Agent',
                    type: config.type,
                    status: 'configured',
                    configPath: config.path
                });
            } catch (error) {
                // Config file doesn't exist - that's ok
            }
        }
        
        // Store discovered agents
        agents.forEach(agent => this.agents.set(agent.id, agent));
        
        await this.log(`Discovered ${agents.length} agents`, 'DISCOVERY');
        return agents;
    }
    
    async sendTestMessage(targetId, content) {
        const message = {
            id: `MSG_${Date.now()}`,
            type: 'TEST_MESSAGE',
            source: this.relayId,
            target: targetId,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        await this.log(`Sending test message ${message.id} to ${targetId}`, 'COMMUNICATION');
        
        // Log the message (in production this would route to actual agent)
        const messagePath = path.join(this.workspaceDir, 'messages-nodejs.log');
        await fs.appendFile(messagePath, JSON.stringify(message, null, 2) + '\n');
        
        return { status: 'sent', messageId: message.id };
    }
    
    getStatus() {
        return {
            relayId: this.relayId,
            version: this.version,
            agentCount: this.agents.size,
            agents: Array.from(this.agents.values())
        };
    }
}

// CLI Interface
if (require.main === module) {
    const relay = new TNFAgentRelay();
    const command = process.argv[2];
    
    (async () => {
        try {
            switch (command) {
                case 'discover':
                    const agents = await relay.discoverAgents();
                    console.log('\n🤖 Discovered Agents:');
                    agents.forEach(agent => {
                        console.log(`  • ${agent.name} (${agent.id}) - ${agent.status}`);
                    });
                    break;
                    
                case 'test':
                    await relay.discoverAgents();
                    const testMessage = process.argv[3] || 'Test from Node.js TNF Relay';
                    
                    if (relay.agents.size > 0) {
                        const firstAgent = relay.agents.values().next().value;
                        console.log(`📡 Sending test message to ${firstAgent.name}...`);
                        
                        const result = await relay.sendTestMessage(firstAgent.id, {
                            action: 'test',
                            message: testMessage
                        });
                        
                        console.log('✅ Message sent:', result);
                    } else {
                        console.log('⚠️ No agents found for testing');
                    }
                    break;
                    
                case 'status':
                    await relay.discoverAgents();
                    const status = relay.getStatus();
                    console.log('\n📊 TNF Agent Relay Status:');
                    console.log(`  Relay ID: ${status.relayId}`);
                    console.log(`  Version: ${status.version}`);
                    console.log(`  Agents: ${status.agentCount}`);
                    
                    if (status.agents.length > 0) {
                        console.log('\n  Discovered Agents:');
                        status.agents.forEach(agent => {
                            console.log(`    • ${agent.name} (${agent.type}) - ${agent.status}`);
                        });
                    }
                    break;
                    
                default:
                    console.log('');
                    console.log('🚀 TNF Agent Communication Relay v2.1 - Node.js (Fixed)');
                    console.log('');
                    console.log('Usage:');
                    console.log('  node tnf-relay-fixed.js discover  # Find available agents'); 
                    console.log('  node tnf-relay-fixed.js test      # Send test message');
                    console.log('  node tnf-relay-fixed.js status    # Show system status');
                    console.log('');
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = TNFAgentRelay;
