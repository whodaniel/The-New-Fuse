"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictResolver = exports.ConflictStrategy = void 0;
const events_1 = require("events");
/**
 * Conflict resolution strategies
 */
var ConflictStrategy;
(function (ConflictStrategy) {
    ConflictStrategy["LAST_WRITE_WINS"] = "last-write-wins";
    ConflictStrategy["FIRST_WRITE_WINS"] = "first-write-wins";
    ConflictStrategy["CUSTOM"] = "custom";
    ConflictStrategy["MERGE"] = "merge";
    ConflictStrategy["VOTE"] = "vote";
})(ConflictStrategy || (exports.ConflictStrategy = ConflictStrategy = {}));
/**
 * Conflict resolver for managing concurrent state updates
 */
class ConflictResolver extends events_1.EventEmitter {
    constructor(defaultStrategy = ConflictStrategy.LAST_WRITE_WINS) {
        super();
        this.customResolvers = new Map();
        this.stateVersions = new Map();
        this.defaultStrategy = defaultStrategy;
    }
    /**
     * Register a custom resolver for a specific key pattern
     */
    registerResolver(keyPattern, resolver) {
        this.customResolvers.set(keyPattern, resolver);
    }
    /**
     * Resolve conflicts between multiple state updates
     */
    resolve(updates, strategy) {
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
        let winningUpdate;
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
        const resolution = {
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
    lastWriteWins(updates) {
        return updates.reduce((latest, current) => current.timestamp > latest.timestamp ? current : latest);
    }
    /**
     * First write wins strategy
     */
    firstWriteWins(updates) {
        return updates.reduce((earliest, current) => current.timestamp < earliest.timestamp ? current : earliest);
    }
    /**
     * Merge updates (for objects)
     */
    mergeUpdates(updates) {
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
    voteOnUpdates(updates) {
        const votes = new Map();
        for (const update of updates) {
            const valueKey = JSON.stringify(update.value);
            const existing = votes.get(valueKey);
            if (existing) {
                existing.count++;
            }
            else {
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
    applyCustomResolver(updates) {
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
    deepMerge(target, source) {
        if (!this.isObject(target) || !this.isObject(source)) {
            return source;
        }
        const result = { ...target };
        for (const key in source) {
            const sourceValue = source[key];
            const targetValue = target[key];
            if (this.isObject(sourceValue) && this.isObject(targetValue)) {
                result[key] = this.deepMerge(targetValue, sourceValue);
            }
            else {
                result[key] = sourceValue;
            }
        }
        return result;
    }
    /**
     * Check if value is an object
     */
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }
    /**
     * Match key against pattern (supports wildcards)
     */
    matchesPattern(key, pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        return regex.test(key);
    }
    /**
     * Validate state update
     */
    validateUpdate(update) {
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
    applyUpdate(update, pendingUpdates = []) {
        // Check for conflicts
        const conflicts = pendingUpdates.filter((u) => u.key === update.key && u.agentId !== update.agentId);
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
    getVersion(key) {
        return this.stateVersions.get(key) || 0;
    }
    /**
     * Increment version for a key
     */
    incrementVersion(key) {
        const current = this.getVersion(key);
        const next = current + 1;
        this.stateVersions.set(key, next);
        return next;
    }
    /**
     * Clear all versions
     */
    clear() {
        this.stateVersions.clear();
        this.emit('versions:cleared');
    }
}
exports.ConflictResolver = ConflictResolver;
//# sourceMappingURL=ConflictResolver.js.map