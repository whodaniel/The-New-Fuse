import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { AgentMessage, AgentMessageType } from '../types/agent-communication';

export class AgentCommunicationService {
    private eventEmitter = new EventEmitter();
    private registeredAgents = new Map<string, any>();
    private webviews = new Set<vscode.Webview>();
    private connected = false;

    constructor(private context: vscode.ExtensionContext) {
        this.connected = true; // Assume connected for now
    }

    public subscribe(callback: (message: AgentMessage) => void): void {
        this.eventEmitter.on('message', callback);
    }

    public sendMessage(message: AgentMessage): void {
        this.eventEmitter.emit('message', message);
        this.broadcastToWebviews('agent-message', message);
    }

    public broadcastMessage(type: AgentMessageType, payload: any): Promise<void> {
        const message: AgentMessage = {
            id: this.generateId(),
            type,
            source: 'system',
            payload,
            timestamp: Date.now()
        };
        
        this.eventEmitter.emit('message', message);
        this.broadcastToWebviews(type, payload);
        return Promise.resolve();
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public registerWebview(webview: vscode.Webview): void {
        this.webviews.add(webview);
    }

    public onMessage(callback: (message: any) => void): void {
        this.eventEmitter.on('message', callback);
    }

    public getRegisteredAgents(): any[] {
        return Array.from(this.registeredAgents.values());
    }

    public registerAgent(agentId: string, agent: any): void {
        this.registeredAgents.set(agentId, agent);
    }

    public unregisterAgent(agentId: string): void {
        this.registeredAgents.delete(agentId);
    }

    private broadcastToWebviews(type: string, payload: any): void {
        const message = { type, payload };
        this.webviews.forEach(webview => {
            try {
                webview.postMessage(message);
            } catch (error) {
                console.error('Failed to send message to webview:', error);
            }
        });
    }

    private generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    public removeAllListeners(): void {
        this.eventEmitter.removeAllListeners();
    }

    public registerFunction(name: string, handler: (...args: any[]) => void): void {
        this.eventEmitter.on(name, handler);
    }

    public on(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public dispose(): void {
        this.eventEmitter.removeAllListeners();
        this.registeredAgents.clear();
        this.webviews.clear();
        this.connected = false;
    }
}
