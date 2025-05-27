import WebSocket, { WebSocketServer as WsServer } from 'ws';
import * as http from 'http';
import * as vscode from 'vscode';
import * as pako from 'pako';
import { VSCodeSecurityManager } from './vscodeSecurityManager.js';
import { BaseMessage, MessageType, MessageSource, ConnectionStatusMessage, ErrorMessage } from './shared-protocol.js';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { getLogger, Logger as AppLogger } from './logger.js';

export class WebSocketServer extends EventEmitter {
    private wss: WsServer | null = null;
    private port: number;
    private securityManager: VSCodeSecurityManager;
    private connectedClients: Set<WebSocket> = new Set();
    // Store validated user ID with WebSocket connection
    private clientUserIdentities: Map<WebSocket, string> = new Map();
    private clientRateLimiters: Map<WebSocket, { count: number, windowStart: number }> = new Map();
    private rateLimitMaxMessages: number;
    private rateLimitWindowMs: number;
    private logger: AppLogger;

    constructor(sm: VSCodeSecurityManager) {
        super();
        this.securityManager = sm;
        this.logger = getLogger('WebSocketServer'); // Initialize logger

        const config = vscode.workspace.getConfiguration('thefuse');
        this.port = config.get<number>('websocketPort', 3711);
        this.rateLimitMaxMessages = config.get<number>('websocketRateLimitMaxMessages', 100);
        this.rateLimitWindowMs = config.get<number>('websocketRateLimitWindowSeconds', 60) * 1000;

        vscode.workspace.onDidChangeConfiguration(e => {
            const newConfig = vscode.workspace.getConfiguration('thefuse');
            let portChanged = false;
            let rateLimitChanged = false;

            if (e.affectsConfiguration('thefuse.websocketPort')) {
                const newPort = newConfig.get<number>('websocketPort', 3711);
                if (this.port !== newPort) {
                    this.logger.info(`WebSocket port changed from ${this.port} to ${newPort}.`);
                    this.port = newPort;
                    portChanged = true;
                }
            }

            if (e.affectsConfiguration('thefuse.websocketRateLimitMaxMessages')) {
                const newMaxMessages = newConfig.get<number>('websocketRateLimitMaxMessages', 100);
                if (this.rateLimitMaxMessages !== newMaxMessages) {
                    this.logger.info(`WebSocket rate limit max messages changed from ${this.rateLimitMaxMessages} to ${newMaxMessages}.`);
                    this.rateLimitMaxMessages = newMaxMessages;
                    rateLimitChanged = true;
                }
            }

            if (e.affectsConfiguration('thefuse.websocketRateLimitWindowSeconds')) {
                const newWindowSeconds = newConfig.get<number>('websocketRateLimitWindowSeconds', 60);
                const newWindowMs = newWindowSeconds * 1000;
                if (this.rateLimitWindowMs !== newWindowMs) {
                    this.logger.info(`WebSocket rate limit window changed from ${this.rateLimitWindowMs / 1000}s to ${newWindowSeconds}s.`);
                    this.rateLimitWindowMs = newWindowMs;
                    rateLimitChanged = true;
                }
            }

            if (portChanged) {
                this.logger.info('Restarting server due to port change.');
                this.restart();
            } else if (rateLimitChanged) {
                this.logger.info('Rate limit parameters updated. Active connections will use new limits on next window reset.');
                // No restart needed, new values will be picked up by the logic.
                // Existing client limiters will reset their windows and then use the new values.
            }
        });
    }

