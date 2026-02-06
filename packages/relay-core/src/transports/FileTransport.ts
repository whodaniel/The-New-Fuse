/**
 * File Transport for The New Fuse Relay System
 *
 * Based on relay-adapter.js:114 (file watching system)
 * Handles communication with CLI agents through file-based queues.
 */

import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { RelayMessage, Transport } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export interface FileTransportConfig {
  workspaceDir: string;
  logger: Logger;
}

export class FileTransport extends EventEmitter implements Transport {
  public readonly name = 'file';
  private config: FileTransportConfig;
  private logger: Logger;
  private watcher: chokidar.FSWatcher | null = null;
  private messageHandlers: ((message: RelayMessage) => void)[] = [];
  private queueDir: string;

  constructor(config: FileTransportConfig) {
    super();
    this.config = config;
    this.logger = config.logger;
    this.queueDir = path.join(this.config.workspaceDir, 'cli-relay-queue');
  }

  async start(): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(
        `Failed to start file transport: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.logger.info('File transport stopped.');
    }
  }

  async send(message: RelayMessage): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(
        `Failed to send file message to ${targetId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  onMessage(handler: (message: RelayMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.watcher !== null;
  }

  private async handleFileAdd(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const message: RelayMessage = JSON.parse(content);
      this.messageHandlers.forEach((handler) => handler(message));
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.error(
        `Error processing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
