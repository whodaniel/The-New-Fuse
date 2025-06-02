#!/usr/bin/env node

/**
 * Enhanced TNF Agent Communication Relay v3.0 - Chrome Extension Integration
 * Supports AI-powered browser automation and element selection
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class EnhancedTNFRelay {
    constructor() {
        this.relayId = 'TNF-RELAY-ENHANCED-001';
        this.version = '3.0';
        this.isRunning = false;
        this.agents = new Map();
        this.chromeExtensions = new Map();
        this.aiSessions = new Map();
        this.workspaceDir = path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The New Fuse');
        this.webSocketServer = null;
        this.httpServer = null;
        this.port = 3000;
        this.wsPort = 3001;
    }
    
    async log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;
        console.log(logEntry);
        
        const logPath = path.join(this.workspaceDir, 'enhanced-relay.log');
        await fs.appendFile(logPath, logEntry + '\n');
    }
    
    async start() {
        try {
            await this.log('Starting Enhanced TNF Relay v3.0');
            
            // Start HTTP server
            await this.startHTTPServer();
            
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Initialize agent discovery
            await this.discoverAgents();
            
            this.isRunning = true;
            await this.log(`Enhanced TNF Relay started on HTTP:${this.port}, WS:${this.wsPort}`);
            
            return true;
        } catch (error) {
            await this.log(`Failed to start relay: ${error.message}`, 'ERROR');
            return false;
        }
    }
    
    async startHTTPServer() {
        this.httpServer = http.createServer(async (req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = new URL(req.url, `http://localhost:${this.port}`);
            await this.handleHTTPRequest(req, res, url);
        });
        
        return new Promise((resolve, reject) => {
            this.httpServer.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
    
    async startWebSocketServer() {
        this.webSocketServer = new WebSocket.Server({ port: this.wsPort });
        
        this.webSocketServer.on('connection', async (ws, req) => {
            const clientId = this.generateClientId();
            await this.log(`WebSocket client connected: ${clientId}`);
            
            ws.clientId = clientId;
            ws.isAlive = true;
            
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    await this.log(`WebSocket message error: ${error.message}`, 'ERROR');
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        error: error.message
                    }));
                }
            });
            
            ws.on('close', async () => {
                await this.log(`WebSocket client disconnected: ${clientId}`);
                this.chromeExtensions.delete(clientId);
                this.agents.delete(clientId);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'WELCOME',
                clientId: clientId,
                relayInfo: {
                    id: this.relayId,
                    version: this.version
                }
            }));
        });
        
        // Heartbeat to detect broken connections
        const interval = setInterval(() => {
            this.webSocketServer.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
        
        this.webSocketServer.on('close', () => {
            clearInterval(interval);
        });
    }
    
    async handleHTTPRequest(req, res, url) {
        try {
            switch (url.pathname) {
                case '/status':
                    await this.handleStatusRequest(req, res);
                    break;
                case '/agents':
                    await this.handleAgentsRequest(req, res);
                    break;
                case '/chrome-extensions':
                    await this.handleChromeExtensionsRequest(req, res);
                    break;
                case '/ai-sessions':
                    await this.handleAISessionsRequest(req, res);
                    break;
                case '/send-message':
                    await this.handleSendMessageRequest(req, res);
                    break;
                case '/element-mappings':
                    await this.handleElementMappingsRequest(req, res);
                    break;
                default:
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            await this.log(`HTTP request error: ${error.message}`, 'ERROR');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    async handleWebSocketMessage(ws, message) {
        await this.log(`Received message: ${message.type} from ${ws.clientId}`);
        
        switch (message.type) {
            case 'REGISTER':
                await this.handleRegistration(ws, message);
                break;
            case 'AI_AUTOMATION_REQUEST':
                await this.handleAIAutomationRequest(ws, message);
                break;
            case 'ELEMENT_INTERACTION_REQUEST':
                await this.handleElementInteractionRequest(ws, message);
                break;
            case 'PAGE_ANALYSIS_REQUEST':
                await this.handlePageAnalysisRequest(ws, message);
                break;
            case 'SESSION_CONTROL':
                await this.handleSessionControl(ws, message);
                break;
            case 'ELEMENT_MAPPING_UPDATE':
                await this.handleElementMappingUpdate(ws, message);
                break;
            case 'PAGE_CHANGED':
                await this.handlePageChanged(ws, message);
                break;
            case 'TAB_ACTIVATED':
                await this.handleTabActivated(ws, message);
                break;
            default:
                await this.log(`Unknown message type: ${message.type}`, 'WARN');
                ws.send(JSON.stringify({
                    type: 'ERROR',
                    error: `Unknown message type: ${message.type}`
                }));
        }
    }
    
    async handleRegistration(ws, message) {
        const { payload } = message;
        const clientInfo = {
            id: ws.clientId,
            type: payload.type,
            capabilities: payload.capabilities || [],
            registeredAt: new Date().toISOString(),
            ws: ws
        };
        
        if (payload.type === 'chrome_extension') {
            this.chromeExtensions.set(ws.clientId, clientInfo);
            await this.log(`Chrome extension registered: ${ws.clientId}`);
        } else {
            this.agents.set(ws.clientId, clientInfo);
            await this.log(`Agent registered: ${ws.clientId} (${payload.type})`);
        }
        
        ws.send(JSON.stringify({
            type: 'REGISTRATION_CONFIRMED',
            clientId: ws.clientId,
            capabilities: this.getRelayCapabilities()
        }));
    }
    
    async handleAIAutomationRequest(ws, message) {
        const { payload } = message;
        await this.log(`AI automation request: ${payload.action}`);
        
        // Route to appropriate chrome extension or agent
        const targetExtension = this.findBestChromeExtension(payload);
        
        if (targetExtension) {
            targetExtension.ws.send(JSON.stringify({
                type: 'AI_AUTOMATION_REQUEST',
                id: message.id,
                payload: payload
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'AI_AUTOMATION_RESPONSE',
                id: message.id,
                success: false,
                error: 'No suitable chrome extension available'
            }));
        }
    }
    
    async handleElementInteractionRequest(ws, message) {
        const { payload } = message;
        await this.log(`Element interaction request: ${payload.interactionType}`);
        
        const targetExtension = this.findBestChromeExtension(payload);
        
        if (targetExtension) {
            targetExtension.ws.send(JSON.stringify({
                type: 'ELEMENT_INTERACTION_REQUEST',
                id: message.id,
                payload: payload
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'ELEMENT_INTERACTION_RESPONSE',
                id: message.id,
                success: false,
                error: 'No suitable chrome extension available'
            }));
        }
    }
    
    async handlePageAnalysisRequest(ws, message) {
        const { payload } = message;
        await this.log(`Page analysis request: ${payload.analysisType}`);
        
        const targetExtension = this.findBestChromeExtension(payload);
        
        if (targetExtension) {
            targetExtension.ws.send(JSON.stringify({
                type: 'PAGE_ANALYSIS_REQUEST',
                id: message.id,
                payload: payload
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'PAGE_ANALYSIS_RESPONSE',
                id: message.id,
                success: false,
                error: 'No suitable chrome extension available'
            }));
        }
    }
    
    async handleSessionControl(ws, message) {
        const { payload } = message;
        const sessionId = `session_${Date.now()}`;
        
        switch (payload.command) {
            case 'start':
                this.aiSessions.set(sessionId, {
                    id: sessionId,
                    clientId: ws.clientId,
                    mapping: payload.parameters.mapping,
                    startedAt: new Date().toISOString(),
                    active: true
                });
                
                ws.send(JSON.stringify({
                    type: 'SESSION_CONTROL_RESPONSE',
                    sessionId: sessionId,
                    success: true,
                    sessionActive: true
                }));
                
                await this.log(`AI session started: ${sessionId}`);
                break;
                
            case 'stop':
                // Find and stop session
                for (const [id, session] of this.aiSessions) {
                    if (session.clientId === ws.clientId) {
                        session.active = false;
                        session.endedAt = new Date().toISOString();
                        
                        ws.send(JSON.stringify({
                            type: 'SESSION_CONTROL_RESPONSE',
                            sessionId: id,
                            success: true,
                            sessionActive: false
                        }));
                        
                        await this.log(`AI session stopped: ${id}`);
                        break;
                    }
                }
                break;
                
            case 'status':
                const activeSession = Array.from(this.aiSessions.values())
                    .find(session => session.clientId === ws.clientId && session.active);
                
                ws.send(JSON.stringify({
                    type: 'SESSION_CONTROL_RESPONSE',
                    success: true,
                    sessionActive: !!activeSession,
                    session: activeSession || null
                }));
                break;
        }
    }
    
    async handleElementMappingUpdate(ws, message) {
        const { payload } = message;
        await this.log(`Element mapping updated for tab ${payload.tabId}`);
        
        // Store mapping and broadcast to interested agents
        const mappingData = {
            tabId: payload.tabId,
            mapping: payload.mapping,
            updatedAt: new Date().toISOString(),
            source: ws.clientId
        };
        
        // Broadcast to AI agents that might be interested
        this.broadcastToAgents('ELEMENT_MAPPING_AVAILABLE', mappingData);
    }
    
    async handlePageChanged(ws, message) {
        const { payload } = message;
        await this.log(`Page changed: ${payload.url}`);
        
        // Notify agents about page change
        this.broadcastToAgents('PAGE_CHANGED', {
            tabId: payload.tabId,
            url: payload.url,
            title: payload.title,
            timestamp: new Date().toISOString()
        });
    }
    
    async handleTabActivated(ws, message) {
        const { payload } = message;
        await this.log(`Tab activated: ${payload.tabId}`);
        
        // Notify agents about tab activation
        this.broadcastToAgents('TAB_ACTIVATED', {
            tabId: payload.tabId,
            url: payload.url,
            title: payload.title,
            timestamp: new Date().toISOString()
        });
    }
    
    async handleStatusRequest(req, res) {
        const status = {
            relayId: this.relayId,
            version: this.version,
            isRunning: this.isRunning,
            uptime: process.uptime(),
            stats: {
                agents: this.agents.size,
                chromeExtensions: this.chromeExtensions.size,
                aiSessions: this.aiSessions.size,
                wsConnections: this.webSocketServer ? this.webSocketServer.clients.size : 0
            },
            capabilities: this.getRelayCapabilities()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    async handleAgentsRequest(req, res) {
        const agents = Array.from(this.agents.values()).map(agent => ({
            id: agent.id,
            type: agent.type,
            capabilities: agent.capabilities,
            registeredAt: agent.registeredAt
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ agents }, null, 2));
    }
    
    async handleChromeExtensionsRequest(req, res) {
        const extensions = Array.from(this.chromeExtensions.values()).map(ext => ({
            id: ext.id,
            type: ext.type,
            capabilities: ext.capabilities,
            registeredAt: ext.registeredAt
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ chromeExtensions: extensions }, null, 2));
    }
    
    async handleAISessionsRequest(req, res) {
        const sessions = Array.from(this.aiSessions.values()).map(session => ({
            id: session.id,
            clientId: session.clientId,
            active: session.active,
            startedAt: session.startedAt,
            endedAt: session.endedAt || null,
            hasMappings: !!session.mapping
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ aiSessions: sessions }, null, 2));
    }
    
    async handleSendMessageRequest(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const { targetId, messageType, payload } = JSON.parse(body);
                
                const result = await this.sendMessage(targetId, messageType, payload);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async handleElementMappingsRequest(req, res) {
        // Return available element mappings
        const mappings = {};
        
        // Extract mappings from active sessions
        for (const [sessionId, session] of this.aiSessions) {
            if (session.mapping) {
                mappings[sessionId] = {
                    domain: session.mapping.domain,
                    url: session.mapping.url,
                    hasInput: !!session.mapping.chatInput,
                    hasButton: !!session.mapping.sendButton,
                    hasOutput: !!session.mapping.chatOutput,
                    timestamp: session.mapping.timestamp
                };
            }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ elementMappings: mappings }, null, 2));
    }
    
    findBestChromeExtension(criteria) {
        // Find the most suitable chrome extension for the request
        for (const extension of this.chromeExtensions.values()) {
            if (extension.capabilities.includes('element_selection') || 
                extension.capabilities.includes('ai_automation')) {
                return extension;
            }
        }
        
        // Return first available extension as fallback
        return this.chromeExtensions.values().next().value || null;
    }
    
    broadcastToAgents(messageType, payload) {
        const message = JSON.stringify({
            type: messageType,
            payload: payload,
            timestamp: new Date().toISOString(),
            source: this.relayId
        });
        
        this.agents.forEach(agent => {
            if (agent.ws.readyState === WebSocket.OPEN) {
                agent.ws.send(message);
            }
        });
    }
    
    async sendMessage(targetId, messageType, payload) {
        const message = {
            id: `MSG_${Date.now()}`,
            type: messageType,
            source: this.relayId,
            target: targetId,
            payload: payload,
            timestamp: new Date().toISOString()
        };
        
        await this.log(`Sending message ${message.id} to ${targetId}: ${messageType}`);
        
        // Find target
        const target = this.agents.get(targetId) || this.chromeExtensions.get(targetId);
        
        if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify(message));
            return { status: 'sent', messageId: message.id };
        } else {
            throw new Error(`Target ${targetId} not found or not connected`);
        }
    }
    
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getRelayCapabilities() {
        return [
            'agent_discovery',
            'message_routing',
            'ai_automation',
            'element_selection',
            'page_analysis',
            'session_management',
            'chrome_extension_bridge'
        ];
    }
    
    async discoverAgents() {
        await this.log('🔍 Discovering agents...');
        const agents = [];
        
        // Check MCP processes
        try {
            const processes = execSync('ps aux | grep -E "(mcp|applescript|browser)" | grep -v grep').toString();
            const lines = processes.split('\n').filter(line => line.trim());
            
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
            await this.log('Process scan failed: ' + error.message, 'WARN');
        }
        
        await this.log(`Discovered ${agents.length} system agents`, 'DISCOVERY');
        return agents;
    }
    
    getStatus() {
        return {
            relayId: this.relayId,
            version: this.version,
            isRunning: this.isRunning,
            agents: this.agents.size,
            chromeExtensions: this.chromeExtensions.size,
            aiSessions: this.aiSessions.size,
            capabilities: this.getRelayCapabilities()
        };
    }
    
    async stop() {
        this.isRunning = false;
        
        if (this.webSocketServer) {
            this.webSocketServer.close();
        }
        
        if (this.httpServer) {
            this.httpServer.close();
        }
        
        await this.log('Enhanced TNF Relay stopped');
    }
}

// CLI Interface
if (require.main === module) {
    const relay = new EnhancedTNFRelay();
    const command = process.argv[2];
    
    (async () => {
        switch (command) {
            case 'start':
                const success = await relay.start();
                if (success) {
                    console.log('\n🚀 Enhanced TNF Relay v3.0 is running!');
                    console.log(`📊 HTTP API: http://localhost:${relay.port}`);
                    console.log(`🔌 WebSocket: ws://localhost:${relay.wsPort}`);
                    console.log('\n📋 Available endpoints:');
                    console.log('  GET  /status           - Relay status');
                    console.log('  GET  /agents           - Connected agents');
                    console.log('  GET  /chrome-extensions - Chrome extensions');
                    console.log('  GET  /ai-sessions      - Active AI sessions');
                    console.log('  POST /send-message     - Send message to agent');
                    console.log('  GET  /element-mappings - Element mappings');
                    console.log('\nPress Ctrl+C to stop...');
                    
                    // Handle graceful shutdown
                    process.on('SIGINT', async () => {
                        console.log('\n🛑 Shutting down Enhanced TNF Relay...');
                        await relay.stop();
                        process.exit(0);
                    });
                    
                    // Keep the process running
                    await new Promise(() => {});
                } else {
                    console.error('❌ Failed to start Enhanced TNF Relay');
                    process.exit(1);
                }
                break;
                
            case 'discover':
                const agents = await relay.discoverAgents();
                console.log('\n🤖 Discovered Agents:');
                agents.forEach(agent => {
                    console.log(`  • ${agent.name} (${agent.id}) - ${agent.status}`);
                });
                break;
                
            case 'status':
                const status = relay.getStatus();
                console.log('\n📊 Enhanced TNF Relay Status:');
                console.log(`  Relay ID: ${status.relayId}`);
                console.log(`  Version: ${status.version}`);
                console.log(`  Running: ${status.isRunning}`);
                console.log(`  Agents: ${status.agents}`);
                console.log(`  Chrome Extensions: ${status.chromeExtensions}`);
                console.log(`  AI Sessions: ${status.aiSessions}`);
                console.log('\n  Capabilities:');
                status.capabilities.forEach(cap => {
                    console.log(`    • ${cap}`);
                });
                break;
                
            default:
                console.log(`
🚀 Enhanced TNF Agent Communication Relay v3.0

Usage:
  node enhanced-tnf-relay.js start     # Start the relay server
  node enhanced-tnf-relay.js discover  # Find available agents
  node enhanced-tnf-relay.js status    # Show system status

Features:
  ✨ AI-powered browser automation
  🎯 Element selection and interaction
  🔗 Chrome extension bridge
  📊 Real-time agent communication
  🎮 Session management
  📡 WebSocket & HTTP APIs
                `);
        }
    })().catch(console.error);
}

module.exports = EnhancedTNFRelay;
