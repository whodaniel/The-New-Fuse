import * as vscode from 'vscode';
import { WebSocket, WebSocketServer } from 'ws';
import { AgentMessage, AgentMessageType } from '../types/agent-communication';
import { AgentCommunicationService } from './AgentCommunicationService';

const ROO_OUTPUT_PORT = 3711;
const ROO_WEBSOCKET_PORT = 3712;

export interface RooMonitoringData {
    timestamp: number;
    type: 'output' | 'error' | 'warning' | 'info';
    content: string;
    source: 'roo' | 'ai-coder';
}

/**
 * Integration with the Roo Code AI assistant
 * Monitors Roo's output channel and broadcasts it via WebSocket
 * Migrated from old-vscode-extension/roo-integration.tsx with enhancements
 */
export class RooIntegration {
    private wss!: WebSocketServer;
    private connections: Set<WebSocket> = new Set();
    private outputChannel: vscode.OutputChannel;
    private monitoring: boolean = false;
    private monitoringData: RooMonitoringData[] = [];
    private readonly maxMonitoringData = 1000;

    constructor(
        private context: vscode.ExtensionContext,
        private agentComm?: AgentCommunicationService
    ) {
        this.outputChannel = vscode.window.createOutputChannel('Roo Code Monitor');
        this.setupWebSocketServer();
        this.setupCommands();
    }

