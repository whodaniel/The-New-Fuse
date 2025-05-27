import * as vscode from 'vscode';
import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { getLogger } from '../core/logging.js';

export interface ChromeWebSocketMessage {
    type: string;
    token?: string;
    code?: string;
    data?: any;
    message?: string;
    query?: string;
    timestamp?: number;
}

export interface ClientInfo {
    id: string;
    ws: WebSocket;
    isAuthenticated: boolean;
    ip: string;
    userAgent?: string;
    lastActivity: number;
    connectionTime: number;
    reconnectCount: number;
    rateLimited?: boolean;
    messageCount?: number;
    token?: string;
    tokenExpiresAt?: number;
    refreshToken?: string;
}

export interface CompressionOptions {
    enabled: boolean;
    threshold: number;
    level: number;
    memLevel: number;
    clientNoContextTakeover: boolean;
    serverNoContextTakeover: boolean;
}

export interface RateLimitOptions {
    enabled: boolean;
    maxMessages: number;
    windowMs: number;
    emitWarnings: boolean;
    warningThreshold: number;
}

export interface AuthOptions {
    enabled: boolean;
    requireAuth: boolean;
    tokenExpirationMs: number;
    refreshTokenExpirationMs: number;
}

export class ChromeWebSocketService extends EventEmitter {
    private static instance: ChromeWebSocketService;
    private logger = getLogger();
    private wsServer: WebSocketServer | null = null;
    private httpServer: http.Server | https.Server | null = null;
    private clients: Map<string, ClientInfo> = new Map();
    private port: number;
    private useSecureWebSocket: boolean;
    private maxClients: number;
    private reconnectAttempts: Map<string, number> = new Map();
    private isRunning: boolean = false;
    private pingInterval: NodeJS.Timeout | null = null;
    private certPath: string;
    private keyPath: string;
    private compressionOptions: CompressionOptions;
    private rateLimitOptions: RateLimitOptions;
    private authOptions: AuthOptions;

    private constructor() {
        super();
        const config = vscode.workspace.getConfiguration('thefuse');
        this.port = config.get('chromeWebSocketPort', 3710);
        this.useSecureWebSocket = config.get('useSecureWebSocket', false);
        this.maxClients = config.get('maxChromeClients', 5);

        // Initialize compression options
        this.compressionOptions = {
            enabled: config.get('enableWebSocketCompression', false),
            threshold: config.get('webSocketCompressionThreshold', 1024),
            level: config.get('webSocketCompressionLevel', 3),
            memLevel: config.get('webSocketCompressionMemLevel', 8),
            clientNoContextTakeover: config.get('webSocketClientNoContextTakeover', false),
            serverNoContextTakeover: config.get('webSocketServerNoContextTakeover', false)
        };

        // Initialize rate limiting options
        this.rateLimitOptions = {
            enabled: config.get('enableWebSocketRateLimit', true),
            maxMessages: config.get('webSocketRateLimitMaxMessages', 100),
            windowMs: config.get('webSocketRateLimitWindowMs', 60000),
            emitWarnings: config.get('webSocketRateLimitEmitWarnings', true),
            warningThreshold: config.get('webSocketRateLimitWarningThreshold', 0.8)
        };

        // Initialize authentication options
        this.authOptions = {
            enabled: config.get('enableWebSocketAuth', true),
            requireAuth: config.get('requireWebSocketAuth', true),
            tokenExpirationMs: config.get('authTokenExpirationMs', 3600000), // 1 hour
            refreshTokenExpirationMs: config.get('authRefreshTokenExpirationMs', 86400000) // 24 hours
        };

        // Default paths for self-signed certificates (for development)
        const extensionPath = vscode.extensions.getExtension('thefuse.the-new-fuse-vscode')?.extensionPath || '';
        this.certPath = config.get('certPath', path.join(extensionPath, 'certs', 'server.crt'));
        this.keyPath = config.get('keyPath', path.join(extensionPath, 'certs', 'server.key'));

        // Create certificates directory if it doesn't exist
        this.ensureCertificatesExist();
    }