    public start(): void {
        if (this.wss) {
            this.logger.info('Server already running.');
            return;
        }
        try {
            this.wss = new WsServer({ port: this.port });
            this.logger.info(`WebSocket server listening on port ${this.port}`);

            this.wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
                const requestUrl = new URL(request.url || '', `ws://localhost:${this.port}`);
                const token = requestUrl.searchParams.get('token');

                this.logger.info(`Client attempting to connect. Token provided: ${token ? 'Yes' : 'No'}`);

                const validationResult = this.validateToken(token);

                if (!validationResult.isValid) {
                    this.logger.warn(`Token validation failed for client: ${validationResult.reason}. Closing connection.`);
                    ws.close(1008, `Authentication failed: ${validationResult.reason}`);
                    return;
                }

                const userId = validationResult.userId || 'anonymous'; // Use 'anonymous' if no userId from token
                this.logger.info(`Client connected and authenticated. User ID: ${userId}`);
                this.connectedClients.add(ws);
                this.clientUserIdentities.set(ws, userId); // Store user ID
                this.clientRateLimiters.set(ws, { count: 0, windowStart: Date.now() });
                this.emitConnectionStatus(ws, 'connected');

                ws.on('message', async (messageBuffer: WebSocket.Data) => {
                    // Rate Limiting Check
                    const limiter = this.clientRateLimiters.get(ws);
                    if (limiter) {
                        const now = Date.now();
                        if (now - limiter.windowStart > this.rateLimitWindowMs) {
                            // Reset window
                            limiter.count = 0;
                            limiter.windowStart = now;
                        }
                        limiter.count++;
                        if (limiter.count > this.rateLimitMaxMessages) {
                            this.logger.warn(`Rate limit exceeded for client. Messages: ${limiter.count} (Limit: ${this.rateLimitMaxMessages}/${this.rateLimitWindowMs / 1000}s)`);
                            const errorMsg: ErrorMessage = {
                                id: randomUUID(),
                                source: MessageSource.VSCODE_EXTENSION,
                                timestamp: Date.now(),
                                type: MessageType.ERROR_MESSAGE,
                                payload: {
                                    message: 'Rate limit exceeded. Too many messages.',
                                    code: 'RATE_LIMIT_EXCEEDED'
                                }
                            };
                            this.sendMessageToClient(ws, errorMsg, false); // Send uncompressed
                            // Optionally, close the connection after a grace period or immediately
                            // ws.close(1008, "Rate limit exceeded");
                            return; // Stop processing this message
                        }
                    } else {
                        // Should not happen if client is in connectedClients, but as a safeguard:
                        this.logger.warn('Rate limiter not found for a connected client, initializing.');
                        this.clientRateLimiters.set(ws, { count: 1, windowStart: Date.now() });
                    }

                    try {
                        let jsonStringToParse: string;

                        if (Buffer.isBuffer(messageBuffer)) {
                            this.logger.debug(`Received binary message, length: ${messageBuffer.byteLength}`);
                            // Assuming received binary message is: deflate(encrypt(JSON.stringify(originalMessage)))
                            // So, we need to: inflate -> decrypt -> parse
                            try {
                                const inflatedString = pako.inflate(messageBuffer as Uint8Array, { to: 'string' });
                                this.logger.debug(`Inflated string length: ${inflatedString.length}`);
                                const decryptedMessage = this.securityManager.decryptMessage(inflatedString);
                                if (!decryptedMessage) {
                                    // If decryption fails after successful inflation, it's a security/decryption key issue or data corruption post-inflation.
                                    throw new Error('Failed to decrypt message after successful inflation. Check encryption keys or data integrity.');
                                }
                                jsonStringToParse = decryptedMessage;
                                this.logger.debug('Successfully inflated and decrypted binary message.');
                            } catch (inflationError) {
                                // If inflation itself fails, the message is not in the expected compressed format or is corrupted.
                                this.logger.error('Failed to inflate binary message. It might be corrupted or not compressed as expected.', inflationError);
                                throw new Error('Failed to decompress binary message. Ensure client is sending pako-deflated data for binary messages.');
                                // Removed fallback: messageBuffer.toString() because if it's binary, it should be compressed.
                                // Uncompressed messages are expected as strings by the 'else' branch below.
                            }
                        } else {
                            this.logger.debug(`Received string message, length: ${messageBuffer.toString().length}`);
                            const decryptedString = this.securityManager.decryptMessage(messageBuffer.toString());
                            if (!decryptedString) {
                                throw new Error('Failed to decrypt string message. Check shared secret.');
                            }
                            jsonStringToParse = decryptedString;
                            this.logger.debug('Successfully decrypted string message (assumed uncompressed).');
                        }

                        const parsedMessage: BaseMessage = JSON.parse(jsonStringToParse);
                        this.logger.info(`Received message: Type=${parsedMessage.type}, Source=${parsedMessage.source}, ID=${parsedMessage.id}`);
                        this.emit('message', parsedMessage, ws);

                    } catch (error) {
                        this.logger.error('Error processing incoming message:', error);
                        const errorMsg: ErrorMessage = {
                            id: randomUUID(),
                            source: MessageSource.VSCODE_EXTENSION,
                            timestamp: Date.now(),
                            type: MessageType.ERROR_MESSAGE,
                            payload: {
                                message: 'Error processing message on server.',
                                details: error instanceof Error ? error.message : String(error)
                            }
                        };
                        // Send error messages uncompressed for easier debugging on client if compression itself is an issue.
                        this.sendMessageToClient(ws, errorMsg, false);
                    }
                });

                ws.on('close', () => {
                    this.logger.info(`Client disconnected (User ID: ${this.clientUserIdentities.get(ws) || 'unknown'}).`);
                    this.connectedClients.delete(ws);
                    this.clientRateLimiters.delete(ws);
                    this.clientUserIdentities.delete(ws); // Clean up user ID mapping
                });

                ws.on('error', (error: Error) => {
                    this.logger.error(`Client error (User ID: ${this.clientUserIdentities.get(ws) || 'unknown'}):`, error);
                    this.connectedClients.delete(ws);
                    this.clientRateLimiters.delete(ws);
                    this.clientUserIdentities.delete(ws); // Clean up user ID mapping
                });
            });

