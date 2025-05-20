import * as vscode from 'vscode';
import { AgentMessage } from '../src/agent-communication.js';

export interface MessageTransport {
    initialize(): Promise<void>;
    sendMessage(message: AgentMessage): Promise<boolean>;
    subscribeToMessages(callback: (message: AgentMessage) => Promise<void>): vscode.Disposable;
    dispose(): void;
}