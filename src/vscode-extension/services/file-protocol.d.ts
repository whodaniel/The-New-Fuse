/// <reference types="node" />
import { EventEmitter } from 'events';
import { FileProtocolMessage } from '../types/shared.js';
export declare class FileProtocolService extends EventEmitter {
    private static instance;
    private logger;
    private communicationDir;
    private fileWatcher;
    private secretKey;
    private processedMessages;
    private readonly maxProcessedMessages;
    private constructor();
    static getInstance(): FileProtocolService;
    private getConfiguredDirectory;
    private generateOrGetSecretKey;
    initialize(): Promise<boolean>;
    private handleFileChange;
    private verifyMessageSignature;
    private createMessageSignature;
    sendMessage(recipient: string, action: string, payload: any): Promise<FileProtocolMessage>;
    private writeMessage;
    dispose(): void;
}
//# sourceMappingURL=file-protocol.d.ts.map