    private setupWebSocketServer() {
        try {
            this.wss = new WebSocketServer({ port: ROO_WEBSOCKET_PORT });
            
            this.wss.on('connection', (ws: WebSocket) => {
                this.connections.add(ws);
                this.outputChannel.appendLine(`New WebSocket connection established. Total: ${this.connections.size}`);

                // Send recent monitoring data to new connection
                if (this.monitoringData.length > 0) {
                    const recentData = this.monitoringData.slice(-10);
                    ws.send(JSON.stringify({
                        type: 'history',
                        data: recentData
                    }));
                }

                ws.on('close', () => {
                    this.connections.delete(ws);
                    this.outputChannel.appendLine(`WebSocket connection closed. Total: ${this.connections.size}`);
                });

                ws.on('error', (error) => {
                    this.outputChannel.appendLine(`WebSocket error: ${error.message}`);
                    this.connections.delete(ws);
                });

                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleIncomingWebSocketMessage(message);
                    } catch (error) {
                        this.outputChannel.appendLine(`Failed to parse WebSocket message: ${error}`);
                    }
                });
            });

            this.wss.on('error', (error) => {
                this.outputChannel.appendLine(`WebSocket Server error: ${error.message}`);
            });

            this.outputChannel.appendLine(`Roo WebSocket server started on port ${ROO_WEBSOCKET_PORT}`);
        } catch (error) {
            this.outputChannel.appendLine(`Failed to start WebSocket server: ${error}`);
        }
    }

    private setupCommands() {
        // Register Roo monitoring commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('the-new-fuse.roo.startMonitoring', () => {
                this.startMonitoring();
            }),

            vscode.commands.registerCommand('the-new-fuse.roo.stopMonitoring', () => {
                this.stopMonitoring();
            }),

            vscode.commands.registerCommand('the-new-fuse.roo.viewOutput', () => {
                this.outputChannel.show();
            }),

            vscode.commands.registerCommand('the-new-fuse.roo.clearData', () => {
                this.clearMonitoringData();
            }),

            vscode.commands.registerCommand('the-new-fuse.roo.getStats', () => {
                return this.getStats();
            })
        );
    }

    public startMonitoring(): void {
        if (this.monitoring) {
            vscode.window.showInformationMessage('Roo monitoring is already active');
            return;
        }

        this.monitoring = true;
        this.interceptRooOutput();
        this.outputChannel.appendLine('Roo monitoring started');
        
        // Notify agent communication system
        if (this.agentComm) {
            const message: AgentMessage = {
                id: `roo-monitor-start-${Date.now()}`,
                type: AgentMessageType.SYSTEM,
                source: 'roo-integration',
                payload: {
                    action: 'monitoring_started',
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
            this.agentComm.sendMessage(message);
        }

        vscode.window.showInformationMessage('Roo monitoring started');
    }

    public stopMonitoring(): void {
        if (!this.monitoring) {
            vscode.window.showInformationMessage('Roo monitoring is not active');
            return;
        }

        this.monitoring = false;
        this.outputChannel.appendLine('Roo monitoring stopped');
        
        // Notify agent communication system
        if (this.agentComm) {
            const message: AgentMessage = {
                id: `roo-monitor-stop-${Date.now()}`,
                type: AgentMessageType.SYSTEM,
                source: 'roo-integration',
                payload: {
                    action: 'monitoring_stopped',
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
            this.agentComm.sendMessage(message);
        }

        vscode.window.showInformationMessage('Roo monitoring stopped');
    }

    private interceptRooOutput() {
        if (!this.monitoring) {
            return;
        }

        // Try to find the Roo output channel
        const rooChannels = [
            'Roo Code',
            'Roo',
            'AI Coder',
            'Code Assistant'
        ];

        for (const channelName of rooChannels) {
            try {
                this.monitorOutputChannel(channelName);
            } catch (error) {
                // Channel might not exist yet
            }
        }

        // Monitor VS Code's output channels for Roo-related activity
        this.monitorVSCodeOutput();
    }

    private monitorOutputChannel(channelName: string) {
        // Create a monitoring output channel that intercepts Roo's output
        const monitoredChannel = vscode.window.createOutputChannel(channelName);
        
        // Override the append methods to intercept output
        const originalAppend = monitoredChannel.append.bind(monitoredChannel);
        const originalAppendLine = monitoredChannel.appendLine.bind(monitoredChannel);

        monitoredChannel.append = (value: string) => {
            if (this.monitoring) {
                this.captureOutput('output', value, 'roo');
            }
            return originalAppend(value);
        };

        monitoredChannel.appendLine = (value: string) => {
            if (this.monitoring) {
                this.captureOutput('output', value + '\n', 'roo');
            }
            return originalAppendLine(value);
        };
    }

    private monitorVSCodeOutput() {
        // Monitor file changes that might indicate Roo activity
        const watcher = vscode.workspace.createFileSystemWatcher('**/roo_output.txt');
        
        watcher.onDidChange(async (uri) => {
            if (this.monitoring) {
                try {
                    const content = await vscode.workspace.fs.readFile(uri);
                    const text = new TextDecoder().decode(content);
                    this.captureOutput('output', text, 'roo');
                } catch (error) {
                    // File might be locked or inaccessible
                }
            }
        });

        this.context.subscriptions.push(watcher);
    }

    private captureOutput(type: 'output' | 'error' | 'warning' | 'info', content: string, source: 'roo' | 'ai-coder'): void {
        const data: RooMonitoringData = {
            timestamp: Date.now(),
            type,
            content,
            source
        };

        this.monitoringData.push(data);
        
        // Prune old data
        if (this.monitoringData.length > this.maxMonitoringData) {
            this.monitoringData = this.monitoringData.slice(-this.maxMonitoringData);
        }

        // Broadcast to WebSocket connections
        this.broadcastOutput(data);

        // Send to agent communication system
        if (this.agentComm) {
            const message: AgentMessage = {
                id: `roo-output-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                type: type === 'error' ? AgentMessageType.ERROR : AgentMessageType.SYSTEM,
                source: 'roo-integration',
                payload: {
                    action: 'output_captured',
                    data
                },
                timestamp: Date.now()
            };
            this.agentComm.sendMessage(message);
        }
    }

    private broadcastOutput(data: RooMonitoringData): void {
        const message = JSON.stringify({
            type: 'output',
            data
        });

        this.connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(message);
                } catch (error) {
                    this.outputChannel.appendLine(`Failed to send to WebSocket: ${error}`);
                    this.connections.delete(ws);
                }
            }
        });
    }

    private handleIncomingWebSocketMessage(message: any): void {
        switch (message.type) {
            case 'get_history':
                // Send recent monitoring data
                const history = this.monitoringData.slice(-50);
                this.broadcastToSender(message.sender, {
                    type: 'history',
                    data: history
                });
                break;
                
            case 'clear_data':
                this.clearMonitoringData();
                break;
                
            case 'get_stats':
                this.broadcastToSender(message.sender, {
                    type: 'stats',
                    data: this.getStats()
                });
                break;
        }
    }

    private broadcastToSender(sender: WebSocket, message: any): void {
        if (sender && sender.readyState === WebSocket.OPEN) {
            try {
                sender.send(JSON.stringify(message));
            } catch (error) {
                this.outputChannel.appendLine(`Failed to send to sender: ${error}`);
            }
        }
    }

    public clearMonitoringData(): void {
        this.monitoringData = [];
        this.outputChannel.appendLine('Monitoring data cleared');
        
        // Broadcast clear event
        this.broadcastOutput({
            timestamp: Date.now(),
            type: 'info',
            content: 'Monitoring data cleared',
            source: 'roo'
        });
    }

    public getStats(): {
        monitoring: boolean;
        connections: number;
        dataPoints: number;
        port: number;
    } {
        return {
            monitoring: this.monitoring,
            connections: this.connections.size,
            dataPoints: this.monitoringData.length,
            port: ROO_WEBSOCKET_PORT
        };
    }

    public getMonitoringData(): RooMonitoringData[] {
        return [...this.monitoringData];
    }

    public dispose(): void {
        this.stopMonitoring();
        
        if (this.wss) {
            this.wss.close();
        }
        
        this.connections.forEach(ws => {
            ws.close();
        });
        
        this.connections.clear();
        this.outputChannel.dispose();
    }
}
