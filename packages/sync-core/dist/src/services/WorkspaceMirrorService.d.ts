import { EventEmitter } from 'events';
export interface WorkspaceMirrorConfig {
    localPath: string;
    remoteEndpoint: string;
    tenantId?: string;
    ignorePatterns?: string[];
    syncIntervalMs?: number;
}
export interface FileChange {
    type: 'add' | 'change' | 'unlink' | 'unlinkDir';
    path: string;
    content?: string;
    timestamp: number;
}
/**
 * WorkspaceMirrorService
 *
 * Provides real-time, two-way file mirroring between a local workspace
 * and the remote cloud sandbox. Functions as a high-performance sync daemon, giving
 * the cloud execution environment a complete, real-time view of local files.
 */
export declare class WorkspaceMirrorService extends EventEmitter {
    private watcher;
    private config;
    private isConnected;
    private pendingChanges;
    private syncTimer;
    constructor(config: WorkspaceMirrorConfig);
    /**
     * Start the mirroring daemon
     */
    start(): Promise<void>;
    /**
     * Stop the mirroring daemon
     */
    stop(): Promise<void>;
    private connectToRemote;
    private disconnectFromRemote;
    private handleLocalChange;
    /**
     * Flush pending local changes to the remote cloud sandbox
     */
    private flushChanges;
    /**
     * Apply changes received from the cloud sandbox to the local filesystem
     */
    private applyRemoteChange;
    simulateRemoteChange(change: FileChange): void;
}
//# sourceMappingURL=WorkspaceMirrorService.d.ts.map