            this.wss.on('error', (error: Error) => {
                this.logger.error('WebSocket server error:', error);
                vscode.window.showErrorMessage(
                    `WebSocket server error: ${error.message}. Port ${this.port} might be in use.`
                );
                this.wss = null;
            });

        } catch (error: any) {
            this.logger.error('Failed to start WebSocket server:', error);
            vscode.window.showErrorMessage(
                `Failed to start WebSocket server: ${error.message}`
            );
        }
    }

    public sendMessageToClient(client: WebSocket, message: BaseMessage, compress: boolean = true): void {
        if (client.readyState === 1) { // WebSocket.OPEN is 1
            try {
                const messageString = JSON.stringify(message);
                let dataToSend: string | Uint8Array;

                if (compress) {
                    // Order: Stringify -> Encrypt -> Deflate
                    const encryptedMessageString = this.securityManager.encryptMessage(messageString);
                    if (!encryptedMessageString) {
                         throw new Error("Encryption of original message failed before compression.");
                    }
                    dataToSend = pako.deflate(encryptedMessageString); // Compress the already encrypted string
                    this.logger.debug(`Sending compressed message. Encrypted length: ${encryptedMessageString.length}, Compressed (binary) length: ${dataToSend.byteLength}, Type: ${message.type}`);
                } else {
                    // Order: Stringify -> Encrypt
                    const encryptedMessage = this.securityManager.encryptMessage(messageString);
                    if (!encryptedMessage) {
                        throw new Error("Encryption failed for uncompressed message.");
                    }
                    dataToSend = encryptedMessage;
                    this.logger.debug(`Sending uncompressed (encrypted) message. Length: ${dataToSend.length}, Type: ${message.type}`);
                }

                client.send(dataToSend);

            } catch (error) {
                this.logger.error('Error sending message:', error);
                const criticalError: ErrorMessage = {
                    id: randomUUID(),
                    source: MessageSource.VSCODE_EXTENSION,
                    timestamp: Date.now(),
                    type: MessageType.ERROR_MESSAGE,
                    payload: {
                        message: 'Failed to prepare/send server response.',
                        details: error instanceof Error ? error.message : String(error)
                    }
                };
                client.send(JSON.stringify(criticalError)); // Fallback to raw JSON
            }
        }
    }

    public broadcast(message: BaseMessage): void {
        this.connectedClients.forEach(client => {
            // Assuming broadcast messages should also be compressed by default
            this.sendMessageToClient(client, message, true);
        });
    }

    private emitConnectionStatus(
        client: WebSocket,
        status: ConnectionStatusMessage['payload']['status'],
        msg?: string
    ) {
        const statusMessage: ConnectionStatusMessage = {
            id: randomUUID(),
            source: MessageSource.VSCODE_EXTENSION,
            timestamp: Date.now(),
            type: MessageType.CONNECTION_STATUS,
            payload: { status, message: msg }
        };
        // Connection status messages are usually small, maybe don't compress?
        // For consistency, let's compress by default.
        this.sendMessageToClient(client, statusMessage, true);
    }

    public stop(): void {
        if (this.wss) {
            this.logger.info('Stopping WebSocket server...');
            this.connectedClients.forEach(client => {
                try {
                    client.terminate(); // Force close remaining connections
                } catch (err) {
                    this.logger.error('Error terminating client:', err);
                }
            });
            this.connectedClients.clear();
            this.clientRateLimiters.clear();
            this.clientUserIdentities.clear(); // Clear user identities as well

            this.wss.close((err) => {
                if (err) {
                    this.logger.error('Error closing WebSocket server:', err);
                } else {
                    this.logger.info('WebSocket server stopped successfully.');
                }
                this.wss = null; // Set to null after close completes
            });
        } else {
            this.logger.info('WebSocket server is not running, no action taken to stop.');
        }
    }

    public restart(): void {
        this.logger.info('Restarting WebSocket server...');
        this.stop();
        // Ensure server is fully stopped before restarting
        const checkServerStopped = () => {
            if (!this.wss) {
                this.logger.info('Server confirmed stopped, proceeding with start.');
                this.start();
            } else {
                this.logger.debug('Waiting for server to stop completely before restarting...');
                setTimeout(checkServerStopped, 100); // Check again shortly
            }
        };
        setTimeout(checkServerStopped, 500); // Initial delay for stop() to initiate
    }

    // Placeholder token validation function
    private validateToken(token: string | null): { isValid: boolean; userId?: string; reason?: string } {
        if (!token) {
            // Depending on policy, missing token might be allowed for anonymous access or rejected.
            // For this task, let's reject if token is missing.
            this.logger.debug('Token validation: No token provided.');
            // return { isValid: true, userId: 'anonymous_no_token' }; // Example: allow anonymous
            return { isValid: false, reason: 'Token not provided' };
        }

        // Simplified placeholder validation:
        // In a real scenario, this would involve:
        // 1. Checking against a list of known, valid tokens (e.g., from a pre-shared secret list for testing)
        // 2. If JWT: Verifying signature (e.g., using 'jsonwebtoken' library and a public key/secret)
        // 3. Checking expiry and other claims.
        // 4. Potentially calling an auth microservice/API endpoint for token introspection.

        // For this placeholder, let's accept a specific mock token and extract a mock userId.
        if (token === 'mock-auth-token-from-client' || token === 'valid-test-token-xyz') {
            this.logger.debug(`Token validation: Token '${token}' is valid (placeholder).`);
            // Extract or assign a mock user ID. If JWT, this would come from token claims.
            const mockUserId = token === 'mock-auth-token-from-client' ? 'mockUserFromClientToken' : 'userFromTestTokenXYZ';
            return { isValid: true, userId: mockUserId };
        }

        // Example of how a JWT *could* be handled (requires 'jsonwebtoken' and setup)
        /*
        try {
            // const decoded = jwt.verify(token, 'YOUR_SECRET_OR_PUBLIC_KEY');
            // if (typeof decoded === 'object' && decoded.sub) {
            //     return { isValid: true, userId: decoded.sub };
            // }
            // return { isValid: false, reason: 'Invalid token structure after decoding' };
        } catch (err) {
            // this.logger.error('JWT validation error:', err.message);
            // return { isValid: false, reason: `JWT validation failed: ${err.message}` };
        }
        */

        this.logger.debug(`Token validation: Token '${token}' is invalid (placeholder).`);
        return { isValid: false, reason: 'Invalid token' };
    }
}
