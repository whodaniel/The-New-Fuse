/**
 * File Transport for The New Fuse Relay System
 *
 * Based on relay-adapter.js:114 (file watching system)
 * Handles communication with CLI agents through file-based queues.
 */
import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
export class FileTransport extends EventEmitter {
    name = 'file';
    config;
    logger;
    watcher = null;
    messageHandlers = [];
    queueDir;
    constructor(config) {
        super();
        this.config = config;
        this.logger = config.logger;
        this.queueDir = path.join(this.config.workspaceDir, 'cli-relay-queue');
    }
    async start() {
        if (this.watcher) {
            this.logger.warn('File watcher is already running.');
            return true;
        }
        try {
            await fs.mkdir(this.queueDir, { recursive: true });
            this.watcher = chokidar.watch(path.join(this.queueDir, '*', 'outbox', '*.json'), {
                ignored: /\.|~$/,
                persistent: true,
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100,
                },
            });
            this.watcher.on('add', this.handleFileAdd.bind(this));
            this.logger.info(`File transport started, watching ${this.queueDir}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to start file transport: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
            this.logger.info('File transport stopped.');
        }
    }
    async send(message) {
        const targetId = message.target;
        if (!targetId) {
            this.logger.warn('Cannot send file message without a target.');
            return false;
        }
        try {
            const inboxDir = path.join(this.queueDir, targetId, 'inbox');
            await fs.mkdir(inboxDir, { recursive: true });
            const filePath = path.join(inboxDir, `${message.id}.json`);
            await fs.writeFile(filePath, JSON.stringify(message, null, 2));
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send file message to ${targetId}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
    isConnected() {
        return this.watcher !== null;
    }
    async handleFileAdd(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const message = JSON.parse(content);
            this.messageHandlers.forEach(handler => handler(message));
            await fs.unlink(filePath);
        }
        catch (error) {
            this.logger.error(`Error processing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
//# sourceMappingURL=FileTransport.js.map