                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import { log, logError, logWarning, showError, showInfo } from '../src/utils/logging.js';
// Removed duplicate imports below
import { RelayService } from './relay-service.js';
import { RateLimiter, RateLimitConfig, RateLimitStatus } from './rate-limiter.js';
import { AuthService, TokenInfo } from './auth-service.js';

export interface ChromeWebSocketMessage {
    type: string;
    token?: string;
    code?: string;
    data?: any;
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
    // Use the new logging functions directly or map them
    private logger = {
        info: log,
        warn: logWarning,
        error: logError,
    };
    private relayService: RelayService;
    private authService: AuthService;
    private wsServer: WebSocket.Server | null = null;
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
    private rateLimiter: RateLimiter;
    private rateLimitOptions: RateLimitOptions;
    private authOptions: AuthOptions;

    private constructor() {
        super();
        // Logging is initialized in extension.ts, no need to initialize here
        this.relayService = RelayService.getInstance();
        this.authService = AuthService.getInstance();

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

        // Initialize rate limiter
        this.rateLimiter = new RateLimiter({
            maxMessages: this.rateLimitOptions.maxMessages,
            windowMs: this.rateLimitOptions.windowMs,
            emitWarnings: this.rateLimitOptions.emitWarnings,
            warningThreshold: this.rateLimitOptions.warningThreshold
        });

        // Initialize authentication options
        this.authOptions = {
            enabled: config.get('enableWebSocketAuth', true),
            requireAuth: config.get('requireWebSocketAuth', true),
            tokenExpirationMs: config.get('authTokenExpirationMs', 3600000), // 1 hour
            refreshTokenExpirationMs: config.get('authRefreshTokenExpirationMs', 86400000) // 24 hours
        };

        // Default paths for self-signed certificates (for development)
        const extensionPath = vscode.extensions.getExtension('whodaniel.the-new-fuse')?.extensionPath || '';
        this.certPath = config.get('certPath', path.join(extensionPath, 'certs', 'server.crt'));
        this.keyPath = config.get('keyPath', path.join(extensionPath, 'certs', 'server.key'));

        // Create certificates directory if it doesn't exist
        this.ensureCertificatesExist();
    }

