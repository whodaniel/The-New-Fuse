import { JsonValue, DataMap } from './common-types.js';
export declare enum StateEventType {
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
    metadata: Record<string, JsonValue>;
}
export interface StateSnapshot<T = unknown> {
    id: string;
    stateId: string;
    value: T;
    version: number;
    timestamp: Date;
    lastUpdated: Date;
    metadata: Record<string, JsonValue>;
    hash?: string;
    parentSnapshotId?: string;
}
export interface StateTransaction {
    id: string;
    stateId: string;
    operation: 'create' | 'update' | 'delete';
    previousValue?: unknown;
    newValue?: unknown;
    timestamp: Date;
    metadata: Record<string, JsonValue>;
}
export interface StateEvent<T = unknown> {
    id: string;
    type: StateEventType;
    stateId: string;
    payload?: T;
    timestamp: Date;
    correlationId?: string;
    source?: string;
    metadata?: Record<string, JsonValue>;
    sequenceNumber?: number;
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
    metadata: Record<string, JsonValue>;
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
export interface StateQueryOptions {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
    sort?: 'asc' | 'desc';
    filter?: Record<string, JsonValue>;
}
export interface StateStats {
    totalKeys: number;
    totalSnapshots: number;
    totalTransactions: number;
    lastSnapshot?: Date;
    lastSync?: Date;
    memoryUsage: number;
}
export interface StateSyncData {
    id: string;
    key: string;
    value: Record<string, JsonValue>;
    version: number;
    timestamp: Date;
    status: 'pending' | 'completed' | 'failed';
    retries: number;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface State {
    id: string;
    name: string;
    data: DataMap;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, JsonValue>;
}
//# sourceMappingURL=state.d.d.ts.map