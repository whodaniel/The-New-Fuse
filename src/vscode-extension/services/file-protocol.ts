import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { getLogger, Logger } from '../src/core/logging.js';
import { FileProtocolMessage } from '../types/shared.js';

export class FileProtocolService extends EventEmitter {
    private static instance: FileProtocolService;
    private logger: Logger;
    private communicationDir: string;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private secretKey: string;
    private processedMessages: Set<string> = new Set();
    private readonly maxProcessedMessages: number = 1000;

    private constructor() {
        super();
        this.logger = Logger.getInstance();
        this.communicationDir = this.getConfiguredDirectory();
        this.secretKey = this.generateOrGetSecretKey();
    }

    public static getInstance(): FileProtocolService {
        if (!FileProtocolService.instance) {
            FileProtocolService.instance = new FileProtocolService();
        }
        return FileProtocolService.instance;
    }

    private getConfiguredDirectory(): string {
        const config = vscode.workspace.getConfiguration('thefuse');
        return config.get<string>('fileProtocolDir', 'ai-communication');
    }

    private generateOrGetSecretKey(): string {
        const config = vscode.workspace.getConfiguration('thefuse');
        let key = config.get<string>('fileProtocolKey');
        
        if (!key) {
            key = crypto.randomBytes(32).toString('hex');
            config.update('fileProtocolKey', key, true);
        }
        
        return key;
    }

    public async initialize(): Promise<boolean> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder is open');
            }

            const communicationPath = path.join(workspaceFolder.uri.fsPath, this.communicationDir);

            // Ensure communication directory exists
            if (!fs.existsSync(communicationPath)) {
                fs.mkdirSync(communicationPath, { recursive: true });
            }

            // Set up file watcher
            const pattern = new vscode.RelativePattern(communicationPath, '*.json');
            this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

            this.fileWatcher.onDidCreate(uri => this.handleFileChange(uri));
            this.fileWatcher.onDidChange(uri => this.handleFileChange(uri));

            this.logger.info('File protocol service initialized');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize file protocol service:', error);
            return false;
        }
    }

    private async handleFileChange(uri: vscode.Uri): Promise<void> {
        try {
            const content = await fs.promises.readFile(uri.fsPath, 'utf8');
            const message: FileProtocolMessage = JSON.parse(content);

            // Skip if already processed
            if (this.processedMessages.has(message.id)) {
                return;
            }

            // Verify signature
            if (!this.verifyMessageSignature(message)) {
                this.logger.warn(`Invalid signature for message ${message.id}`);
                return;
            }

            // Add to processed messages and maintain size limit
            this.processedMessages.add(message.id);
            if (this.processedMessages.size > this.maxProcessedMessages) {
                const [firstKey] = this.processedMessages;
                this.processedMessages.delete(firstKey);
            }

            // Emit message event
            this.emit('message', message);

            // Update message status
            message.status = 'processed';
            await this.writeMessage(message);

        } catch (error) {
            this.logger.error('Error handling file change:', error);
        }
    }

    private verifyMessageSignature(message: FileProtocolMessage): boolean {
        if (!message.signature) return false;

        const dataToVerify = JSON.stringify({
            id: message.id,
            sender: message.sender,
            recipient: message.recipient,
            action: message.action,
            payload: message.payload,
            timestamp: message.timestamp
        });

        const expectedSignature = crypto
            .createHmac('sha256', this.secretKey)
            .update(dataToVerify)
            .digest('hex');

        return message.signature === expectedSignature;
    }

    private createMessageSignature(message: Omit<FileProtocolMessage, 'signature'>): string {
        const dataToSign = JSON.stringify({
            id: message.id,
            sender: message.sender,
            recipient: message.recipient,
            action: message.action,
            payload: message.payload,
            timestamp: message.timestamp
        });

        return crypto
            .createHmac('sha256', this.secretKey)
            .update(dataToSign)
            .digest('hex');
    }

    public async sendMessage(
        recipient: string,
        action: string,
        payload: any
    ): Promise<FileProtocolMessage> {
        try {
            const message: FileProtocolMessage = {
                id: uuidv4(),
                sender: 'vscode',
                recipient,
                action,
                payload,
                timestamp: Date.now(),
                status: 'pending'
            };

            message.signature = this.createMessageSignature(message);
            await this.writeMessage(message);
            return message;
        } catch (error) {
            this.logger.error('Failed to send message:', error);
            throw error;
        }
    }

    private async writeMessage(message: FileProtocolMessage): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder is open');
        }

        const filePath = path.join(
            workspaceFolder.uri.fsPath,
            this.communicationDir,
            `${message.id}.json`
        );

        await fs.promises.writeFile(filePath, JSON.stringify(message, null, 2));
    }

    public dispose(): void {
        this.fileWatcher?.dispose();
        this.removeAllListeners();
        this.processedMessages.clear();
    }
}