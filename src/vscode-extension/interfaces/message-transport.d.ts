import * as vscode from 'vscode';
import { AgentMessage } from '../agent-communication.js';
export interface MessageTransport {
    initialize(): Promise<void>;
    sendMessage(message: AgentMessage): Promise<boolean>;
    subscribeToMessages(callback: (message: AgentMessage) => Promise<void>): vscode.Disposable;
    dispose(): void;
}
//# sourceMappingURL=message-transport.d.ts.map