    /**
     * Ensure that self-signed certificates exist for secure WebSocket connections
     */
    private ensureCertificatesExist(): void {
        try {
            const extensionPath = vscode.extensions.getExtension('whodaniel.the-new-fuse')?.extensionPath || '';
            const certsDir = path.join(extensionPath, 'certs');

            // Create certs directory if it doesn't exist
            if (!fs.existsSync(certsDir)) {
                fs.mkdirSync(certsDir, { recursive: true });
                log(`Created certificates directory: ${certsDir}`);
            }

            // Check if certificates exist
            if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
                logWarning('Self-signed certificates not found. Secure WebSocket connections will not be available.');
                log(`Expected certificate at: ${this.certPath}`);
                log(`Expected key at: ${this.keyPath}`);
                log('You can generate self-signed certificates using OpenSSL:');
                log(`openssl req -x509 -newkey rsa:4096 -keyout "${this.keyPath}" -out "${this.certPath}" -days 365 -nodes -subj "/CN=localhost"`);
            }
        } catch (error) {
            logError('Error checking certificates:', error);
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

        // Update rate limiter configuration
        this.rateLimiter.updateConfig({
            maxMessages: this.rateLimitOptions.maxMessages,
            windowMs: this.rateLimitOptions.windowMs,
            emitWarnings: this.rateLimitOptions.emitWarnings,
            warningThreshold: this.rateLimitOptions.warningThreshold
        });

        // Update authentication options
        this.authOptions = {
            enabled: config.get('enableWebSocketAuth', true),
            requireAuth: config.get('requireWebSocketAuth', true),
            tokenExpirationMs: config.get('authTokenExpirationMs', 3600000), // 1 hour
            refreshTokenExpirationMs: config.get('authRefreshTokenExpirationMs', 86400000) // 24 hours
        };

        if (this.isRunning) {
            log('Chrome WebSocket service is already running');
            return;
        }

        try {
            // Create HTTP or HTTPS server based on configuration
            if (this.useSecureWebSocket) {
                // Check if certificates exist
                if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
                    logWarning('Self-signed certificates not found. Falling back to non-secure WebSocket.');
                    this.useSecureWebSocket = false;
                } else {
                    try {
                        const options = {
                            cert: fs.readFileSync(this.certPath),
                            key: fs.readFileSync(this.keyPath)
                        };
                        this.httpServer = https.createServer(options);
                        log('Created HTTPS server for secure WebSocket connections');
                    } catch (error) {
                        logError('Error creating HTTPS server:', error);
                        logWarning('Falling back to non-secure WebSocket');
                        this.useSecureWebSocket = false;
                    }
                }
            }

            // Create HTTP server if not using HTTPS
            if (!this.useSecureWebSocket) {
                this.httpServer = http.createServer();
                log('Created HTTP server for WebSocket connections');
            }

            // Create WebSocket server with compression if enabled
            const serverOptions: WebSocket.ServerOptions = {
                server: this.httpServer as http.Server | https.Server,
                // Allow connections from any origin
                verifyClient: (info, callback) => {
                    log(`Connection attempt from origin: ${info.origin}, address: ${info.req.socket.remoteAddress}`);

                    // Check if we've reached the maximum number of clients
                    if (this.clients.size >= this.maxClients) {
                        logWarning(`Maximum number of clients (${this.maxClients}) reached. Rejecting connection.`);
                        callback(false, 503, 'Server is at capacity');
                        return;
                    }

                    callback(true);
                }
            };

            // Add compression options if enabled
            if (this.compressionOptions.enabled) {
                serverOptions.perMessageDeflate = {
                    zlibDeflateOptions: {
                        level: this.compressionOptions.level,
                        memLevel: this.compressionOptions.memLevel
                    },
                    clientNoContextTakeover: this.compressionOptions.clientNoContextTakeover,
                    serverNoContextTakeover: this.compressionOptions.serverNoContextTakeover,
                    threshold: this.compressionOptions.threshold
                };
                this.logger.info('WebSocket compression enabled with settings:', this.compressionOptions);
            }

            this.wsServer = new WebSocket.Server(serverOptions);

            // Start the server
            await new Promise<void>((resolve, reject) => {
                if (!this.httpServer) {
                    reject(new Error('HTTP server not initialized'));
                    return;
                }

                this.httpServer.on('error', (error) => {
                    this.logger.error('HTTP server error:', error);
                    reject(error);
                });

                this.httpServer.listen(this.port, () => {
                    this.logger.info(`WebSocket server listening on ${this.useSecureWebSocket ? 'wss' : 'ws'}://localhost:${this.port}`);
                    resolve();
                });
            });

            // Set up WebSocket server event handlers
            this.setupWebSocketServer();

            // Start ping interval to keep connections alive and detect dead connections
            this.startPingInterval();

            this.isRunning = true;
            log(`Chrome WebSocket server started on port ${this.port} (${this.useSecureWebSocket ? 'secure' : 'non-secure'})`);
        } catch (error) {
            this.isRunning = false;
            logError('Failed to initialize Chrome WebSocket service:', error);
            this.cleanup();
            throw error;
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
            try {
                // Generate a unique client ID
                const clientId = this.generateClientId();
                const clientIp = req.socket.remoteAddress || 'unknown';
                const userAgent = req.headers['user-agent'] || 'unknown';

                log(`New Chrome extension client connected: ${clientId} from ${clientIp}`);

                // Store client information
                const clientInfo: ClientInfo = {
                    id: clientId,
                    ws: ws,
                    isAuthenticated: false,
                    ip: clientIp,
                    userAgent,
                    lastActivity: Date.now(),
                    connectionTime: Date.now(),
                    reconnectCount: this.reconnectAttempts.get(clientIp) || 0
                };

                this.clients.set(clientId, clientInfo);

                // Reset reconnect attempts for this IP
                this.reconnectAttempts.delete(clientIp);

                // Set up event handlers for this client
                this.setupClientEventHandlers(clientInfo);

                // Send welcome message
                this.sendWelcomeMessage(clientInfo);
            } catch (error) {
                logError('Error handling new WebSocket connection:', error);
                ws.close(1011, 'Internal server error');
            }
        });

        this.wsServer.on('error', (error) => {
            logError('Chrome WebSocket server error:', error);
            this.handleServerError(error);
        });

        this.wsServer.on('close', () => {
            log('WebSocket server closed');
            this.cleanup();
        });
    }

    /**
     * Set up event handlers for a client
     */
    private setupClientEventHandlers(clientInfo: ClientInfo): void {
        const { ws, id } = clientInfo;

        ws.on('message', (message) => {
            try {
                // Update last activity time
                clientInfo.lastActivity = Date.now();

                // Apply rate limiting if enabled
                if (this.rateLimitOptions.enabled) {
                    const rateLimitStatus = this.rateLimiter.checkLimit(id);

                    // Update client rate limit status
                    clientInfo.rateLimited = rateLimitStatus.limited;
                    clientInfo.messageCount = this.rateLimitOptions.maxMessages - rateLimitStatus.remaining;

                    // If client is rate limited, send error message and ignore the message
                    if (rateLimitStatus.limited) {
                        const resetTime = Math.ceil(rateLimitStatus.resetMs / 1000);
                        this.sendErrorMessage(
                            clientInfo,
                            `Rate limit exceeded. Please try again in ${resetTime} seconds.`
                        );
                        return;
                    }

                    // If client is approaching the rate limit, send a warning
                    if (rateLimitStatus.warning) {
                        this.sendWarningMessage(
                            clientInfo,
                            `You are sending messages too quickly. You have ${rateLimitStatus.remaining} messages remaining.`
                        );
                    }
                }

                const data = JSON.parse(message.toString());
                log(`Received message from client ${id}:`, data);

                // Handle authentication
                if (data.type === 'AUTH') {
                    this.handleAuthentication(clientInfo, data);
                    return;
                }

                // Handle ping messages
                if (data.type === 'PING') {
                    this.handlePing(clientInfo);
                    return;
                }

                // Handle code input (requires authentication)
                if (data.type === 'CODE_INPUT') {
                    if (!clientInfo.isAuthenticated) {
                        this.sendErrorMessage(clientInfo, 'Authentication required');
                        return;
                    }

                    this.handleCodeInput(clientInfo, data);
                    return;
                }

                // Emit the message for other services to handle
                this.emit('message', { ...data, clientId: id });
            } catch (error) {
                logError(`Error handling message from client ${id}:`, error);
                logError('Raw message:', message.toString());
                this.sendErrorMessage(clientInfo, 'Invalid message format');
            }
        });

        ws.on('error', (error) => {
            logError(`WebSocket error for client ${id}:`, error);
        });

        ws.on('close', (code, reason) => {
            log(`Client ${id} disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
            this.handleClientDisconnection(clientInfo, code, reason.toString());
        });
    }

    /**
     * Handle authentication message
     */
    private handleAuthentication(clientInfo: ClientInfo, data: any): void {
        try {
            if (!this.authOptions.enabled) {
                // Authentication is disabled, automatically authenticate
                clientInfo.isAuthenticated = true;
                log(`Client ${clientInfo.id} automatically authenticated (auth disabled)`);

                // Send welcome message
                this.sendWelcomeMessage(clientInfo);

                // Emit authenticated event
                this.emit('client-authenticated', { clientId: clientInfo.id });
                return;
            }

            // Check if this is a token refresh request
            if (data.refreshToken) {
                this.handleTokenRefresh(clientInfo, data);
                return;
            }

            // Check if this is a token validation request
            if (data.token) {
                // Validate existing token
                const clientId = this.authService.validateToken(data.token);

                if (clientId === clientInfo.id) {
                    // Token is valid for this client
                    clientInfo.isAuthenticated = true;
                    clientInfo.token = data.token;

                    // Get token info
                    const tokenInfo = this.authService.getTokenInfo(data.token);
                    if (tokenInfo) {
                        clientInfo.tokenExpiresAt = tokenInfo.expiresAt;
                        clientInfo.refreshToken = tokenInfo.refreshToken;
                    }

                    this.logger.info(`Client ${clientInfo.id} authenticated with existing token`);

                    // Send welcome message
                    this.sendWelcomeMessage(clientInfo);

                    // Emit authenticated event
                    this.emit('client-authenticated', { clientId: clientInfo.id });
                } else {
                    // Token is invalid or for a different client
                    logWarning(`Client ${clientInfo.id} authentication failed: Invalid token`);
                    this.sendErrorMessage(clientInfo, 'Authentication failed: Invalid token');

                    // Generate a new token if authentication is not required
                    if (!this.authOptions.requireAuth) {
                        this.generateNewToken(clientInfo);
                    }
                }
            } else {
                // No token provided, generate a new one
                if (!this.authOptions.requireAuth) {
                    // Authentication is not required, generate a new token
                    this.generateNewToken(clientInfo);
                } else {
                    // Authentication is required, send error
                    logWarning(`Client ${clientInfo.id} authentication failed: No token provided`);
                    this.sendErrorMessage(clientInfo, 'Authentication failed: No token provided');
                }
            }
        } catch (error) {
            logError(`Error handling authentication for client ${clientInfo.id}:`, error);
            this.sendErrorMessage(clientInfo, 'Authentication failed: Internal error');
        }
    }

    /**
     * Handle token refresh
     */
    private handleTokenRefresh(clientInfo: ClientInfo, data: any): void {
        try {
            if (!data.refreshToken) {
                logWarning(`Client ${clientInfo.id} token refresh failed: No refresh token provided`);
                this.sendErrorMessage(clientInfo, 'Token refresh failed: No refresh token provided');
                return;
            }

            // Refresh the token
            const tokenInfo = this.authService.refreshToken(data.refreshToken);

            if (tokenInfo) {
                // Token refreshed successfully
                clientInfo.isAuthenticated = true;
                clientInfo.token = tokenInfo.token;
                clientInfo.tokenExpiresAt = tokenInfo.expiresAt;
                clientInfo.refreshToken = tokenInfo.refreshToken;

                this.logger.info(`Client ${clientInfo.id} token refreshed`);

                // Send token refresh response
                this.sendMessage(clientInfo, {
                    type: 'AUTH_REFRESH',
                    token: tokenInfo.token,
                    expiresAt: tokenInfo.expiresAt,
                    refreshToken: tokenInfo.refreshToken,
                    timestamp: Date.now()
                });
            } else {
                // Token refresh failed
                logWarning(`Client ${clientInfo.id} token refresh failed: Invalid refresh token`);
                this.sendErrorMessage(clientInfo, 'Token refresh failed: Invalid refresh token');

                // Clear authentication
                clientInfo.isAuthenticated = false;
                clientInfo.token = undefined;
                clientInfo.tokenExpiresAt = undefined;
                clientInfo.refreshToken = undefined;
            }
        } catch (error) {
            logError(`Error handling token refresh for client ${clientInfo.id}:`, error);
            this.sendErrorMessage(clientInfo, 'Token refresh failed: Internal error');
        }
    }

    /**
     * Generate a new token for a client
     */
    private generateNewToken(clientInfo: ClientInfo): void {
        try {
            // Generate a new token
            const tokenInfo = this.authService.generateToken(clientInfo.id);

            // Update client info
            clientInfo.isAuthenticated = true;
            clientInfo.token = tokenInfo.token;
            clientInfo.tokenExpiresAt = tokenInfo.expiresAt;
            clientInfo.refreshToken = tokenInfo.refreshToken;

            log(`Generated new token for client ${clientInfo.id}`);

            // Send authentication response
            this.sendMessage(clientInfo, {
                type: 'AUTH_RESPONSE',
                token: tokenInfo.token,
                expiresAt: tokenInfo.expiresAt,
                refreshToken: tokenInfo.refreshToken,
                timestamp: Date.now()
            });

            // Send welcome message
            this.sendWelcomeMessage(clientInfo);

            // Emit authenticated event
            this.emit('client-authenticated', { clientId: clientInfo.id });
        } catch (error) {
            logError(`Error generating token for client ${clientInfo.id}:`, error);
            this.sendErrorMessage(clientInfo, 'Authentication failed: Internal error');
        }
    }

    /**
     * Handle ping message
     */
    private handlePing(clientInfo: ClientInfo): void {
        this.sendMessage(clientInfo, {
            type: 'PONG',
            timestamp: Date.now()
        });
    }

    /**
     * Handle code input message
     */
    private handleCodeInput(clientInfo: ClientInfo, data: any): void {
        log(`Received code input from client ${clientInfo.id}`);

        // Forward to relay service
        this.relayService.sendMessage('chrome-extension', {
            command: 'code_input',
            data: {
                id: Date.now().toString(),
                clientId: clientInfo.id,
                conversationId: 'chrome-vscode',
                code: data.code
            }
        });
    }

    /**
     * Handle client disconnection
     */
    private handleClientDisconnection(clientInfo: ClientInfo, code: number, reason: string): void {
        // Remove client from the list
        this.clients.delete(clientInfo.id);

        // Track reconnection attempts for this IP
        const reconnectCount = this.reconnectAttempts.get(clientInfo.ip) || 0;
        this.reconnectAttempts.set(clientInfo.ip, reconnectCount + 1);

        // Revoke tokens if authentication is enabled
        if (this.authOptions.enabled && clientInfo.token) {
            this.authService.revokeToken(clientInfo.token);
            log(`Revoked token for client ${clientInfo.id}`);
        }

        // Emit disconnection event
        this.emit('clientDisconnected', {
            clientId: clientInfo.id,
            code,
            reason
        });
    }

    /**
     * Handle server error
     */
    private handleServerError(error: Error): void {
        // Try to restart the server after a delay with exponential backoff
        const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts.size));

        log(`Will attempt to restart WebSocket server in ${delay}ms`);

        setTimeout(() => {
            if (!this.isRunning) {
                this.initialize().catch(err => {
                    logError('Failed to restart Chrome WebSocket server:', err);
                });
            }
        }, delay);
    }

    /**
     * Send welcome message to a client
     */
    private sendWelcomeMessage(clientInfo: ClientInfo): void {
        try {
            // Get rate limit status for the client
            const rateLimitStatus = this.rateLimitOptions.enabled
                ? this.rateLimiter.getStatus(clientInfo.id)
                : null;

            this.sendMessage(clientInfo, {
                type: 'SYSTEM',
                message: 'Connected to The New Fuse VS Code Extension',
                protocol: this.useSecureWebSocket ? 'wss' : 'ws',
                compression: this.compressionOptions.enabled,
                rateLimit: this.rateLimitOptions.enabled ? {
                    enabled: true,
                    maxMessages: this.rateLimitOptions.maxMessages,
                    windowMs: this.rateLimitOptions.windowMs,
                    remaining: rateLimitStatus?.remaining || this.rateLimitOptions.maxMessages
                } : { enabled: false },
                auth: this.authOptions.enabled ? {
                    enabled: true,
                    requireAuth: this.authOptions.requireAuth,
                    tokenExpiresAt: clientInfo.tokenExpiresAt,
                    tokenExpiration: this.authOptions.tokenExpirationMs,
                    refreshTokenExpiration: this.authOptions.refreshTokenExpirationMs
                } : { enabled: false },
                timestamp: Date.now()
            });

            log(`Sent welcome message to client ${clientInfo.id}`);

            if (this.compressionOptions.enabled) {
                log(`Compression enabled for client ${clientInfo.id}`);
            }

            if (this.rateLimitOptions.enabled) {
                log(`Rate limiting enabled for client ${clientInfo.id}: ${this.rateLimitOptions.maxMessages} messages per ${this.rateLimitOptions.windowMs / 1000} seconds`);
            }
        } catch (error) {
            logError(`Error sending welcome message to client ${clientInfo.id}:`, error);
        }
    }

    /**
     * Send error message to a client
     */
    private sendErrorMessage(clientInfo: ClientInfo, errorMessage: string): void {
        try {
            this.sendMessage(clientInfo, {
                type: 'ERROR',
                message: errorMessage,
                timestamp: Date.now()
            });
        } catch (error) {
            logError(`Error sending error message to client ${clientInfo.id}:`, error);
        }
    }

    /**
     * Send warning message to a client
     */
    private sendWarningMessage(clientInfo: ClientInfo, warningMessage: string): void {
        try {
            this.sendMessage(clientInfo, {
                type: 'WARNING',
                message: warningMessage,
                timestamp: Date.now()
            });
        } catch (error) {
            logError(`Error sending warning message to client ${clientInfo.id}:`, error);
        }
    }

    /**
     * Send a message to a specific client
     */
    private sendMessageToClient(clientInfo: ClientInfo, message: any): void {
        try {
            if (clientInfo.ws.readyState === WebSocket.OPEN) {
                clientInfo.ws.send(JSON.stringify(message));
            }
        } catch (error) {
            logError(`Error sending message to client ${clientInfo.id}:`, error);
        }
    }

    /**
     * Generate a unique client ID
     */
    private generateClientId(): string {
        return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Start ping interval to keep connections alive and detect dead connections
     */
    private startPingInterval(): void {
        // Clear existing interval if any
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        // Check clients every 30 seconds
        this.pingInterval = setInterval(() => {
            const now = Date.now();

            // Check each client
            for (const [clientId, clientInfo] of this.clients.entries()) {
                // Check if client has been inactive for more than 2 minutes
                if (now - clientInfo.lastActivity > 120000) {
                    logWarning(`Client ${clientId} has been inactive for too long. Closing connection.`);
                    clientInfo.ws.close(1000, 'Inactivity timeout');
                    this.clients.delete(clientId);
                    continue;
                }

                // Send ping to client
                try {
                    if (clientInfo.ws.readyState === WebSocket.OPEN) {
                        clientInfo.ws.ping();
                    }
                } catch (error) {
                    logError(`Error sending ping to client ${clientId}:`, error);
                }
            }
        }, 30000);
    }

    /**
     * Send a message to all connected Chrome extension clients
     */
    public sendMessage(message: ChromeWebSocketMessage): void {
        if (!this.wsServer) {
            logWarning('Chrome WebSocket server not initialized');
            return;
        }

        const messageStr = JSON.stringify(message);
        let sentCount = 0;

        for (const [clientId, clientInfo] of this.clients.entries()) {
            // Only send to authenticated clients unless it's a system message
            if (message.type !== 'SYSTEM' && !clientInfo.isAuthenticated) {
                continue;
            }

            if (clientInfo.ws.readyState === WebSocket.OPEN) {
                try {
                    clientInfo.ws.send(messageStr);
                    sentCount++;
                } catch (error) {
                    logError(`Error sending message to client ${clientId}:`, error);
                }
            }
        }

        log(`Sent message to ${sentCount} clients`);
    }

    /**
     * Send a message to a specific client by ID
     */
    public sendMessageToClient(clientId: string, message: ChromeWebSocketMessage): boolean {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo) {
            logWarning(`Client ${clientId} not found`);
            return false;
        }

        try {
            if (clientInfo.ws.readyState === WebSocket.OPEN) {
                clientInfo.ws.send(JSON.stringify(message));
                return true;
            } else {
                logWarning(`Client ${clientId} connection not open (state: ${clientInfo.ws.readyState})`);
                return false;
            }
        } catch (error) {
            logError(`Error sending message to client ${clientId}:`, error);
            return false;
        }
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
    public getClientInfo(): {
        id: string,
        ip: string,
        authenticated: boolean,
        connectionTime: number,
        tokenExpiresAt?: number
    }[] {
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
     * Get compression settings and status
     */
    public getCompressionInfo(): { enabled: boolean, settings: CompressionOptions } {
        return {
            enabled: this.compressionOptions.enabled,
            settings: { ...this.compressionOptions }
        };
    }

    /**
     * Get rate limit settings and status for all clients
     */
    public getRateLimitInfo(): {
        enabled: boolean,
        settings: RateLimitOptions,
        clients: { id: string, limited: boolean, remaining: number, resetMs: number }[]
    } {
        const clientStatus = [];

        for (const [clientId, client] of this.clients.entries()) {
            const status = this.rateLimiter.getStatus(clientId);
            clientStatus.push({
                id: clientId,
                limited: status.limited,
                remaining: status.remaining,
                resetMs: status.resetMs
            });
        }

        return {
            enabled: this.rateLimitOptions.enabled,
            settings: { ...this.rateLimitOptions },
            clients: clientStatus
        };
    }

    /**
     * Get authentication settings and status for all clients
     */
    public getAuthInfo(): {
        enabled: boolean,
        settings: AuthOptions,
        clients: { id: string, authenticated: boolean, tokenExpiresAt?: number }[]
    } {
        const clientStatus = [];

        for (const [clientId, client] of this.clients.entries()) {
            clientStatus.push({
                id: clientId,
                authenticated: client.isAuthenticated,
                tokenExpiresAt: client.tokenExpiresAt
            });
        }

        return {
            enabled: this.authOptions.enabled,
            settings: { ...this.authOptions },
            clients: clientStatus
        };
    }

    /**
     * Clean up resources
     */
    private cleanup(): void {
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
                logError(`Error closing connection to client ${clientId}:`, error);
            }
        }

        // Clear client list
        this.clients.clear();

        // Close HTTP server
        if (this.httpServer) {
            try {
                this.httpServer.close();
                this.httpServer = null;
            } catch (error) {
                logError('Error closing HTTP server:', error);
            }
        }

        this.isRunning = false;
    }

    /**
     * Dispose of the WebSocket server
     */
    public dispose(): void {
        log('Disposing Chrome WebSocket service');

        // Close WebSocket server
        if (this.wsServer) {
            try {
                this.wsServer.close(() => {
                    log('Chrome WebSocket server closed');
                });
                this.wsServer = null;
            } catch (error) {
                logError('Error closing WebSocket server:', error);
            }
        }

        // Clean up other resources
        this.cleanup();

        // Dispose of the rate limiter
        if (this.rateLimiter) {
            this.rateLimiter.dispose();
        }

        // Revoke all tokens
        if (this.authOptions.enabled) {
            for (const [clientId, clientInfo] of this.clients.entries()) {
                if (clientInfo.token) {
                    this.authService.revokeToken(clientInfo.token);
                }
            }
        }

        // Remove all event listeners
        this.removeAllListeners();
    }
}
