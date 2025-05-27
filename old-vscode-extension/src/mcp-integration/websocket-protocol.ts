import WebSocket from 'ws';
import * as vscode from 'vscode';
import { MCPMonitor } from './monitoring.js';

interface MCPMessage {
    type: string;
    data?: any;
    timestamp?: number;
}

interface MCPMessageHandler {
    (message: MCPMessage): void;
}

interface MCPWebSocketConfig {
    url: string;
    reconnectDelay?: number;
    heartbeatInterval?: number;
    heartbeatTimeout?: number;
    outputChannel?: vscode.OutputChannel;
}

/**
 * WebSocket Protocol Implementation for MCP
 */
export class MCPWebSocketProtocol {
    private ws: WebSocket | null = null;
    private connected: boolean = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private lastHeartbeat: number = 0;
    private messageHandlers: Map<string, Set<MCPMessageHandler>> = new Map();
    private outputChannel: vscode.OutputChannel;
    private monitor: MCPMonitor;

    private readonly config: Required<MCPWebSocketConfig> = {
        url: '',
        reconnectDelay: 5000,
        heartbeatInterval: 30000,
        heartbeatTimeout: 35000,
        outputChannel: vscode.window.createOutputChannel('MCP WebSocket')
    };

    constructor(config: MCPWebSocketConfig) {
        this.config = { ...this.config, ...config };
        this.outputChannel = this.config.outputChannel;
        this.monitor = MCPMonitor.getInstance();
        this.log('WebSocket protocol initialized');
    }

    /**
     * Connect to the WebSocket server
     */
    async connect(): Promise<boolean> {
        if (this.connected) {
            return true;
        }

        return new Promise((resolve) => {
            try {
                const startTime = Date.now();
                this.ws = new WebSocket(this.config.url);

                this.ws.on('open', () => {
                    this.connected = true;
                    this.lastHeartbeat = Date.now();
                    this.setupHeartbeat();
                    this.monitor.trackConnection(true);
                    this.monitor.trackMessage('connect', 0, Date.now() - startTime);
                    this.log('Connected to server');
                    resolve(true);
                });

                this.ws.on('close', () => {
                    this.monitor.trackConnection(false);
                    this.handleDisconnect();
                    resolve(false);
                });

                this.ws.on('error', (error) => {
                    this.monitor.trackError(error);
                    this.log(`WebSocket error: ${error.message}`, true);
                    this.handleDisconnect();
                    resolve(false);
                });

                this.ws.on('message', (data) => {
                    const receiveTime = Date.now();
                    try {
                        const message = JSON.parse(data.toString()) as MCPMessage;
                        const messageSize = data.toString().length;
                        
                        // Calculate latency if message has timestamp
                        const latency = message.timestamp ? 
                            receiveTime - message.timestamp :
                            0;
                            
                        this.monitor.trackMessage(
                            message.type,
                            messageSize,
                            latency
                        );
                        
                        this.handleMessage(message);
                    } catch (error: any) {
                        this.monitor.trackError(error, {
                            context: 'message_parsing',
                            data: data.toString()
                        });
                        this.log(`Error parsing message: ${error.message}`, true);
                    }
                });

                // Set connection timeout
                setTimeout(() => {
                    if (!this.connected) {
                        this.monitor.trackError(
                            new Error('Connection timeout'),
                            { context: 'connection' }
                        );
                        this.log('Connection attempt timed out', true);
                        resolve(false);
                    }
                }, 10000);

            } catch (error: any) {
                this.monitor.trackError(error, { context: 'connection' });
                this.log(`Connection error: ${error.message}`, true);
                resolve(false);
            }
        });
    }

    /**
     * Disconnect from the server
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
        this.cleanup();
    }

    /**
     * Check if connected to server
     */
    isConnected(): boolean {
        // Check both connection flag and heartbeat
        return this.connected && 
               (Date.now() - this.lastHeartbeat) < this.config.heartbeatTimeout;
    }

    /**
     * Send a message to the server
     */
    sendMessage(message: MCPMessage): void {
        if (!this.ws || !this.connected) {
            const error = new Error('Cannot send message: Not connected');
            this.monitor.trackError(error);
            this.log(error.message, true);
            return;
        }

        try {
            // Add timestamp for latency tracking
            message.timestamp = Date.now();
            const messageString = JSON.stringify(message);
            
            this.ws.send(messageString);
            this.monitor.trackMessage(
                message.type,
                messageString.length,
                0 // Latency will be calculated on response
            );
        } catch (error: any) {
            this.monitor.trackError(error, { 
                context: 'send_message',
                message
            });
            this.log(`Error sending message: ${error.message}`, true);
        }
    }

    /**
     * Register a message handler
     */
    onMessage(type: string, handler: MCPMessageHandler): void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type)!.add(handler);
    }

    /**
     * Remove a message handler
     */
    offMessage(type: string, handler: MCPMessageHandler): void {
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.messageHandlers.delete(type);
            }
        }
    }

    /**
     * Get count of registered handlers (for testing)
     */
    getHandlerCount(): number {
        let count = 0;
        this.messageHandlers.forEach(handlers => {
            count += handlers.size;
        });
        return count;
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(message: MCPMessage): void {
        if (message.type === 'heartbeat') {
            this.lastHeartbeat = Date.now();
            return;
        }

        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(message);
                } catch (error: any) {
                    this.log(`Error in message handler: ${error.message}`, true);
                }
            });
        }
    }

    /**
     * Handle disconnection
     */
    private handleDisconnect(): void {
        this.cleanup();
        this.scheduleReconnect();
    }

    /**
     * Clean up resources
     */
    private cleanup(): void {
        this.connected = false;
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws = null;
        }
    }

    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect(): void {
        if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(async () => {
                this.reconnectTimer = null;
                this.log('Attempting to reconnect...');
                if (!await this.connect()) {
                    this.scheduleReconnect();
                }
            }, this.config.reconnectDelay);
        }
    }

    /**
     * Set up heartbeat mechanism
     */
    private setupHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        this.heartbeatTimer = setInterval(() => {
            if (this.connected) {
                this.sendMessage({ type: 'heartbeat' });
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Log helper
     */
    private log(message: string, isError: boolean = false): void {
        const prefix = '[MCPWebSocket]';
        if (isError) {
            this.outputChannel.appendLine(`${prefix} ERROR: ${message}`);
        } else {
            this.outputChannel.appendLine(`${prefix} ${message}`);
        }
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.cleanup();
        this.monitor.dispose();
        this.outputChannel.dispose();
    }

    /**
     * Get monitoring metrics
     */
    getMetrics() {
        return this.monitor.getMetrics();
    }

    /**
     * Get recent alerts
     */
    getAlerts(count?: number) {
        return this.monitor.getAlerts(count);
    }
}