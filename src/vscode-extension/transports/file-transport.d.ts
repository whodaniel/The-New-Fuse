import * as vscode from 'vscode';
import { MessageTransport } from '../interfaces/message-transport.js';
import { AgentMessage } from '../agent-communication.js';
export declare class FileTransport implements MessageTransport {
    private readonly communicationDir;
    private fileWatcher;
    private handlers;
    constructor(workspaceRoot: string);
    initialize(): Promise<void>;
    sendMessage(message: AgentMessage): Promise<boolean>;
    subscribeToMessages(callback: (message: AgentMessage) => Promise<void>): vscode.Disposable;
    private setupFileWatcher;
    private handleMessageFile;
    dispose(): void;
}
//# sourceMappingURL=file-transport.d.ts.map