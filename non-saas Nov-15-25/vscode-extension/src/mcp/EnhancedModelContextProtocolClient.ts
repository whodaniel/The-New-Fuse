import * as vscode from 'vscode';
import WebSocket from 'ws';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
    MCPClient, 
    MCPCommand, 
    MCPCommandType, 
    MCPResponse, 
    MCPStatus 
} from '../types/mcp';

/**
 * Type for progress reporting callbacks
 */
export type MCPProgressCallback = (progress: number, message: string) => void;

/**
 * Enhanced implementation of the Model Context Protocol client
 * with support for WebSocket and HTTP transport with
 * automatic reconnection, progress reporting, and robust error handling
 */
export class EnhancedModelContextProtocolClient extends EventEmitter implements MCPClient {
    // WebSocket connection
    private socket: WebSocket | undefined;
    
    // Status tracking
    private status: MCPStatus = {
        connected: false,
        reconnectAttempt: 0
    };
    
    // Pending requests and callbacks
    private responseHandlers: ((response: MCPResponse) => void)[] = [];
    private pendingCommands: Map<string, { 
        resolve: (response: MCPResponse) => void,
        reject: (error: Error) => void,
        timestamp: number
    }> = new Map();

    // HTTP client for REST API fallback
    private axiosInstance: AxiosInstance;
    
    // Configuration
    private config: {
        // WebSocket URL for MCP connection
        wsUrl: string;
        // Base HTTP URL for REST API fallback
        baseUrl: string;
        // Whether to automatically reconnect when connection is lost
        autoReconnect: boolean;
        // Maximum number of reconnection attempts
        maxReconnectAttempts: number;
        // Delay between reconnection attempts (ms)
        reconnectDelayMs: number;
        // Whether to enable streaming HTTP when WebSocket is unavailable
        enableStreamableHttp: boolean;
        // Whether to enable progress reporting
        enableProgressReporting: boolean;
        // Request timeout (ms)
        timeoutMs: number;
        // Command timeout (ms)
        commandTimeoutMs: number;
    };

    // Reconnection timer
    private reconnectTimer: NodeJS.Timeout | undefined;
    
    // Command timeout monitoring
    private commandTimeoutChecker: NodeJS.Timeout | undefined;

