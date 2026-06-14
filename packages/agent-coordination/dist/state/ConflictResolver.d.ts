import { EventEmitter } from 'events';
/**
 * Conflict resolution strategies
 */
export declare enum ConflictStrategy {
    LAST_WRITE_WINS = "last-write-wins",
    FIRST_WRITE_WINS = "first-write-wins",
    CUSTOM = "custom",
    MERGE = "merge",
    VOTE = "vote"
}
/**
 * State update with metadata
 */
export interface StateUpdate<T = any> {
    key: string;
    value: T;
    agentId: string;
    timestamp: Date;
    version: number;
    metadata?: Record<string, any>;
}
/**
 * Conflict resolution result
 */
export interface ConflictResolution<T = any> {
    resolved: boolean;
    value: T;
    strategy: ConflictStrategy;
    winningUpdate?: StateUpdate<T>;
    conflictingUpdates: StateUpdate<T>[];
}
/**
 * Custom conflict resolver function
 */
export type ConflictResolverFn<T = any> = (updates: StateUpdate<T>[]) => StateUpdate<T>;
/**
 * Conflict resolver for managing concurrent state updates
 */
export declare class ConflictResolver extends EventEmitter {
    private defaultStrategy;
    private customResolvers;
    private stateVersions;
    constructor(defaultStrategy?: ConflictStrategy);
    /**
     * Register a custom resolver for a specific key pattern
     */
    registerResolver(keyPattern: string, resolver: ConflictResolverFn): void;
    /**
     * Resolve conflicts between multiple state updates
     */
    resolve<T>(updates: StateUpdate<T>[], strategy?: ConflictStrategy): ConflictResolution<T>;
    /**
     * Last write wins strategy
     */
    private lastWriteWins;
    /**
     * First write wins strategy
     */
    private firstWriteWins;
    /**
     * Merge updates (for objects)
     */
    private mergeUpdates;
    /**
     * Vote on updates (majority wins)
     */
    private voteOnUpdates;
    /**
     * Apply custom resolver
     */
    private applyCustomResolver;
    /**
     * Deep merge two objects
     */
    private deepMerge;
    /**
     * Check if value is an object
     */
    private isObject;
    /**
     * Match key against pattern (supports wildcards)
     */
    private matchesPattern;
    /**
     * Validate state update
     */
    validateUpdate<T>(update: StateUpdate<T>): boolean;
    /**
     * Apply state update with conflict detection
     */
    applyUpdate<T>(update: StateUpdate<T>, pendingUpdates?: StateUpdate<T>[]): ConflictResolution<T>;
    /**
     * Get current version for a key
     */
    getVersion(key: string): number;
    /**
     * Increment version for a key
     */
    incrementVersion(key: string): number;
    /**
     * Clear all versions
     */
    clear(): void;
}
//# sourceMappingURL=ConflictResolver.d.ts.map