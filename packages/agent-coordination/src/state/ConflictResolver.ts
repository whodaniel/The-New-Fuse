import { EventEmitter } from 'events';

/**
 * Conflict resolution strategies
 */
export enum ConflictStrategy {
  LAST_WRITE_WINS = 'last-write-wins',
  FIRST_WRITE_WINS = 'first-write-wins',
  CUSTOM = 'custom',
  MERGE = 'merge',
  VOTE = 'vote',
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
export class ConflictResolver extends EventEmitter {
  private defaultStrategy: ConflictStrategy;
  private customResolvers: Map<string, ConflictResolverFn> = new Map();
  private stateVersions: Map<string, number> = new Map();

  constructor(defaultStrategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS) {
    super();
    this.defaultStrategy = defaultStrategy;
  }

  /**
   * Register a custom resolver for a specific key pattern
   */
  registerResolver(keyPattern: string, resolver: ConflictResolverFn): void {
    this.customResolvers.set(keyPattern, resolver);
  }

  /**
   * Resolve conflicts between multiple state updates
   */
  resolve<T>(updates: StateUpdate<T>[], strategy?: ConflictStrategy): ConflictResolution<T> {
    if (updates.length === 0) {
      throw new Error('No updates to resolve');
    }

    if (updates.length === 1) {
      return {
        resolved: true,
        value: updates[0].value,
        strategy: strategy || this.defaultStrategy,
        winningUpdate: updates[0],
        conflictingUpdates: [],
      };
    }

    const resolveStrategy = strategy || this.defaultStrategy;
    let winningUpdate: StateUpdate<T>;

    switch (resolveStrategy) {
      case ConflictStrategy.LAST_WRITE_WINS:
        winningUpdate = this.lastWriteWins(updates);
        break;

      case ConflictStrategy.FIRST_WRITE_WINS:
        winningUpdate = this.firstWriteWins(updates);
        break;

      case ConflictStrategy.MERGE:
        winningUpdate = this.mergeUpdates(updates);
        break;

      case ConflictStrategy.VOTE:
        winningUpdate = this.voteOnUpdates(updates);
        break;

      case ConflictStrategy.CUSTOM:
        winningUpdate = this.applyCustomResolver(updates);
        break;

      default:
        winningUpdate = this.lastWriteWins(updates);
    }

    const resolution: ConflictResolution<T> = {
      resolved: true,
      value: winningUpdate.value,
      strategy: resolveStrategy,
      winningUpdate,
      conflictingUpdates: updates.filter((u) => u !== winningUpdate),
    };

    this.emit('conflict:resolved', resolution);
    return resolution;
  }

  /**
   * Last write wins strategy
   */
  private lastWriteWins<T>(updates: StateUpdate<T>[]): StateUpdate<T> {
    return updates.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  /**
   * First write wins strategy
   */
  private firstWriteWins<T>(updates: StateUpdate<T>[]): StateUpdate<T> {
    return updates.reduce((earliest, current) =>
      current.timestamp < earliest.timestamp ? current : earliest
    );
  }

  /**
   * Merge updates (for objects)
   */
  private mergeUpdates<T>(updates: StateUpdate<T>[]): StateUpdate<T> {
    // Sort by timestamp
    const sorted = [...updates].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Merge values (deep merge for objects)
    let mergedValue = sorted[0].value;

    for (let i = 1; i < sorted.length; i++) {
      mergedValue = this.deepMerge(mergedValue, sorted[i].value);
    }

    return {
      ...sorted[sorted.length - 1],
      value: mergedValue,
      metadata: {
        ...sorted[sorted.length - 1].metadata,
        mergedFrom: sorted.map((u) => u.agentId),
      },
    };
  }

  /**
   * Vote on updates (majority wins)
   */
  private voteOnUpdates<T>(updates: StateUpdate<T>[]): StateUpdate<T> {
    const votes = new Map<string, { count: number; update: StateUpdate<T> }>();

    for (const update of updates) {
      const valueKey = JSON.stringify(update.value);
      const existing = votes.get(valueKey);

      if (existing) {
        existing.count++;
      } else {
        votes.set(valueKey, { count: 1, update });
      }
    }

    // Find value with most votes
    let maxVotes = 0;
    let winner = updates[0];

    for (const { count, update } of votes.values()) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = update;
      }
    }

    return winner;
  }

  /**
   * Apply custom resolver
   */
  private applyCustomResolver<T>(updates: StateUpdate<T>[]): StateUpdate<T> {
    const key = updates[0].key;

    // Find matching custom resolver
    for (const [pattern, resolver] of this.customResolvers.entries()) {
      if (this.matchesPattern(key, pattern)) {
        return resolver(updates);
      }
    }

    // Fallback to last write wins
    return this.lastWriteWins(updates);
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: T): T {
    if (!this.isObject(target) || !this.isObject(source)) {
      return source;
    }

    const result = { ...target } as any;

    for (const key in source) {
      const sourceValue = (source as any)[key];
      const targetValue = (target as any)[key];

      if (this.isObject(sourceValue) && this.isObject(targetValue)) {
        result[key] = this.deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }

    return result as T;
  }

  /**
   * Check if value is an object
   */
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Match key against pattern (supports wildcards)
   */
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(key);
  }

  /**
   * Validate state update
   */
  validateUpdate<T>(update: StateUpdate<T>): boolean {
    const currentVersion = this.stateVersions.get(update.key) || 0;

    if (update.version <= currentVersion) {
      this.emit('update:rejected', update, 'Stale version');
      return false;
    }

    return true;
  }

  /**
   * Apply state update with conflict detection
   */
  applyUpdate<T>(
    update: StateUpdate<T>,
    pendingUpdates: StateUpdate<T>[] = []
  ): ConflictResolution<T> {
    // Check for conflicts
    const conflicts = pendingUpdates.filter(
      (u) => u.key === update.key && u.agentId !== update.agentId
    );

    if (conflicts.length > 0) {
      // Resolve conflict
      const allUpdates = [update, ...conflicts];
      const resolution = this.resolve(allUpdates);

      // Update version
      if (resolution.winningUpdate) {
        this.stateVersions.set(update.key, resolution.winningUpdate.version);
      }

      return resolution;
    }

    // No conflict, apply update
    this.stateVersions.set(update.key, update.version);

    return {
      resolved: true,
      value: update.value,
      strategy: this.defaultStrategy,
      winningUpdate: update,
      conflictingUpdates: [],
    };
  }

  /**
   * Get current version for a key
   */
  getVersion(key: string): number {
    return this.stateVersions.get(key) || 0;
  }

  /**
   * Increment version for a key
   */
  incrementVersion(key: string): number {
    const current = this.getVersion(key);
    const next = current + 1;
    this.stateVersions.set(key, next);
    return next;
  }

  /**
   * Clear all versions
   */
  clear(): void {
    this.stateVersions.clear();
    this.emit('versions:cleared');
  }
}
