import * as vscode from 'vscode';
import { MessageTransport } from '../interfaces/message-transport.js';
import { AgentMessage } from '../agent-communication.js';

// Define an interface for AgentMessage with the processed property
interface ProcessedAgentMessage extends AgentMessage {
    processed?: boolean;
}

export class WorkspaceStateTransport implements MessageTransport {
    private readonly context: vscode.ExtensionContext;
    private readonly messageKey = 'thefuse.messages';
    private pollInterval: ReturnType<typeof setInterval> | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async initialize(): Promise<void> {
        this.startPolling();
    }

    async sendMessage(message: AgentMessage): Promise<boolean> {
        try {
            const messages = this.context.workspaceState.get<AgentMessage[]>(this.messageKey, []);
            messages.push(message);
            await this.context.workspaceState.update(this.messageKey, messages);
            return true;
        } catch (error) {
            console.error('Failed to send message via workspace state:', error);
            return false;
        }
    }

    subscribeToMessages(callback: (message: AgentMessage) => Promise<void>): vscode.Disposable {
        const handler = async () => {
            const messages = this.context.workspaceState.get<ProcessedAgentMessage[]>(this.messageKey, []);
            const unprocessedMessages = messages.filter(m => !m.processed);
            
            for (const message of unprocessedMessages) {
                await callback(message);
                message.processed = true;
            }
            
            await this.context.workspaceState.update(this.messageKey, messages);
        };

        this.startPolling(handler);

        return new vscode.Disposable(() => {
            if (this.pollInterval) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            }
        });
    }

    private startPolling(handler?: () => Promise<void>) {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        if (handler) {
            this.pollInterval = setInterval(handler, 1000);
        }
    }

    dispose(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
}