import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { AgentMessage, AgentMessageType } from '../types/agent-communication';

export interface FileProtocolMessage {
    id: string;
    timestamp: number;
    source: string;
    recipient?: string;
    type: string;
    payload: any;
    signature?: string;
}

/**
 * File-based communication protocol for inter-agent messaging
 * Migrated from old-vscode-extension/services/file-protocol.ts
 */
export class FileProtocolService extends EventEmitter {
    private static instance: FileProtocolService;
    private communicationDir: string;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private secretKey: string;
    private processedMessages: Set<string> = new Set();
    private readonly maxProcessedMessages: number = 1000;
    private readonly messageTimeout: number = 300000; // 5 minutes

    private constructor(private context: vscode.ExtensionContext) {
        super();
        this.communicationDir = this.getConfiguredDirectory();
        this.secretKey = this.generateOrGetSecretKey();
    }

    public static getInstance(context?: vscode.ExtensionContext): FileProtocolService {
        if (!FileProtocolService.instance && context) {
            FileProtocolService.instance = new FileProtocolService(context);
        }
        return FileProtocolService.instance;
    }

    private getConfiguredDirectory(): string {
        const config = vscode.workspace.getConfiguration('the-new-fuse');
        const defaultDir = path.join(require('os').homedir(), '.the-new-fuse', 'ai-communication');
        return config.get<string>('fileProtocolDir', defaultDir);
    }

    private generateOrGetSecretKey(): string {
        const config = vscode.workspace.getConfiguration('the-new-fuse');
        let key = config.get<string>('fileProtocolKey');
        
        if (!key) {
            key = crypto.randomBytes(32).toString('hex');
            config.update('fileProtocolKey', key, vscode.ConfigurationTarget.Global);
        }
        
        return key;
    }

    public async initialize(): Promise<boolean> {
        try {
            // Ensure communication directory exists
            if (!fs.existsSync(this.communicationDir)) {
                fs.mkdirSync(this.communicationDir, { recursive: true });
            }

            // Set up file watcher for incoming messages
            this.setupFileWatcher();

            // Clean up old messages
            await this.cleanupOldMessages();

            console.log(`File protocol initialized in: ${this.communicationDir}`);
            return true;
        } catch (error) {
            console.error('Failed to initialize file protocol:', error);
            return false;
        }
    }

    private setupFileWatcher(): void {
        // Clean up existing watcher
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }

        const watchPattern = new vscode.RelativePattern(this.communicationDir, '*.json');
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(watchPattern);

        this.fileWatcher.onDidCreate(async (uri) => {
            await this.handleIncomingMessage(uri.fsPath);
        });

        this.fileWatcher.onDidChange(async (uri) => {
            await this.handleIncomingMessage(uri.fsPath);
        });
    }

    public async sendMessage(message: AgentMessage): Promise<void> {
        const fileMessage: FileProtocolMessage = {
            id: message.id,
            timestamp: message.timestamp,
            source: message.source,
            recipient: message.recipient,
            type: message.type,
            payload: message.payload || { content: message.content }
        };

        // Add signature for security
        fileMessage.signature = this.signMessage(fileMessage);

        const filename = `${fileMessage.id}_${Date.now()}.json`;
        const filepath = path.join(this.communicationDir, filename);

        try {
            await fs.promises.writeFile(filepath, JSON.stringify(fileMessage, null, 2));
            console.log(`Message sent via file protocol: ${filepath}`);
        } catch (error) {
            console.error('Failed to send message via file protocol:', error);
            throw error;
        }
    }

    private async handleIncomingMessage(filepath: string): Promise<void> {
        try {
            // Wait a bit to ensure file is fully written
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!fs.existsSync(filepath)) {
                return;
            }

            const content = await fs.promises.readFile(filepath, 'utf8');
            const fileMessage: FileProtocolMessage = JSON.parse(content);

            // Check if we've already processed this message
            if (this.processedMessages.has(fileMessage.id)) {
                return;
            }

            // Verify message signature
            if (!this.verifyMessage(fileMessage)) {
                console.warn(`Invalid message signature: ${fileMessage.id}`);
                return;
            }

            // Check message age
            if (Date.now() - fileMessage.timestamp > this.messageTimeout) {
                console.warn(`Message too old: ${fileMessage.id}`);
                await this.deleteMessageFile(filepath);
                return;
            }

            // Convert to AgentMessage format
            const agentMessage: AgentMessage = {
                id: fileMessage.id,
                type: fileMessage.type as AgentMessageType,
                source: fileMessage.source,
                recipient: fileMessage.recipient,
                timestamp: fileMessage.timestamp,
                payload: fileMessage.payload,
                metadata: {
                    source: 'file-protocol',
                    filepath: filepath
                }
            };

            // Mark as processed
            this.processedMessages.add(fileMessage.id);
            this.pruneProcessedMessages();

            // Emit the message
            this.emit('message', agentMessage);

            // Clean up the file after processing
            setTimeout(async () => {
                await this.deleteMessageFile(filepath);
            }, 5000);

        } catch (error) {
            console.error('Failed to handle incoming message:', error);
        }
    }

    private signMessage(message: FileProtocolMessage): string {
        const messageString = JSON.stringify({
            id: message.id,
            timestamp: message.timestamp,
            source: message.source,
            recipient: message.recipient,
            type: message.type,
            payload: message.payload
        });
        
        return crypto.createHmac('sha256', this.secretKey)
            .update(messageString)
            .digest('hex');
    }

    private verifyMessage(message: FileProtocolMessage): boolean {
        if (!message.signature) {
            return false;
        }

        const expectedSignature = this.signMessage(message);
        return crypto.timingSafeEqual(
            Buffer.from(message.signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    private async deleteMessageFile(filepath: string): Promise<void> {
        try {
            if (fs.existsSync(filepath)) {
                await fs.promises.unlink(filepath);
            }
        } catch (error) {
            console.error('Failed to delete message file:', error);
        }
    }

    private async cleanupOldMessages(): Promise<void> {
        try {
            const files = await fs.promises.readdir(this.communicationDir);
            const now = Date.now();

            for (const file of files) {
                if (!file.endsWith('.json')) {
                    continue;
                }

                const filepath = path.join(this.communicationDir, file);
                const stats = await fs.promises.stat(filepath);
                
                // Delete files older than timeout period
                if (now - stats.mtime.getTime() > this.messageTimeout) {
                    await this.deleteMessageFile(filepath);
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old messages:', error);
        }
    }

    private pruneProcessedMessages(): void {
        if (this.processedMessages.size > this.maxProcessedMessages) {
            // Convert to array, remove oldest half, convert back to Set
            const messagesArray = Array.from(this.processedMessages);
            const toKeep = messagesArray.slice(messagesArray.length - Math.floor(this.maxProcessedMessages / 2));
            this.processedMessages = new Set(toKeep);
        }
    }

    public getStats(): {
        communicationDir: string;
        processedMessages: number;
        isWatching: boolean;
    } {
        return {
            communicationDir: this.communicationDir,
            processedMessages: this.processedMessages.size,
            isWatching: !!this.fileWatcher
        };
    }

    public dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        this.removeAllListeners();
    }
}
