/// <reference types="node" />
import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
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
export declare class ChromeWebSocketService extends EventEmitter {
    private static instance;
    private logger;
    private relayService;
    private authService;
    private wsServer;
    private httpServer;
    private clients;
    private port;
    private useSecureWebSocket;
    private maxClients;
    private reconnectAttempts;
    private isRunning;
    private pingInterval;
    private certPath;
    private keyPath;
    private compressionOptions;
    private rateLimiter;
    private rateLimitOptions;
    private authOptions;
    private constructor();
    /**
     * Ensure that self-signed certificates exist for secure WebSocket connections
     */
    private ensureCertificatesExist;
    static getInstance(): ChromeWebSocketService;
    initialize(): Promise<void>;
    /**
     * Set up WebSocket server event handlers
     */
    private setupWebSocketServer;
    /**
     * Set up event handlers for a client
     */
    private setupClientEventHandlers;
    /**
     * Handle authentication message
     */
    private handleAuthentication;
    /**
     * Handle token refresh
     */
    private handleTokenRefresh;
    /**
     * Generate a new token for a client
     */
    private generateNewToken;
    /**
     * Handle ping message
     */
    private handlePing;
    /**
     * Handle code input message
     */
    private handleCodeInput;
    /**
     * Handle client disconnection
     */
    private handleClientDisconnection;
    /**
     * Handle server error
     */
    private handleServerError;
    /**
     * Send welcome message to a client
     */
    private sendWelcomeMessage;
    /**
     * Send error message to a client
     */
    private sendErrorMessage;
    /**
     * Send warning message to a client
     */
    private sendWarningMessage;
    /**
     * Generate a unique client ID
     */
    private generateClientId;
    /**
     * Start ping interval to keep connections alive and detect dead connections
     */
    private startPingInterval;
    /**
     * Send a message to all connected Chrome extension clients
     */
    sendMessage(message: ChromeWebSocketMessage): void;
    /**
     * Send AI output to all Chrome extension clients
     */
    sendAIOutput(output: string): void;
    /**
     * Send AI output to a specific client
     */
    sendAIOutputToClient(clientId: string, output: string): boolean;
    /**
     * Get the current status of the WebSocket server
     */
    isActive(): boolean;
    /**
     * Get the number of connected clients
     */
    getClientCount(): number;
    /**
     * Get information about all connected clients
     */
    getClientInfo(): {
        id: string;
        ip: string;
        authenticated: boolean;
        connectionTime: number;
        tokenExpiresAt?: number;
    }[];
    /**
     * Get compression settings and status
     */
    getCompressionInfo(): {
        enabled: boolean;
        settings: CompressionOptions;
    };
    /**
     * Get rate limit settings and status for all clients
     */
    getRateLimitInfo(): {
        enabled: boolean;
        settings: RateLimitOptions;
        clients: {
            id: string;
            limited: boolean;
            remaining: number;
            resetMs: number;
        }[];
    };
    /**
     * Get authentication settings and status for all clients
     */
    getAuthInfo(): {
        enabled: boolean;
        settings: AuthOptions;
        clients: {
            id: string;
            authenticated: boolean;
            tokenExpiresAt?: number;
        }[];
    };
    /**
     * Clean up resources
     */
    private cleanup;
    /**
     * Dispose of the WebSocket server
     */
    dispose(): void;
}
//# sourceMappingURL=chrome-websocket-service.d.ts.map