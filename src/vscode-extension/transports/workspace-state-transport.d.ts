import * as vscode from 'vscode';
import { MessageTransport } from '../interfaces/message-transport.js';
import { AgentMessage } from '../agent-communication.js';
export declare class WorkspaceStateTransport implements MessageTransport {
    private readonly context;
    private readonly messageKey;
    private pollInterval;
    constructor(context: vscode.ExtensionContext);
    initialize(): Promise<void>;
    sendMessage(message: AgentMessage): Promise<boolean>;
    subscribeToMessages(callback: (message: AgentMessage) => Promise<void>): vscode.Disposable;
    private startPolling;
    dispose(): void;
}
//# sourceMappingURL=workspace-state-transport.d.ts.map