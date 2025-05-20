import * as vscode from 'vscode';
import { AgentMessage } from './agent-communication.js';
export declare class CommunicationManager {
    private readonly context;
    private readonly workspaceRoot;
    private transports;
    private messageHandlers;
    constructor(context: vscode.ExtensionContext, workspaceRoot: string);
    initialize(): Promise<void>;
    sendMessage(message: AgentMessage): Promise<boolean>;
    onMessage(handler: (message: AgentMessage) => Promise<void>): vscode.Disposable;
    private handleMessage;
    dispose(): void;
}
//# sourceMappingURL=communication-manager.d.ts.map