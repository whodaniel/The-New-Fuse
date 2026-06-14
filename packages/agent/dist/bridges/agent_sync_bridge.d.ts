/**
 * Agent Sync Bridge - Agent state synchronization
 *
 * Provides synchronization capabilities between agents:
 * - State synchronization
 * - Conflict resolution
 * - Distributed locking
 * - Event sourcing
 */
import { BaseBridge, MessageType, Priority } from './index.js';
export interface SyncState {
    agentId: string;
    version: number;
    data: Record<string, unknown>;
    timestamp: Date;
    checksum: string;
}
export interface SyncEvent {
    id: string;
    agentId: string;
    type: 'create' | 'update' | 'delete';
    path: string;
    value?: unknown;
    previousValue?: unknown;
    version: number;
    timestamp: Date;
}
export interface Lock {
    id: string;
    resource: string;
    holder: string;
    acquiredAt: Date;
    expiresAt: Date;
    renewable: boolean;
}
export interface ConflictResolution {
    strategy: 'last-write-wins' | 'first-write-wins' | 'merge' | 'manual';
    resolver?: (local: unknown, remote: unknown) => unknown;
}
export declare class AgentSyncBridge extends BaseBridge {
    private states;
    private events;
    private locks;
    private subscribers;
    private conflictResolution;
    private lockCleanupInterval;
    private maxEventsSize;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Get current state for an agent
     */
    getState(agentId: string): SyncState | undefined;
    /**
     * Update state for an agent
     */
    syncState(agentId: string, data: Record<string, unknown>): Promise<SyncState>;
    /**
     * Patch state (partial update)
     */
    patchState(agentId: string, path: string, value: unknown): Promise<SyncState>;
    /**
     * Delete an agent's state
     */
    deleteState(agentId: string): Promise<void>;
    /**
     * Set conflict resolution strategy
     */
    setConflictResolution(resolution: ConflictResolution): void;
    /**
     * Detect if there's a conflict
     */
    private detectConflict;
    /**
     * Resolve conflict based on strategy
     */
    private resolveConflict;
    /**
     * Acquire a lock on a resource
     */
    acquireLock(resource: string, holder: string, ttlMs?: number): Promise<Lock | null>;
    /**
     * Release a lock
     */
    releaseLock(resource: string, holder: string): Promise<boolean>;
    /**
     * Check if resource is locked
     */
    isLocked(resource: string): boolean;
    /**
     * Get lock holder
     */
    getLockHolder(resource: string): string | null;
    /**
     * Start lock cleanup
     */
    private startLockCleanup;
    /**
     * Stop lock cleanup
     */
    private stopLockCleanup;
    /**
     * Subscribe to sync events
     */
    subscribeToEvents(agentId: string, handler: (event: SyncEvent) => void): void;
    /**
     * Unsubscribe from events
     */
    unsubscribeFromEvents(agentId: string): void;
    /**
     * Get events for an agent
     */
    getEventsForAgent(agentId: string, limit?: number): SyncEvent[];
    /**
     * Create a sync event
     */
    private createEvent;
    /**
     * Record an event
     */
    private recordEvent;
    private calculateChecksum;
    private getValueAtPath;
    private setValueAtPath;
    private deepMerge;
    getStatistics(): {
        connected: boolean;
        agents: number;
        locks: number;
        events: number;
        subscribers: number;
    };
}
export default AgentSyncBridge;
//# sourceMappingURL=agent_sync_bridge.d.ts.map