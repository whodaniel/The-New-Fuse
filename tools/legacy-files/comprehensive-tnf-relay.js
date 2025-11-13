#!/usr/bin/env node
/**
 * Comprehensive TNF Relay v4.0
 * Complete API interception and management system
 */

const http = require('http');
const https = require('https');
const net = require('net');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const express = require('express');

// MCP Support
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class ComprehensiveTNFRelay {
    constructor() {
        this.relayId = 'TNF-RELAY-COMPREHENSIVE-001';
        this.version = '4.0';
        this.isRunning = false;
        
        this.ports = {
            http: 3000,
            websocket: 3001,
            proxy: 8888,
            ui: 3002
        };
        
        this.httpServer = null;
        this.webSocketServer = null;
        this.proxyServer = null;
        this.uiServer = null;
        this.mcpServer = null;
        
        this.agents = new Map();
        this.chromeExtensions = new Map();
        this.interceptedMessages = [];
        this.interceptRules = new Map();
        this.systemStatus = {
            startTime: null,
            interceptCount: 0,
            activeConnections: 0
        };
        
        this.workspaceDir = path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The New Fuse');
        this.logPath = path.join(this.workspaceDir, 'comprehensive-relay.log');
        
        this.setupInterceptRules();
        this.setupMCPServer();
    }

    setupInterceptRules() {
        this.interceptRules.set('api.anthropic.com', {
            action: 'intercept_and_route',
            description: 'Claude API calls',
            enabled: true,
            target: 'claude_desktop'
        });
        
        this.interceptRules.set('api.githubcopilot.com', {
            action: 'intercept_and_route',
            description: 'GitHub Copilot API calls',
            enabled: true,
            target: 'claude_desktop'
        });
        
        this.interceptRules.set('api.openai.com', {
            action: 'intercept_and_route',
            description: 'OpenAI API calls',
            enabled: true,
            target: 'claude_desktop'
        });

        this.interceptRules.set('api.gemini.com', {
            action: 'intercept_and_route',
            description: 'Gemini API calls',
            enabled: true,
            target: 'gemini'
        });
    }

    setupMCPServer() {
        this.mcpServer = new Server(
            {
                name: "tnf-relay",
                version: this.version,
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                },
            }
        );

        // List available tools
        this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "relay_status",
                        description: "Get current relay system status and statistics",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "send_message",
                        description: "Send message to connected agent or extension",
                        inputSchema: {
                            type: "object",
                            properties: {
                                target: {
                                    type: "string",
                                    description: "Target agent ID or 'all' for broadcast"
                                },
                                message: {
                                    type: "object",
                                    description: "Message content to send"
                                }
                            },
                            required: ["target", "message"]
                        }
                    },
                    {
                        name: "add_intercept_rule",
                        description: "Add new API interception rule",
                        inputSchema: {
                            type: "object",
                            properties: {
                                hostname: {
                                    type: "string",
                                    description: "Hostname to intercept"
                                },
                                action: {
                                    type: "string",
                                    enum: ["intercept_and_route", "log_only", "block"],
                                    description: "Action to take"
                                },
                                target: {
                                    type: "string",
                                    description: "Target for routing",
                                    default: "claude_desktop"
                                }
                            },
                            required: ["hostname", "action"]
                        }
                    },
                    {
                        name: "get_intercepted_messages",
                        description: "Retrieve recent intercepted messages",
                        inputSchema: {
                            type: "object",
                            properties: {
                                limit: {
                                    type: "number",
                                    description: "Number of messages to retrieve",
                                    default: 10
                                }
                            }
                        }
                    },
                    {
                        name: "register_agent",
                        description: "Register new agent with the relay",
                        inputSchema: {
                            type: "object",
                            properties: {
                                agent_id: {
                                    type: "string",
                                    description: "Unique agent identifier"
                                },
                                agent_type: {
                                    type: "string",
                                    description: "Type of agent"
                                },
                                capabilities: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "Agent capabilities"
                                }
                            },
                            required: ["agent_id", "agent_type"]
                        }
                    }
                ]
            };
        });

        // List available resources
        this.mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
            return {
                resources: [
                    {
                        uri: "relay://status",
                        name: "Relay Status",
                        description: "Current relay system status and metrics",
                        mimeType: "application/json"
                    },
                    {
                        uri: "relay://agents",
                        name: "Connected Agents",
                        description: "List of all connected agents",
                        mimeType: "application/json"
                    },
                    {
                        uri: "relay://messages",
                        name: "Intercepted Messages",
                        description: "Recent intercepted API messages",
                        mimeType: "application/json"
                    },
                    {
                        uri: "relay://rules",
                        name: "Intercept Rules",
                        description: "Current API interception rules",
                        mimeType: "application/json"
                    },
                    {
                        uri: "relay://logs",
                        name: "Relay Logs",
                        description: "Recent relay system logs",
                        mimeType: "text/plain"
                    }
                ]
            };
        });

        // Handle tool calls
        this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case "relay_status":
                        return await this.handleMCPRelayStatus();
                    case "send_message":
                        return await this.handleMCPSendMessage(args);
                    case "add_intercept_rule":
                        return await this.handleMCPAddInterceptRule(args);
                    case "get_intercepted_messages":
                        return await this.handleMCPGetInterceptedMessages(args);
                    case "register_agent":
                        return await this.handleMCPRegisterAgent(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error executing ${name}: ${error.message}`
                        }
                    ],
                    isError: true
                };
            }
        });

        // Handle resource reads
        this.mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const uri = request.params.uri;
            
            try {
                switch (uri) {
                    case "relay://status":
                        return await this.getMCPStatusResource();
                    case "relay://agents":
                        return await this.getMCPAgentsResource();
                    case "relay://messages":
                        return await this.getMCPMessagesResource();
                    case "relay://rules":
                        return await this.getMCPRulesResource();
                    case "relay://logs":
                        return await this.getMCPLogsResource();
                    default:
                        throw new Error(`Unknown resource: ${uri}`);
                }
            } catch (error) {
                throw new Error(`Error reading resource ${uri}: ${error.message}`);
            }
        });
    }

    async log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;
        
        console.log(logEntry.trim());
        
        try {
            await fs.appendFile(this.logPath, logEntry);
        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    async start() {
        try {
            this.systemStatus.startTime = new Date().toISOString();
            await this.log('Starting Comprehensive TNF Relay v4.0');
            
            // Check if we're in MCP mode
            const mcpMode = await this.startMCPServer();
            
            if (!mcpMode) {
                // Normal HTTP/WebSocket/Proxy mode
                await this.startHTTPServer();
                await this.startWebSocketServer();
                await this.startProxyServer();
                await this.startUIServer();
                
                this.isRunning = true;
                await this.log(`TNF Relay started on ports: HTTP:${this.ports.http}, WS:${this.ports.websocket}, Proxy:${this.ports.proxy}, UI:${this.ports.ui}`);
            } else {
                // MCP mode - just run the MCP server
                this.isRunning = true;
                await this.log('TNF Relay started in MCP mode');
            }
            
            return true;
        } catch (error) {
            await this.log(`Failed to start relay: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async startHTTPServer() {
        const app = express();
        app.use(express.json());
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });

        app.get('/status', (req, res) => {
            res.json({
                relayId: this.relayId,
                version: this.version,
                isRunning: this.isRunning,
                systemStatus: this.systemStatus,
                stats: {
                    agents: this.agents.size,
                    chromeExtensions: this.chromeExtensions.size,
                    interceptedMessages: this.interceptedMessages.length,
                    activeConnections: this.systemStatus.activeConnections
                },
                ports: this.ports
            });
        });

        // Add health endpoint for consistency
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                port: this.ports.http,
                version: this.version,
                timestamp: new Date().toISOString(),
                relay: this.relayId
            });
        });

        app.get('/agents', (req, res) => {
            res.json({ agents: Array.from(this.agents.values()) });
        });

        app.get('/intercept-rules', (req, res) => {
            res.json({ rules: Array.from(this.interceptRules.entries()) });
        });

        app.post('/intercept-rules', (req, res) => {
            const { hostname, action, description, enabled = true, target = 'claude_desktop' } = req.body;
            this.interceptRules.set(hostname, { action, description, enabled, target });
            res.json({ success: true, message: 'Intercept rule added' });
        });

        app.get('/intercepted-messages', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            res.json({ 
                messages: this.interceptedMessages.slice(-limit),
                total: this.interceptedMessages.length
            });
        });

        app.post('/setup/claude-code-env', async (req, res) => {
            try {
                await this.setupLLMCodeEnvironment('Claude', 'claude');
                res.json({ success: true, message: 'Claude Code environment configured' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/setup/gemini-code-env', async (req, res) => {
            try {
                await this.setupLLMCodeEnvironment('Gemini', 'gemini');
                res.json({ success: true, message: 'Gemini Code environment configured' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/dashboard', (req, res) => {
            res.json({
                systemStatus: this.systemStatus,
                stats: {
                    agents: this.agents.size,
                    chromeExtensions: this.chromeExtensions.size,
                    interceptedMessages: this.interceptedMessages.length,
                    activeConnections: this.systemStatus.activeConnections
                },
                recentMessages: this.interceptedMessages.slice(-10),
                interceptRules: Array.from(this.interceptRules.entries())
            });
        });

        return new Promise((resolve, reject) => {
            this.httpServer = app.listen(this.ports.http, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    async startWebSocketServer() {
        this.webSocketServer = new WebSocket.Server({ port: this.ports.websocket });
        
        this.webSocketServer.on('connection', async (ws, req) => {
            const clientId = this.generateClientId();
            ws.clientId = clientId;
            ws.isAlive = true;
            
            this.systemStatus.activeConnections++;
            await this.log(`WebSocket client connected: ${clientId}`);
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    await this.log(`WebSocket message error: ${error.message}`, 'ERROR');
                }
            });
            
            ws.on('close', async () => {
                this.systemStatus.activeConnections--;
                await this.log(`WebSocket client disconnected: ${clientId}`);
                this.agents.delete(clientId);
                this.chromeExtensions.delete(clientId);
            });
            
            ws.send(JSON.stringify({
                type: 'WELCOME',
                clientId: clientId,
                relayInfo: {
                    id: this.relayId,
                    version: this.version
                }
            }));
        });
    }

    async startProxyServer() {
        const server = http.createServer();
        
        server.on('request', (req, res) => {
            this.handleProxyHTTPRequest(req, res);
        });

        server.on('connect', (req, socket, head) => {
            this.handleProxyHTTPSConnect(req, socket, head);
        });

        return new Promise((resolve, reject) => {
            this.proxyServer = server.listen(this.ports.proxy, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    async startUIServer() {
        const app = express();
        
        // Add CORS headers for UI server
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // Health endpoint for UI server
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                port: this.ports.ui,
                service: 'TNF UI Server',
                timestamp: new Date().toISOString()
            });
        });
        
        app.use(express.static(path.join(__dirname, 'ui-build')));
        
        app.get('*', (req, res) => {
            // Don't serve HTML for health endpoint
            if (req.path === '/health') return;
            res.sendFile(path.join(__dirname, 'ui-build', 'index.html'));
        });

        return new Promise((resolve, reject) => {
            this.uiServer = app.listen(this.ports.ui, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    async handleProxyHTTPRequest(req, res) {
        const requestUrl = url.parse(req.url);
        const hostname = requestUrl.hostname || req.headers.host;
        
        await this.log(`HTTP Request: ${req.method} ${hostname}${requestUrl.path}`);

        if (this.shouldIntercept(hostname)) {
            await this.interceptHTTPRequest(req, res, requestUrl);
        } else {
            await this.forwardHTTPRequest(req, res, requestUrl);
        }
    }

    shouldIntercept(hostname) {
        for (const [rule, config] of this.interceptRules) {
            if (config.enabled && hostname.includes(rule)) {
                return true;
            }
        }
        return false;
    }

    getInterceptRule(url) {
        const hostname = new URL(url).hostname;
        for (const [rule, config] of this.interceptRules) {
            if (config.enabled && hostname.includes(rule)) {
                return config;
            }
        }
        return null;
    }

    async interceptHTTPRequest(req, res, requestUrl) {
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                const interceptData = {
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    body: body,
                    timestamp: new Date().toISOString(),
                    source: 'http_proxy'
                };

                await this.processInterceptedRequest(interceptData);
                this.systemStatus.interceptCount++;

                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });

                res.end(JSON.stringify({
                    message: 'Request intercepted and routed via TNF Relay',
                    intercepted: true,
                    relayId: this.relayId,
                    timestamp: new Date().toISOString()
                }));
            });

        } catch (error) {
            await this.log(`Error intercepting HTTP request: ${error.message}`, 'ERROR');
            res.writeHead(500);
            res.end('Intercept error');
        }
    }

    async processInterceptedRequest(interceptData) {
        try {
            const messageEntry = {
                id: `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...interceptData,
                processedAt: new Date().toISOString()
            };

            this.interceptedMessages.push(messageEntry);

            const rule = this.getInterceptRule(interceptData.url);
            if (rule && rule.target === 'gemini') {
                const geminiMessage = await this.formatForClaudeDesktop(interceptData); // Using same format for now
                await this.routeToGemini(geminiMessage, interceptData);
            } else {
                const claudeMessage = await this.formatForClaudeDesktop(interceptData);
                await this.routeToClaudeDesktop(claudeMessage, interceptData);
            }

            await this.log(`Processed intercepted request: ${messageEntry.id}`);

        } catch (error) {
            await this.log(`Error processing intercepted request: ${error.message}`, 'ERROR');
        }
    }

    async formatForClaudeDesktop(interceptData) {
        let claudeMessage = `🔍 **API Call Intercepted**\n\n`;
        claudeMessage += `**Endpoint:** ${interceptData.url}\n`;
        claudeMessage += `**Method:** ${interceptData.method}\n`;
        claudeMessage += `**Time:** ${new Date(interceptData.timestamp).toLocaleString()}\n\n`;

        if (interceptData.body) {
            try {
                const bodyJson = JSON.parse(interceptData.body);
                
                if (bodyJson.messages) {
                    claudeMessage += `**Conversation:**\n`;
                    bodyJson.messages.forEach((msg, index) => {
                        claudeMessage += `${index + 1}. **${msg.role.toUpperCase()}:** ${msg.content}\n\n`;
                    });
                } else if (bodyJson.prompt) {
                    claudeMessage += `**Prompt:** ${bodyJson.prompt}\n\n`;
                } else {
                    claudeMessage += `**Request Data:**\n\`\`\`json\n${JSON.stringify(bodyJson, null, 2)}\n\`\`\`\n\n`;
                }
            } catch (error) {
                claudeMessage += `**Raw Request:**\n\`\`\`\n${interceptData.body}\n\`\`\`\n\n`;
            }
        }

        claudeMessage += `---\n*Intercepted via TNF Relay v${this.version}*`;
        return claudeMessage;
    }

    async routeToClaudeDesktop(claudeMessage, interceptData) {
        try {
            const claudeSocket = new WebSocket('ws://localhost:3712');

            claudeSocket.on('open', () => {
                const message = {
                    type: 'API_INTERCEPT',
                    payload: {
                        claudeMessage,
                        interceptData
                    }
                };
                claudeSocket.send(JSON.stringify(message));
                this.log('Message sent to Claude MCP Server');
                claudeSocket.close();
            });

            claudeSocket.on('error', (error) => {
                this.log(`Error connecting to Claude MCP Server: ${error.message}`, 'ERROR');
            });

        } catch (error) {
            await this.log(`Error routing to Claude MCP Server: ${error.message}`, 'ERROR');
        }
    }

    async routeToGemini(geminiMessage, interceptData) {
        try {
            const geminiSocket = new WebSocket('ws://localhost:3713');

            geminiSocket.on('open', () => {
                const message = {
                    type: 'API_INTERCEPT',
                    payload: {
                        geminiMessage,
                        interceptData
                    }
                };
                geminiSocket.send(JSON.stringify(message));
                this.log('Message sent to Gemini MCP Server');
                geminiSocket.close();
            });

            geminiSocket.on('error', (error) => {
                this.log(`Error connecting to Gemini MCP Server: ${error.message}`, 'ERROR');
            });

        } catch (error) {
            await this.log(`Error routing to Gemini MCP Server: ${error.message}`, 'ERROR');
        }
    }

    async setupLLMCodeEnvironment(llmName, commandName) {
        try {
            const envScript = `#!/bin/bash
export HTTP_PROXY="http://localhost:${this.ports.proxy}"
export HTTPS_PROXY="http://localhost:${this.ports.proxy}"
export http_proxy="$HTTP_PROXY"
export https_proxy="$HTTPS_PROXY"
export NODE_TLS_REJECT_UNAUTHORIZED=0
export TNF_INTERCEPT_ACTIVE=1

${commandName}_with_tnf() {
    echo "[$(date)] ${llmName} Code: $*" >> "${this.workspaceDir}/${llmName.toLowerCase()}-code-activity.log"
    command ${commandName} "$@"
}

alias ${commandName}='${commandName}_with_tnf'
alias ${commandName}-original='command ${commandName}'

echo "🔧 TNF ${llmName} Code environment loaded"
echo "💡 Proxy: $HTTP_PROXY"
`;

            const envPath = path.join(process.env.HOME, `.tnf-${llmName.toLowerCase()}-env`);
            await fs.writeFile(envPath, envScript);
            
            await this.log(`Created ${llmName} Code environment script: ${envPath}`);
            return envPath;

        } catch (error) {
            await this.log(`Error setting up ${llmName} Code environment: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'REGISTER':
                await this.handleRegistration(ws, message);
                break;
            case 'API_INTERCEPT_NOTIFICATION':
                await this.handleAPIIntercept(ws, message);
                break;
            default:
                await this.log(`Unknown message type: ${message.type}`, 'WARN');
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
            clientId: ws.clientId
        }));
    }

    async handleAPIIntercept(ws, message) {
        try {
            const { content } = message;
            const interceptData = content.original_request || content.request_data;
            
            await this.log(`API Intercept received: ${interceptData.method} ${interceptData.url}`);
            await this.processInterceptedRequest(interceptData);
            
        } catch (error) {
            await this.log(`Error handling API intercept: ${error.message}`, 'ERROR');
        }
    }

    async forwardHTTPRequest(req, res, requestUrl) {
        try {
            const options = {
                hostname: requestUrl.hostname,
                port: requestUrl.port || (requestUrl.protocol === 'https:' ? 443 : 80),
                path: requestUrl.path,
                method: req.method,
                headers: req.headers
            };

            const protocol = requestUrl.protocol === 'https:' ? https : http;
            
            const proxyReq = protocol.request(options, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (error) => {
                this.log(`Proxy request error: ${error.message}`, 'ERROR');
                res.writeHead(500);
                res.end('Proxy error');
            });

            req.pipe(proxyReq);

        } catch (error) {
            await this.log(`Error forwarding HTTP request: ${error.message}`, 'ERROR');
            res.writeHead(500);
            res.end('Forward error');
        }
    }

    async handleProxyHTTPSConnect(req, socket, head) {
        const [hostname, port] = req.url.split(':');
        
        await this.log(`HTTPS CONNECT: ${hostname}:${port}`);
        await this.forwardHTTPSConnect(req, socket, head, hostname, port);
    }

    async forwardHTTPSConnect(req, socket, head, hostname, port) {
        const targetSocket = net.connect(port, hostname, () => {
            socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            targetSocket.write(head);
            socket.pipe(targetSocket);
            targetSocket.pipe(socket);
        });

        targetSocket.on('error', (error) => {
            this.log(`HTTPS forward error: ${error.message}`, 'ERROR');
            socket.destroy();
        });
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async stop() {
        this.isRunning = false;
        
        if (this.webSocketServer) this.webSocketServer.close();
        if (this.httpServer) this.httpServer.close();
        if (this.proxyServer) this.proxyServer.close();
        if (this.uiServer) this.uiServer.close();
        
        await this.log('TNF Relay stopped');
    }

    getStatus() {
        return {
            relayId: this.relayId,
            version: this.version,
            isRunning: this.isRunning,
            systemStatus: this.systemStatus,
            ports: this.ports,
            stats: {
                agents: this.agents.size,
                chromeExtensions: this.chromeExtensions.size,
                interceptedMessages: this.interceptedMessages.length,
                activeConnections: this.systemStatus.activeConnections
            }
        };
    }

    // MCP Tool Handlers
    async handleMCPRelayStatus() {
        const status = this.getStatus();
        return {
            content: [
                {
                    type: "text",
                    text: `📊 TNF Relay Status:\n\n${JSON.stringify(status, null, 2)}`
                }
            ]
        };
    }

    async handleMCPSendMessage(args) {
        const { target, message } = args;
        
        try {
            if (target === 'all') {
                // Broadcast to all connected agents
                let sent = 0;
                for (const [id, agent] of this.agents.entries()) {
                    if (agent.ws && agent.ws.readyState === WebSocket.OPEN) {
                        agent.ws.send(JSON.stringify({
                            type: 'MCP_MESSAGE',
                            payload: message,
                            from: 'mcp_client'
                        }));
                        sent++;
                    }
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Broadcast message sent to ${sent} agents`
                        }
                    ]
                };
            } else {
                // Send to specific target
                const agent = this.agents.get(target) || this.chromeExtensions.get(target);
                if (agent && agent.ws && agent.ws.readyState === WebSocket.OPEN) {
                    agent.ws.send(JSON.stringify({
                        type: 'MCP_MESSAGE',
                        payload: message,
                        from: 'mcp_client'
                    }));
                    return {
                        content: [
                            {
                                type: "text",
                                text: `✅ Message sent to ${target}`
                            }
                        ]
                    };
                } else {
                    throw new Error(`Agent ${target} not found or not connected`);
                }
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Error sending message: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    async handleMCPAddInterceptRule(args) {
        const { hostname, action, target = 'claude_desktop' } = args;
        
        this.interceptRules.set(hostname, {
            action,
            description: `MCP rule for ${hostname}`,
            enabled: true,
            target
        });

        await this.log(`MCP: Added intercept rule for ${hostname} -> ${action} (target: ${target})`);

        return {
            content: [
                {
                    type: "text",
                    text: `✅ Added intercept rule: ${hostname} -> ${action} (target: ${target})`
                }
            ]
        };
    }

    async handleMCPGetInterceptedMessages(args) {
        const { limit = 10 } = args;
        const recentMessages = this.interceptedMessages.slice(-limit);

        return {
            content: [
                {
                    type: "text",
                    text: `📨 Last ${recentMessages.length} intercepted messages:\n\n${JSON.stringify(recentMessages, null, 2)}`
                }
            ]
        };
    }

    async handleMCPRegisterAgent(args) {
        const { agent_id, agent_type, capabilities = [] } = args;

        const agentInfo = {
            id: agent_id,
            type: agent_type,
            capabilities,
            registeredAt: new Date().toISOString(),
            source: 'mcp_registration'
        };

        this.agents.set(agent_id, agentInfo);
        await this.log(`MCP: Registered agent ${agent_id} (${agent_type})`);

        return {
            content: [
                {
                    type: "text",
                    text: `✅ Registered agent: ${agent_id} (${agent_type})\nCapabilities: ${capabilities.join(', ')}`
                }
            ]
        };
    }

    // MCP Resource Handlers
    async getMCPStatusResource() {
        const status = this.getStatus();
        return {
            contents: [
                {
                    uri: "relay://status",
                    mimeType: "application/json",
                    text: JSON.stringify(status, null, 2)
                }
            ]
        };
    }

    async getMCPAgentsResource() {
        const agents = Array.from(this.agents.values());
        const extensions = Array.from(this.chromeExtensions.values());
        const data = {
            agents,
            chromeExtensions: extensions,
            total: agents.length + extensions.length
        };

        return {
            contents: [
                {
                    uri: "relay://agents",
                    mimeType: "application/json",
                    text: JSON.stringify(data, null, 2)
                }
            ]
        };
    }

    async getMCPMessagesResource() {
        const data = {
            messages: this.interceptedMessages,
            total: this.interceptedMessages.length,
            latest: this.interceptedMessages.slice(-10)
        };

        return {
            contents: [
                {
                    uri: "relay://messages",
                    mimeType: "application/json",
                    text: JSON.stringify(data, null, 2)
                }
            ]
        };
    }

    async getMCPRulesResource() {
        const rules = Array.from(this.interceptRules.entries()).map(([hostname, config]) => ({
            hostname,
            ...config
        }));

        return {
            contents: [
                {
                    uri: "relay://rules",
                    mimeType: "application/json",
                    text: JSON.stringify(rules, null, 2)
                }
            ]
        };
    }

    async getMCPLogsResource() {
        try {
            const logs = await fs.readFile(this.logPath, 'utf8');
            return {
                contents: [
                    {
                        uri: "relay://logs",
                        mimeType: "text/plain",
                        text: logs
                    }
                ]
            };
        } catch (error) {
            return {
                contents: [
                    {
                        uri: "relay://logs",
                        mimeType: "text/plain",
                        text: `Error reading logs: ${error.message}`
                    }
                ]
            };
        }
    }

    async startMCPServer() {
        if (process.argv.includes('--mcp')) {
            const transport = new StdioServerTransport();
            await this.mcpServer.connect(transport);
            await this.log('MCP Server started on stdio transport');
            return true;
        }
        return false;
    }
}

// CLI Interface
if (require.main === module) {
    const relay = new ComprehensiveTNFRelay();
    const command = process.argv[2];
    
    (async () => {
        switch (command) {
            case 'start':
                const success = await relay.start();
                if (success) {
                    console.log(`\n🚀 TNF Relay v${relay.version} is running!`);
                    console.log(`\n🌐 Access URLs:`);
                    console.log(`   📊 Dashboard: http://localhost:${relay.ports.ui}`);
                    console.log(`   🔌 HTTP API: http://localhost:${relay.ports.http}`);
                    console.log(`   💬 WebSocket: ws://localhost:${relay.ports.websocket}`);
                    console.log(`   🔄 Proxy: http://localhost:${relay.ports.proxy}`);
                    console.log(`\nPress Ctrl+C to stop...\n`);
                    
                    process.on('SIGINT', async () => {
                        console.log('\n🛑 Shutting down TNF Relay...');
                        await relay.stop();
                        process.exit(0);
                    });
                    
                    await new Promise(() => {});
                } else {
                    console.error('❌ Failed to start TNF Relay');
                    process.exit(1);
                }
                break;
                
            case '--mcp':
                const mcpStarted = await relay.startMCPServer();
                if (mcpStarted) {
                    // Keep the process running for MCP stdio communication
                    process.on('SIGINT', async () => {
                        await relay.stop();
                        process.exit(0);
                    });
                    await new Promise(() => {});
                } else {
                    console.error('❌ Failed to start MCP Server');
                    process.exit(1);
                }
                break;
                
            case 'status':
                const status = relay.getStatus();
                console.log('\n📊 TNF Relay Status:');
                console.log(`   Relay ID: ${status.relayId}`);
                console.log(`   Version: ${status.version}`);
                console.log(`   Running: ${status.isRunning}`);
                console.log(`   Agents: ${status.stats.agents}`);
                console.log(`   Intercepted Messages: ${status.stats.interceptedMessages}`);
                break;
                
            default:
                console.log(`
🚀 TNF Agent Communication Relay v${relay.version}

Usage:
  node comprehensive-tnf-relay.js start         # Start the relay system
  node comprehensive-tnf-relay.js --mcp         # Start as MCP server (stdio)
  node comprehensive-tnf-relay.js status        # Show system status

Features:
  ✨ Complete API interception (HTTP/HTTPS proxy)
  🤖 Claude Code terminal integration
  📊 Real-time dashboard UI
  💬 WebSocket communication
  🎯 Claude Desktop integration
  🔌 MCP (Model Context Protocol) server support

Standard mode: Access dashboard at http://localhost:${relay.ports.ui}
MCP mode: Use as stdio MCP server for Claude Code integration
                `);
        }
    })().catch(console.error);
}

module.exports = ComprehensiveTNFRelay;