import * as vscode from 'vscode';
import { WebSocket, WebSocketServer } from 'ws';

const ROO_OUTPUT_PORT = 3711;

/**
 * Integration with the Roo Code AI assistant
 * Monitors Roo's output channel and broadcasts it via WebSocket
 */
export class RooIntegration {
    private wss: WebSocketServer;
    private connections: Set<WebSocket> = new Set();

    constructor() {
        this.wss = new WebSocketServer({ port: ROO_OUTPUT_PORT });
        this.setupWebSocketServer();
        this.interceptRooOutput();
    }

    private setupWebSocketServer() {
        this.wss.on('connection', (ws: WebSocket) => {
            this.connections.add(ws);

            ws.on('close', () => {
                this.connections.delete(ws);
            });
        });
    }

    private interceptRooOutput() {
        // Subscribe to Roo's output channel
        const rooOutputChannel = vscode.window.createOutputChannel('Roo Code');
        
        // Monitor Roo's output by intercepting its channel
        const originalAppend = rooOutputChannel.append;
        rooOutputChannel.append = (value: string) => {
            // Forward the output to all connected clients
            this.broadcastOutput(value);
            // Call the original append method
            originalAppend.call(rooOutputChannel, value);
        };

        const originalAppendLine = rooOutputChannel.appendLine;
        rooOutputChannel.appendLine = (value: string) => {
            // Forward the output to all connected clients
            this.broadcastOutput(value + '\n');
            // Call the original appendLine method
            originalAppendLine.call(rooOutputChannel, value);
        };
    }

    private broadcastOutput(output: string) {
        const message = JSON.stringify({
            type: 'roo_output',
            content: output,
            timestamp: new Date().toISOString()
        });

        this.connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    public dispose() {
        this.wss.close();
    }
}