    constructor(
        serverUrl: string = 'ws://localhost:3000/mcp',
        private readonly context: vscode.ExtensionContext
    ) {
        super();
        
        // Load configuration from VS Code settings
        const mcpConfig = vscode.workspace.getConfiguration('theNewFuse.mcp');
        
        // Convert HTTP URL to WS URL if needed
        const wsUrl = serverUrl.startsWith('ws') 
            ? serverUrl 
            : serverUrl.replace(/^http/, 'ws');
            
        // Get base HTTP URL
        const baseUrl = serverUrl.startsWith('http') 
            ? serverUrl 
            : serverUrl.replace(/^ws/, 'http');
            
        // Initialize configuration
        this.config = {
            wsUrl,
            baseUrl,
            autoReconnect: mcpConfig.get<boolean>('autoReconnect', true),
            maxReconnectAttempts: mcpConfig.get<number>('maxReconnectAttempts', 5),
            reconnectDelayMs: mcpConfig.get<number>('reconnectDelayMs', 2000),
            enableStreamableHttp: mcpConfig.get<boolean>('enableStreamableHttp', true),
            enableProgressReporting: mcpConfig.get<boolean>('enableProgressReporting', true),
            timeoutMs: mcpConfig.get<number>('timeoutMs', 30000),
            commandTimeoutMs: mcpConfig.get<number>('commandTimeoutMs', 60000),
        };
        
        // Initialize Axios instance for HTTP fallback
        this.axiosInstance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeoutMs,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-MCP-Client': 'vscode-extension'
            }
        });
        
        // Start command timeout checker
        this.startCommandTimeoutChecker();
        
        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('theNewFuse.mcp')) {
                    this.updateConfiguration();
                }
            })
        );
    }
    
    /**
     * Update configuration from VS Code settings
     */
    private updateConfiguration(): void {
        const mcpConfig = vscode.workspace.getConfiguration('theNewFuse.mcp');
        
        this.config.autoReconnect = mcpConfig.get<boolean>('autoReconnect', this.config.autoReconnect);
        this.config.maxReconnectAttempts = mcpConfig.get<number>('maxReconnectAttempts', this.config.maxReconnectAttempts);
        this.config.reconnectDelayMs = mcpConfig.get<number>('reconnectDelayMs', this.config.reconnectDelayMs);
        this.config.enableStreamableHttp = mcpConfig.get<boolean>('enableStreamableHttp', this.config.enableStreamableHttp);
        this.config.enableProgressReporting = mcpConfig.get<boolean>('enableProgressReporting', this.config.enableProgressReporting);
        this.config.timeoutMs = mcpConfig.get<number>('timeoutMs', this.config.timeoutMs);
        this.config.commandTimeoutMs = mcpConfig.get<number>('commandTimeoutMs', this.config.commandTimeoutMs);
        
        // Update Axios timeout
        this.axiosInstance.defaults.timeout = this.config.timeoutMs;
        
        // If URL changed, reconnect
        const wsUrl = mcpConfig.get<string>('url', this.config.wsUrl);
        if (wsUrl !== this.config.wsUrl) {
            this.config.wsUrl = wsUrl;
            this.config.baseUrl = wsUrl.replace(/^ws/, 'http');
            
            // Reconnect if connected
            if (this.status.connected) {
                this.disconnect().then(() => this.connect());
            }
        }
    }
    
    /**
     * Start command timeout checker
     * Monitors for stalled commands and rejects them if they exceed the timeout
     */
    private startCommandTimeoutChecker(): void {
        if (this.commandTimeoutChecker) {
            clearInterval(this.commandTimeoutChecker);
        }
        
        this.commandTimeoutChecker = setInterval(() => {
            const now = Date.now();
            
            // Check for timed out commands
            for (const [id, { resolve, reject, timestamp }] of this.pendingCommands.entries()) {
                if (now - timestamp > this.config.commandTimeoutMs) {
                    // Command has timed out
                    reject(new Error(`Command timed out after ${this.config.commandTimeoutMs}ms`));
                    this.pendingCommands.delete(id);
                    
                    // Log error
                    this.logError('commandTimeout', new Error(`Command ${id} timed out`));
                    
                    // Emit timeout event
                    this.emit('commandTimeout', { id, commandTimeout: this.config.commandTimeoutMs });
                }
            }
        }, 5000); // Check every 5 seconds
        
        // Register for cleanup
        this.context.subscriptions.push({ 
            dispose: () => {
                if (this.commandTimeoutChecker) {
                    clearInterval(this.commandTimeoutChecker);
                }
            }
        });
    }

    /**
     * Connect to the MCP server
     * Returns a promise that resolves when connected or rejects on failure
     */
    async connect(): Promise<void> {
        // If already connected, return immediately
        if (this.socket && this.status.connected) {
            return;
        }
        
        // If reconnecting and exceeded attempts, reject
        if (this.status.reconnectAttempt > this.config.maxReconnectAttempts) {
            const error = new Error(`Failed to connect after ${this.config.maxReconnectAttempts} attempts`);
            this.logError('connect', error);
            throw error;
        }

        return new Promise<void>((resolve, reject) => {
            try {
                // Clean up existing socket if any
                if (this.socket) {
                    this.socket.terminate();
                    this.socket = undefined;
                }
                
                // Create new WebSocket connection
                this.socket = new WebSocket(this.config.wsUrl);

                // Handle successful connection
                this.socket.on('open', () => {
                    this.status.connected = true;
                    this.status.error = undefined;
                    this.status.reconnectAttempt = 0;
                    
                    console.log('MCP: Connected to server');
                    
                    // Emit connected event
                    this.emit('connected');
                    
                    // Show notification if reconnecting
                    if (this.status.reconnectAttempt > 0) {
                        vscode.window.showInformationMessage('Reconnected to MCP server');
                    }
                    
                    resolve();
                });

                // Handle incoming messages
                this.socket.on('message', (data: WebSocket.Data) => {
                    try {
                        const response = JSON.parse(data.toString()) as MCPResponse;
                        this.handleResponse(response);
                    } catch (error) {
                        this.logError('messageParser', error);
                    }
                });

                // Handle errors
                this.socket.on('error', (error) => {
                    this.status.error = error.message;
                    this.logError('socketError', error);
                    
                    if (!this.status.connected) {
                        reject(error);
                    }
                });

                // Handle disconnection
                this.socket.on('close', () => {
                    const wasConnected = this.status.connected;
                    this.status.connected = false;
                    
                    console.log('MCP: Disconnected from server');
                    
                    // Emit disconnected event
                    this.emit('disconnected');
                    
                    // Reject all pending commands
                    this.rejectPendingCommands(new Error('Connection closed'));
                    
                    // Try to reconnect if auto-reconnect is enabled
                    if (wasConnected && this.config.autoReconnect) {
                        this.scheduleReconnect();
                    }
                });
            } catch (error) {
                this.status.connected = false;
                this.status.error = error instanceof Error ? error.message : String(error);
                this.logError('connectionFailed', error);
                reject(error);
                
                // Try to reconnect if auto-reconnect is enabled
                if (this.config.autoReconnect) {
                    this.scheduleReconnect();
                }
            }
        });
    }

    /**
     * Schedule a reconnection attempt
     */
    private scheduleReconnect(): void {
        // Clear any existing reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        
        // Increment attempt counter
        this.status.reconnectAttempt++;
        
        // If exceeded max attempts, give up
        if (this.status.reconnectAttempt > this.config.maxReconnectAttempts) {
            console.log(`MCP: Giving up reconnection after ${this.config.maxReconnectAttempts} attempts`);
            
            // Show notification
            vscode.window.showErrorMessage(
                `Failed to reconnect to MCP server after ${this.config.maxReconnectAttempts} attempts`,
                'Try Again',
                'Settings'
            ).then(selection => {
                if (selection === 'Try Again') {
                    // Reset counter and try again
                    this.status.reconnectAttempt = 0;
                    this.connect();
                } else if (selection === 'Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'theNewFuse.mcp');
                }
            });
            
            return;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
            this.config.reconnectDelayMs * Math.pow(1.5, this.status.reconnectAttempt - 1),
            30000 // Max 30 second delay
        );
        
        console.log(`MCP: Scheduling reconnect attempt ${this.status.reconnectAttempt} in ${delay}ms`);
        
        // Schedule reconnection
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            
            // Show status bar notification for reconnect attempts
            vscode.window.setStatusBarMessage(`Reconnecting to MCP server (attempt ${this.status.reconnectAttempt}/${this.config.maxReconnectAttempts})...`, 5000);
            
            // Try to reconnect
            this.connect().catch(error => {
                console.error('MCP: Reconnect attempt failed:', error);
            });
        }, delay);
    }

    /**
     * Reject all pending commands with an error
     */
    private rejectPendingCommands(error: Error): void {
        this.pendingCommands.forEach((handlers, id) => {
            handlers.reject(error);
        });
        this.pendingCommands.clear();
    }

    /**
     * Disconnect from the MCP server
     */
    async disconnect(): Promise<void> {
        // Clear reconnect timer if any
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }

        if (!this.socket) {
            return;
        }

        return new Promise<void>((resolve) => {
            // Reject all pending commands
            this.rejectPendingCommands(new Error('Disconnected from server'));
            
            // Reset status
            this.status.connected = false;
            this.status.reconnectAttempt = 0;
            
            // Close socket
            if (this.socket) {
                this.socket.close();
                this.socket = undefined;
            }
            
            // Emit disconnected event
            this.emit('disconnected');
            
            resolve();
        });
    }

    /**
     * Check if connected to the MCP server
     */
    isConnected(): boolean {
        return this.status.connected;
    }

    /**
     * Send a command to the MCP server
     * Returns a promise that resolves with the response or rejects on error
     */
    async sendCommand(command: MCPCommand): Promise<MCPResponse> {
        // Try to connect if not connected
        if (!this.socket || !this.status.connected) {
            try {
                await this.connect();
            } catch (error) {
                // Fall back to HTTP if WebSocket connection fails
                if (this.config.enableStreamableHttp) {
                    console.log('MCP: Falling back to HTTP transport for command', command.id);
                    return this.sendCommandHttp(command);
                } else {
                    throw error;
                }
            }
        }

        return new Promise<MCPResponse>((resolve, reject) => {
            try {
                // Ensure socket is available
                if (!this.socket || !this.status.connected) {
                    throw new Error('Not connected to MCP server');
                }
                
                // Save promise handlers and timestamp
                this.pendingCommands.set(command.id, { 
                    resolve, 
                    reject, 
                    timestamp: Date.now() 
                });
                
                // Send command
                this.socket.send(JSON.stringify(command));
                
                // Update status
                this.status.lastCommand = command;
                
                // Emit event
                this.emit('commandSent', { id: command.id, type: command.type });
            } catch (error) {
                // Clean up
                this.pendingCommands.delete(command.id);
                
                // Log error
                this.logError('sendCommand', error, { commandId: command.id });
                
                // Reject promise
                reject(error);
            }
        });
    }

    /**
     * Send a command using HTTP transport (fallback when WebSocket is unavailable)
     */
    private async sendCommandHttp(command: MCPCommand): Promise<MCPResponse> {
        try {
            // Create request payload
            const payload = {
                id: command.id,
                type: command.type,
                payload: command.payload
            };
            
            // Send POST request
            const response = await this.axiosInstance.post('/commands', payload);
            
            // Create MCP response from HTTP response
            const mcpResponse: MCPResponse = {
                commandId: command.id,
                success: true,
                data: response.data,
                error: undefined
            };
            
            // Handle response
            this.handleResponse(mcpResponse);
            
            return mcpResponse;
        } catch (error) {
            // Create error response
            const errorResponse: MCPResponse = {
                commandId: command.id,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
            
            // Log error
            this.logError('sendCommandHttp', error, { commandId: command.id });
            
            return errorResponse;
        }
    }

    /**
     * Register a callback for handling responses
     */
    onResponse(callback: (response: MCPResponse) => void): void {
        this.responseHandlers.push(callback);
    }

    /**
     * Handle incoming response
     */
    private handleResponse(response: MCPResponse): void {
        // Update status
        this.status.lastResponse = response;
        
        // Resolve pending promise
        const handlers = this.pendingCommands.get(response.commandId);
        if (handlers) {
            if (response.success) {
                handlers.resolve(response);
            } else {
                handlers.reject(new Error(response.error || 'Unknown error'));
            }
            this.pendingCommands.delete(response.commandId);
        }
        
        // Notify all registered handlers
        this.responseHandlers.forEach(handler => {
            try {
                handler(response);
            } catch (error) {
                this.logError('responseHandler', error);
            }
        });
        
        // Emit event
        this.emit('responseReceived', {
            id: response.commandId,
            success: response.success,
            timestamp: Date.now()
        });
    }

    /**
     * Execute a MCP tool with progress reporting
     */
    async executeToolWithProgress(
        toolName: string,
        parameters: Record<string, any>,
        progressCallback?: MCPProgressCallback
    ): Promise<any> {
        // Create unique ID for this execution
        const commandId = uuidv4();
        
        // Create MCP command
        const command: MCPCommand = {
            id: commandId,
            type: MCPCommandType.ACTION,
            payload: {
                tool: toolName,
                parameters,
                stream: this.config.enableProgressReporting
            }
        };
        
        // Show progress notification if requested
        if (progressCallback && this.config.enableProgressReporting) {
            // Start with 0%
            progressCallback(0, `Starting ${toolName}...`);
            
            // Register one-time handler for progress updates
            const progressHandler = (response: MCPResponse) => {
                if (response.commandId === commandId && response.data?.progress) {
                    progressCallback(
                        response.data.progress.percent || 0,
                        response.data.progress.message || ''
                    );
                }
            };
            
            // Add handler for this command only
            this.onResponse(progressHandler);
            
            // Send command and get response
            try {
                const response = await this.sendCommand(command);
                
                // Final progress update
                progressCallback(100, 'Completed');
                
                return response.data?.result;
            } catch (error) {
                // Report error in progress
                progressCallback(0, `Error: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        } else {
            // No progress reporting, just send the command
            const response = await this.sendCommand(command);
            return response.data?.result;
        }
    }
    
    /**
     * Log error with context
     */
    private logError(context: string, error: any, additionalInfo: Record<string, any> = {}): void {
        // Log to console
        console.error(`MCP: Error in ${context}:`, error, additionalInfo);
        
        // Emit error event
        this.emit('error', {
            context,
            error: error instanceof Error ? error.message : String(error),
            ...additionalInfo,
            timestamp: Date.now()
        });
    }
    
    /**
     * Get current status
     */
    getStatus(): MCPStatus {
        return { ...this.status };
    }
    
    /**
     * Check server health
     */
    async checkHealth(): Promise<boolean> {
        try {
            if (this.status.connected) {
                // Send ping command via WebSocket
                const pingCommand: MCPCommand = {
                    id: uuidv4(),
                    type: MCPCommandType.SYSTEM,
                    payload: { action: 'ping' }
                };
                
                const response = await this.sendCommand(pingCommand);
                return response.success;
            } else {
                // Try HTTP health check
                const response = await this.axiosInstance.get('/health');
                return response.status === 200;
            }
        } catch (error) {
            this.logError('checkHealth', error);
            return false;
        }
    }
}
