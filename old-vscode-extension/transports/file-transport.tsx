import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { MessageTransport } from '../interfaces/message-transport.js';
import { AgentMessage } from '../src/agent-communication.js';

export class FileTransport implements MessageTransport {
    private readonly communicationDir: string;
    private fileWatcher: vscode.FileSystemWatcher | null = null;
    private handlers: ((message: AgentMessage) => Promise<void>)[] = [];

    constructor(workspaceRoot: string) {
        this.communicationDir = path.join(workspaceRoot, '.thefuse', 'communication');
    }

    async initialize(): Promise<void> {
        await fs.mkdir(this.communicationDir, { recursive: true });
        this.setupFileWatcher();
    }

    async sendMessage(message: AgentMessage): Promise<boolean> {
        try {
            const fileName = `${Date.now()}-${message.id}.json`;
            const filePath = path.join(this.communicationDir, fileName);
            await fs.writeFile(filePath, JSON.stringify(message, null, 2));
            return true;
        } catch (error) {
            console.error('Failed to send message via file:', error);
            return false;
        }
    }

    subscribeToMessages(callback: (message: AgentMessage) => Promise<void>): vscode.Disposable {
        this.handlers.push(callback);
        return new vscode.Disposable(() => {
            this.handlers = this.handlers.filter(h => h !== callback);
        });
    }

    private setupFileWatcher() {
        const pattern = new vscode.RelativePattern(this.communicationDir, '*.json');
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        this.fileWatcher.onDidCreate(async (uri) => {
            await this.handleMessageFile(uri);
        });
    }

    private async handleMessageFile(uri: vscode.Uri) {
        try {
            const content = await fs.readFile(uri.fsPath, 'utf-8');
            const message: AgentMessage = JSON.parse(content);

            for (const handler of this.handlers) {
                await handler(message);
            }

            // Archive processed message
            const archivePath = path.join(this.communicationDir, 'archived');
            await fs.mkdir(archivePath, { recursive: true });
            await fs.rename(uri.fsPath, path.join(archivePath, path.basename(uri.fsPath)));
        } catch (error) {
            console.error('Error handling message file:', error);
        }
    }

    dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
        }
    }
}