export declare enum StateEventType {
    CREATED = "state.created",
    UPDATED = "state.updated",
    DELETED = "state.deleted",
    SNAPSHOT_CREATED = "(state as any).snapshot.created",
    TRANSACTION_RECORDED = "(state as any).transaction.recorded",
    SYNC_STARTED = "(state as any).sync.started",
    SYNC_COMPLETED = "(state as any).sync.completed",
    SYNC_FAILED = "(state as any).sync.failed",
    LOCK_ACQUIRED = "(state as any).lock.acquired",
    LOCK_RELEASED = "(state as any).lock.released"
}
export interface StateValue {
    id: string;
    key: string;
    value: unknown;
    version: number;
    timestamp: Date;
    metadata: Record<string, unknown>;
}
export interface StateSnapshot {
    id: string;
    stateId: string;
    value: Record<string, unknown>;
    timestamp: Date;
    metadata: Record<string, unknown>;
}
export interface StateTransaction {
    id: string;
    stateId: string;
    operation: 'create' | 'update' | 'delete';
    previousValue?: unknown;
    newValue?: unknown;
    timestamp: Date;
    metadata: Record<string, unknown>;
}
export interface StateEvent {
    id: string;
    type: StateEventType;
    stateId: string;
    payload?: unknown;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export interface StateChange {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    timestamp: Date;
}
export interface SyncOperation {
    key: string;
    value: unknown;
    options: SyncOptions;
    retryCount: number;
    lastAttempt: Date;
}
export interface SyncOptions {
    retryLimit?: number;
    retryDelay?: number;
    priority?: number;
    expiry?: number;
}
export interface StateLock {
    holder: string;
    acquired: Date;
    expires: Date;
    metadata: Record<string, unknown>;
}
export interface StateSchema {
    [key: string]: unknown;
}
export interface StateManagerOptions {
    persistenceEnabled?: boolean;
    snapshotInterval?: number;
    maxSnapshots?: number;
    lockTimeout?: number;
    syncEnabled?: boolean;
    validationSchema?: StateSchema;
}
export interface StateValidationError {
    key: string;
    message: string;
    path?: string[];
    value?: unknown;
}
export interface StateSyncData {
    id: string;
    key: string;
    value: string;
    timestamp: Date;
    status: string;
    retries: number;
    error: string | null;
}
//# sourceMappingURL=index.d.ts.map