    /**
     * Ensure that self-signed certificates exist for secure WebSocket connections
     */
    private ensureCertificatesExist(): void {
        if (!this.useSecureWebSocket) {
            return;
        }

        const certsDir = path.dirname(this.certPath);
        if (!fs.existsSync(certsDir)) {
            try {
                fs.mkdirSync(certsDir, { recursive: true });
            } catch (error) {
                this.logger.error(`Failed to create certificates directory: ${error}`);
            }
        }

        // Check if certificates exist
        if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
            this.logger.warn(`Self-signed certificates not found at ${this.certPath} and ${this.keyPath}`);
            this.logger.warn('You need to generate self-signed certificates for secure WebSocket connections.');
            this.logger.warn('You can use OpenSSL to generate certificates:');
            this.logger.warn(`mkdir -p "${certsDir}"`);
            this.logger.warn(`openssl req -x509 -newkey rsa:4096 -keyout "${this.keyPath}" -out "${this.certPath}" -days 365 -nodes -subj "/CN=localhost"`);
        }
    }

    public static getInstance(): ChromeWebSocketService {
        if (!ChromeWebSocketService.instance) {
            ChromeWebSocketService.instance = new ChromeWebSocketService();
        }
        return ChromeWebSocketService.instance;
    }

    public async initialize(): Promise<void> {
        // Update configuration
        const config = vscode.workspace.getConfiguration('thefuse');
        this.port = config.get('chromeWebSocketPort', 3710);
        this.useSecureWebSocket = config.get('useSecureWebSocket', false);
        this.maxClients = config.get('maxChromeClients', 5);

        // Update compression options
        this.compressionOptions = {
            enabled: config.get('enableWebSocketCompression', false),
            threshold: config.get('webSocketCompressionThreshold', 1024),
            level: config.get('webSocketCompressionLevel', 3),
            memLevel: config.get('webSocketCompressionMemLevel', 8),
            clientNoContextTakeover: config.get('webSocketClientNoContextTakeover', false),
            serverNoContextTakeover: config.get('webSocketServerNoContextTakeover', false)
        };

        // Update rate limiting options
        this.rateLimitOptions = {
            enabled: config.get('enableWebSocketRateLimit', true),
            maxMessages: config.get('webSocketRateLimitMaxMessages', 100),
            windowMs: config.get('webSocketRateLimitWindowMs', 60000),
            emitWarnings: config.get('webSocketRateLimitEmitWarnings', true),
            warningThreshold: config.get('webSocketRateLimitWarningThreshold', 0.8)
        };

        // Update authentication options
        this.authOptions = {
            enabled: config.get('enableWebSocketAuth', true),
            requireAuth: config.get('requireWebSocketAuth', true),
            tokenExpirationMs: config.get('authTokenExpirationMs', 3600000),
            refreshTokenExpirationMs: config.get('authRefreshTokenExpirationMs', 86400000)
        };

        // Stop existing server if running
        if (this.isRunning) {
            this.dispose();
        }

        try {
            // Create HTTP(S) server
            if (this.useSecureWebSocket) {
                // Check if certificates exist
                if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
                    throw new Error(`Self-signed certificates not found at ${this.certPath} and ${this.keyPath}`);
                }

                // Create HTTPS server
                this.httpServer = https.createServer({
                    cert: fs.readFileSync(this.certPath),
                    key: fs.readFileSync(this.keyPath)
                });
            } else {
                // Create HTTP server
                this.httpServer = http.createServer();
            }

            // Create WebSocket server
            this.wsServer = new WebSocketServer({
                server: this.httpServer,
                perMessageDeflate: this.compressionOptions.enabled ? {
                    zlibDeflateOptions: {
                        level: this.compressionOptions.level,
                        memLevel: this.compressionOptions.memLevel
                    },
                    zlibInflateOptions: {
                        chunkSize: 10 * 1024
                    },
                    clientNoContextTakeover: this.compressionOptions.clientNoContextTakeover,
                    serverNoContextTakeover: this.compressionOptions.serverNoContextTakeover,
                    threshold: this.compressionOptions.threshold
                } : false
            });

            // Set up WebSocket server event handlers
            this.setupWebSocketServer();

            // Start HTTP(S) server
            this.httpServer.listen(this.port, () => {
                this.isRunning = true;
                this.logger.info(`Chrome WebSocket server running on ${this.useSecureWebSocket ? 'wss' : 'ws'}://localhost:${this.port}`);

                // Start ping interval
                this.startPingInterval();
            });

            return Promise.resolve();
        } catch (error) {
            this.logger.error(`Failed to initialize Chrome WebSocket server: ${error}`);
            return Promise.reject(error);
        }
    }

    /**
     * Set up WebSocket server event handlers
     */
    private setupWebSocketServer(): void {
        if (!this.wsServer) {
            return;
        }

        this.wsServer.on('connection', (ws, req) => {
            // Check if we've reached the maximum number of clients
            if (this.clients.size >= this.maxClients) {
                this.logger.warn(`Maximum number of clients (${this.maxClients}) reached, rejecting connection`);
                ws.close(1013, 'Maximum number of clients reached');
                return;
            }

            // Generate client ID
            const clientId = this.generateClientId();

            // Get client IP
            const ip = req.socket.remoteAddress || 'unknown';

            // Get user agent
            const userAgent = req.headers['user-agent'] || 'unknown';

            // Create client info
            const clientInfo: ClientInfo = {
                id: clientId,
                ws,
                isAuthenticated: !this.authOptions.enabled || !this.authOptions.requireAuth,
                ip,
                userAgent,
                lastActivity: Date.now(),
                connectionTime: Date.now(),
                reconnectCount: this.reconnectAttempts.get(ip) || 0
            };

            // Add client to clients map
            this.clients.set(clientId, clientInfo);

            this.logger.info(`Chrome extension client connected: ${clientId} (${ip})`);

            // Send welcome message
            this.sendMessage(clientInfo, {
                type: 'SYSTEM',
                message: 'Connected to The New Fuse VS Code Extension',
                protocol: this.useSecureWebSocket ? 'wss' : 'ws',
                compression: this.compressionOptions.enabled,
                timestamp: Date.now()
            });

            // Set up event handlers
            ws.on('message', (message) => {
                try {
                    // Update last activity time
                    clientInfo.lastActivity = Date.now();

                    // Parse message
                    const data = JSON.parse(message.toString());

                    // Handle message
                    this.handleClientMessage(clientInfo, data);
                } catch (error) {
                    this.logger.error(`Error handling message from client ${clientId}: ${error}`);
                }
            });

            ws.on('close', (code, reason) => {
                this.logger.info(`Chrome extension client disconnected: ${clientId} (${ip}), code: ${code}, reason: ${reason || 'No reason provided'}`);

                // Remove client from clients map
                this.clients.delete(clientId);

                // Update reconnect attempts
                this.reconnectAttempts.set(ip, (this.reconnectAttempts.get(ip) || 0) + 1);
            });

            ws.on('error', (error) => {
                this.logger.error(`WebSocket error for client ${clientId}: ${error}`);
            });
        });

        this.wsServer.on('error', (error) => {
            this.logger.error(`WebSocket server error: ${error}`);
        });
    }

    /**
     * Handle a message from a client
     */
    private handleClientMessage(clientInfo: ClientInfo, message: ChromeWebSocketMessage): void {
        // Check if authentication is required
        if (this.authOptions.enabled && this.authOptions.requireAuth && !clientInfo.isAuthenticated) {
            // Only allow AUTH messages
            if (message.type !== 'AUTH') {
                this.sendMessage(clientInfo, {
                    type: 'ERROR',
                    message: 'Authentication required',
                    timestamp: Date.now()
                });
                return;
            }
        }

        // Handle message based on type
        switch (message.type) {
            case 'AUTH':
                this.handleAuthMessage(clientInfo, message);
                break;
            case 'PING':
                this.handlePingMessage(clientInfo);
                break;
            case 'CODE_INPUT':
                this.handleCodeInputMessage(clientInfo, message);
                break;
            case 'AI_QUERY':
                this.handleAIQueryMessage(clientInfo, message);
                break;
            case 'STATUS_REQUEST':
                this.handleStatusRequestMessage(clientInfo);
                break;
            case 'DISCONNECT':
                this.handleDisconnectMessage(clientInfo);
                break;
            default:
                this.logger.warn(`Unknown message type from client ${clientInfo.id}: ${message.type}`);
                this.sendMessage(clientInfo, {
                    type: 'ERROR',
                    message: `Unknown message type: ${message.type}`,
                    timestamp: Date.now()
                });
        }
    }

    /**
     * Handle an authentication message from a client
     */
    private handleAuthMessage(clientInfo: ClientInfo, message: ChromeWebSocketMessage): void {
        // For now, just accept any token
        clientInfo.isAuthenticated = true;
        clientInfo.token = message.token;
        clientInfo.tokenExpiresAt = Date.now() + this.authOptions.tokenExpirationMs;

        this.logger.info(`Client ${clientInfo.id} authenticated`);

        this.sendMessage(clientInfo, {
            type: 'AUTH_RESPONSE',
            success: true,
            timestamp: Date.now()
        });
    }

    /**
     * Handle a ping message from a client
     */
    private handlePingMessage(clientInfo: ClientInfo): void {
        this.sendMessage(clientInfo, {
            type: 'PONG',
            timestamp: Date.now()
        });
    }

    /**
     * Handle a code input message from a client
     */
    private handleCodeInputMessage(clientInfo: ClientInfo, message: ChromeWebSocketMessage): void {
        if (!message.code) {
            this.sendMessage(clientInfo, {
                type: 'ERROR',
                message: 'No code provided',
                timestamp: Date.now()
            });
            return;
        }

        this.logger.info(`Received code input from client ${clientInfo.id}`);

        // Emit event for other components to handle
        this.emit('codeInput', {
            clientId: clientInfo.id,
            code: message.code
        });

        // Send acknowledgement
        this.sendMessage(clientInfo, {
            type: 'CODE_INPUT_RECEIVED',
            timestamp: Date.now()
        });

        // Simulate AI processing the code (in a real implementation, this would be handled by the AI service)
        setTimeout(() => {
            this.sendMessage(clientInfo, {
                type: 'AI_RESPONSE',
                data: {
                    result: `Processed code: ${message.code?.substring(0, 50)}${message.code && message.code.length > 50 ? '...' : ''}`
                },
                timestamp: Date.now()
            });
        }, 1000);
    }

    /**
     * Handle an AI query message from a client
     */
    private handleAIQueryMessage(clientInfo: ClientInfo, message: ChromeWebSocketMessage): void {
        if (!message.data?.query) {
            this.sendMessage(clientInfo, {
                type: 'ERROR',
                message: 'No query provided',
                timestamp: Date.now()
            });
            return;
        }

        this.logger.info(`Received AI query from client ${clientInfo.id}: ${message.data.query}`);

        // Emit event for other components to handle
        this.emit('aiQuery', {
            clientId: clientInfo.id,
            query: message.data.query
        });

        // Simulate AI processing the query (in a real implementation, this would be handled by the AI service)
        setTimeout(() => {
            this.sendMessage(clientInfo, {
                type: 'AI_RESPONSE',
                data: {
                    result: `Answer to: ${message.data?.query}`
                },
                timestamp: Date.now()
            });
        }, 1500);
    }

    /**
     * Handle a status request message from a client
     */
    private handleStatusRequestMessage(clientInfo: ClientInfo): void {
        this.logger.info(`Received status request from client ${clientInfo.id}`);

        // Get server status information
        const status = {
            server: 'running',
            clients: this.clients.size,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0',
            compressionEnabled: this.compressionOptions.enabled,
            secureWebSocket: this.useSecureWebSocket
        };

        // Send status response
        this.sendMessage(clientInfo, {
            type: 'STATUS_RESPONSE',
            data: { status },
            timestamp: Date.now()
        });
    }

    /**
     * Handle a disconnect message from a client
     */
    private handleDisconnectMessage(clientInfo: ClientInfo): void {
        this.logger.info(`Received disconnect request from client ${clientInfo.id}`);

        // Send acknowledgement before closing
        this.sendMessage(clientInfo, {
            type: 'DISCONNECT_ACK',
            message: 'Disconnecting by request',
            timestamp: Date.now()
        });

        // Close the connection after a short delay
        setTimeout(() => {
            try {
                clientInfo.ws.close(1000, 'Client requested disconnect');
            } catch (error) {
                this.logger.error(`Error closing connection to client ${clientInfo.id}: ${error}`);
            }
        }, 500);
    }

    /**
     * Generate a unique client ID
     */
    private generateClientId(): string {
        return `client-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    }

    /**
     * Start ping interval to keep connections alive and detect dead connections
     */
    private startPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            const now = Date.now();

            // Send ping to all clients
            for (const [clientId, clientInfo] of this.clients.entries()) {
                // Check if client is still alive
                if (now - clientInfo.lastActivity > 60000) { // 1 minute
                    this.logger.warn(`Client ${clientId} has been inactive for too long, closing connection`);
                    clientInfo.ws.close(1000, 'Inactivity timeout');
                    continue;
                }

                // Send ping
                try {
                    this.sendMessage(clientInfo, {
                        type: 'PING',
                        timestamp: now
                    });
                } catch (error) {
                    this.logger.error(`Error sending ping to client ${clientId}: ${error}`);
                }
            }
        }, 30000); // 30 seconds
    }

    /**
     * Send a message to a specific client
     */
    private sendMessage(clientInfo: ClientInfo, message: ChromeWebSocketMessage): boolean {
        if (clientInfo.ws.readyState !== 1) { // WebSocket.OPEN is 1
            return false;
        }

        try {
            clientInfo.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            this.logger.error(`Error sending message to client ${clientInfo.id}: ${error}`);
            return false;
        }
    }

    /**
     * Send a message to a specific client by ID
     */
    public sendMessageToClient(clientId: string, message: ChromeWebSocketMessage): boolean {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo) {
            return false;
        }

        return this.sendMessage(clientInfo, message);
    }

    /**
     * Send a message to all connected Chrome extension clients
     */
    public sendMessage(message: ChromeWebSocketMessage): void {
        if (!this.wsServer) {
            this.logger.warn('Chrome WebSocket server not initialized');
            return;
        }

        const messageStr = JSON.stringify(message);
        let sentCount = 0;

        for (const [clientId, clientInfo] of this.clients.entries()) {
            // Only send to authenticated clients unless it's a system message
            if (message.type !== 'SYSTEM' && !clientInfo.isAuthenticated) {
                continue;
            }

            if (clientInfo.ws.readyState === 1) { // WebSocket.OPEN is 1
                try {
                    clientInfo.ws.send(messageStr);
                    sentCount++;
                } catch (error) {
                    this.logger.error(`Error sending message to client ${clientId}: ${error}`);
                }
            }
        }

        this.logger.info(`Sent message to ${sentCount} clients`);
    }

    /**
     * Send AI output to all Chrome extension clients
     */
    public sendAIOutput(output: string): void {
        this.sendMessage({
            type: 'AI_OUTPUT',
            data: { output },
            timestamp: Date.now()
        });
    }

    /**
     * Send AI output to a specific client
     */
    public sendAIOutputToClient(clientId: string, output: string): boolean {
        return this.sendMessageToClient(clientId, {
            type: 'AI_OUTPUT',
            data: { output },
            timestamp: Date.now()
        });
    }

    /**
     * Get the current status of the WebSocket server
     */
    public isActive(): boolean {
        return this.isRunning && this.wsServer !== null;
    }

    /**
     * Get the number of connected clients
     */
    public getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Get information about all connected clients
     */
    public getClientInfo(): Array<{
        id: string;
        ip: string;
        authenticated: boolean;
        connectionTime: number;
        tokenExpiresAt?: number;
    }> {
        const clientInfo = [];
        for (const [clientId, client] of this.clients.entries()) {
            clientInfo.push({
                id: clientId,
                ip: client.ip,
                authenticated: client.isAuthenticated,
                connectionTime: client.connectionTime,
                tokenExpiresAt: client.tokenExpiresAt
            });
        }
        return clientInfo;
    }

    /**
     * Get information about WebSocket compression
     */
    public getCompressionInfo(): {
        enabled: boolean;
        threshold: number;
        level: number;
        memLevel: number;
    } {
        return {
            enabled: this.compressionOptions.enabled,
            threshold: this.compressionOptions.threshold,
            level: this.compressionOptions.level,
            memLevel: this.compressionOptions.memLevel
        };
    }

    /**
     * Get information about rate limiting
     */
    public getRateLimitInfo(): {
        enabled: boolean;
        maxMessages: number;
        windowMs: number;
    } {
        return {
            enabled: this.rateLimitOptions.enabled,
            maxMessages: this.rateLimitOptions.maxMessages,
            windowMs: this.rateLimitOptions.windowMs
        };
    }

    /**
     * Get information about authentication
     */
    public getAuthInfo(): {
        enabled: boolean;
        requireAuth: boolean;
        tokenExpirationMs: number;
    } {
        return {
            enabled: this.authOptions.enabled,
            requireAuth: this.authOptions.requireAuth,
            tokenExpirationMs: this.authOptions.tokenExpirationMs
        };
    }

    /**
     * Dispose of the WebSocket server
     */
    public dispose(): void {
        // Clear ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        // Close all client connections
        for (const [clientId, clientInfo] of this.clients.entries()) {
            try {
                clientInfo.ws.close(1001, 'Server shutting down');
            } catch (error) {
                this.logger.error(`Error closing connection to client ${clientId}: ${error}`);
            }
        }

        // Clear clients map
        this.clients.clear();

        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close((error) => {
                if (error) {
                    this.logger.error(`Error closing WebSocket server: ${error}`);
                } else {
                    this.logger.info('WebSocket server closed');
                }
            });
            this.wsServer = null;
        }

        // Close HTTP(S) server
        if (this.httpServer) {
            this.httpServer.close((error) => {
                if (error) {
                    this.logger.error(`Error closing HTTP(S) server: ${error}`);
                } else {
                    this.logger.info('HTTP(S) server closed');
                }
            });
            this.httpServer = null;
        }

        this.isRunning = false;
    }
}
