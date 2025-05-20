import * as vscode from 'vscode';
import { MessageTransport } from './interfaces/message-transport.js';
import { WorkspaceStateTransport } from './transports/workspace-state-transport.js';
import { FileTransport } from './transports/file-transport.js';
import { AgentMessage } from './src/agent-communication.js';

export class CommunicationManager {
    private transports: MessageTransport[] = [];
    private messageHandlers: ((message: AgentMessage) => Promise<void>)[] = [];

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly workspaceRoot: string
    ) {}

    async initialize(): Promise<void> {
        // Initialize transports
        const workspaceTransport = new WorkspaceStateTransport(this.context);
        const fileTransport = new FileTransport(this.workspaceRoot);

        this.transports = [workspaceTransport, fileTransport];

        // Initialize all transports
        await Promise.all(this.transports.map(t => t.initialize()));

        // Subscribe to messages from all transports
        this.transports.forEach(transport => {
            transport.subscribeToMessages(async (message) => {
                await this.handleMessage(message);
            });
        });
    }

    async sendMessage(message: AgentMessage): Promise<boolean> {
        // Try each transport until one succeeds
        for (const transport of this.transports) {
            try {
                const success = await transport.sendMessage(message);
                if (success) {
                    return true;
                }
            } catch (error) {
                console.error('Transport failed:', error);
            }
        }
        return false;
    }

    onMessage(handler: (message: AgentMessage) => Promise<void>): vscode.Disposable {
        this.messageHandlers.push(handler);
        return new vscode.Disposable(() => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        });
    }

    private async handleMessage(message: AgentMessage): Promise<void> {
        for (const handler of this.messageHandlers) {
            try {
                await handler(message);
            } catch (error) {
                console.error('Message handler failed:', error);
            }
        }
    }

    dispose(): void {
        this.transports.forEach(t => t.dispose());
        this.transports = [];
        this.messageHandlers = [];
    }
}