import * as vscode from 'vscode';
import WebSocket from 'ws';
import { MCPClient, MCPCommand, MCPResponse, MCPStatus } from '../types/mcp';

/**
 * Implementation of the Model Context Protocol client
 * for communicating with external agent services
 */
export class ModelContextProtocolClient implements MCPClient {
    private socket: WebSocket | undefined;
    private status: MCPStatus = { connected: false, reconnectAttempt: 0 };
    private responseHandlers: ((response: MCPResponse) => void)[] = [];
    private pendingCommands: Map<string, { 
        resolve: (response: MCPResponse) => void,
        reject: (error: Error) => void 
    }> = new Map();

    constructor(
        private readonly serverUrl: string = 'ws://localhost:3000/mcp', 
        private readonly context: vscode.ExtensionContext
    ) {}

    public async connect(): Promise<void> {
        if (this.status.connected && this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('MCP: Already connected to MCP server.');
            return;
        }
        this.status.reconnectAttempt = 0; // Reset reconnect attempt count
        console.log(`MCP: Connecting to MCP server at ${this.serverUrl}`);
        try {
            this.socket = new WebSocket(this.serverUrl);

            this.socket.on('open', () => {
                this.status.connected = true;
                this.status.error = undefined;
                console.log('MCP: Connected to server');
            });

            this.socket.on('message', (data: WebSocket.Data) => {
                try {
                    const response = JSON.parse(data.toString()) as MCPResponse;
                    this.handleResponse(response);
                } catch (error) {
                    console.error('MCP: Failed to parse response:', error);
                }
            });

            this.socket.on('error', (error) => {
                this.status.error = error.message;
                console.error('MCP: Socket error:', error);
            });

            this.socket.on('close', () => {
                this.status.connected = false;
                console.log('MCP: Disconnected from server');
                
                // Reject all pending commands
                this.pendingCommands.forEach((handlers, id) => {
                    handlers.reject(new Error('Connection closed'));
                });
                this.pendingCommands.clear();
            });
        } catch (error) {
            this.status.connected = false;
            this.status.error = error instanceof Error ? error.message : String(error);
            console.error('MCP: Connection failed:', error);
        }
    }

    async disconnect(): Promise<void> {
        if (!this.socket) {
            return;
        }

        return new Promise((resolve) => {
            if (this.socket) {
                this.socket.close();
                this.socket = undefined;
            }
            this.status.connected = false;
            resolve();
        });
    }

    isConnected(): boolean {
        return this.status.connected;
    }

    async sendCommand(command: MCPCommand): Promise<MCPResponse> {
        if (!this.socket || !this.status.connected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            if (!this.socket || !this.status.connected) {
                reject(new Error('Not connected to MCP server'));
                return;
            }

            try {
                // Save the promise handlers for when we get a response
                this.pendingCommands.set(command.id, { resolve, reject });
                
                // Send the command
                this.socket.send(JSON.stringify(command));
                
                // Update status
                this.status.lastCommand = command;
            } catch (error) {
                this.pendingCommands.delete(command.id);
                reject(error);
            }
        });
    }

    onResponse(callback: (response: MCPResponse) => void): void {
        this.responseHandlers.push(callback);
    }

    public getStatus(): MCPStatus {
        return { ...this.status };
    }

    private handleResponse(response: MCPResponse): void {
        // Store the last response
        this.status.lastResponse = response;
        
        // Resolve the pending promise if exists
        const handlers = this.pendingCommands.get(response.commandId);
        if (handlers) {
            handlers.resolve(response);
            this.pendingCommands.delete(response.commandId);
        }
        
        // Notify all registered handlers
        this.responseHandlers.forEach(handler => {
            try {
                handler(response);
            } catch (error) {
                console.error('MCP: Handler error:', error);
            }
        });
    }
}
