/**
 * File Transport for The New Fuse Relay System
 *
 * Based on relay-adapter.js:114 (file watching system)
 * Handles communication with CLI agents through file-based queues.
 */
import { EventEmitter } from 'events';
import { Transport, RelayMessage } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export interface FileTransportConfig {
    workspaceDir: string;
    logger: Logger;
}
export declare class FileTransport extends EventEmitter implements Transport {
    readonly name = "file";
    private config;
    private logger;
    private watcher;
    private messageHandlers;
    private queueDir;
    constructor(config: FileTransportConfig);
    start(): Promise<boolean>;
    stop(): Promise<void>;
    send(message: RelayMessage): Promise<boolean>;
    onMessage(handler: (message: RelayMessage) => void): void;
    isConnected(): boolean;
    private handleFileAdd;
}
//# sourceMappingURL=FileTransport.d.ts.map