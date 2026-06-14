"use strict";
/**
 * State Manager
 * Handles infrastructure state persistence and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStateStorage = exports.StateManager = void 0;
const infrastructure_js_1 = require("../types/infrastructure.js");
class StateManager {
    constructor(storage, lockTimeout = 300000) {
        this.storage = storage;
        this.stateCache = new Map();
        this.lockTimeout = lockTimeout;
    }
    async saveState(state) {
        try {
            // Update metadata
            state.updatedAt = new Date();
            state.metadata.checksum = this.calculateChecksum(state);
            // Save to storage
            await this.storage.save(state);
            // Update cache
            this.stateCache.set(state.id, { ...state });
        }
        catch (error) {
            throw new Error(`Failed to save state for ${state.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getState(id) {
        try {
            // Check cache first
            if (this.stateCache.has(id)) {
                const cachedState = this.stateCache.get(id);
                // Verify cache is still valid (not too old)
                const cacheAge = Date.now() - cachedState.updatedAt.getTime();
                if (cacheAge < 60000) { // 1 minute cache validity
                    return cachedState;
                }
            }
            // Load from storage
            const state = await this.storage.get(id);
            if (state) {
                this.stateCache.set(id, state);
            }
            return state;
        }
        catch (error) {
            throw new Error(`Failed to get state for ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async listStates(filters) {
        try {
            return await this.storage.list(filters);
        }
        catch (error) {
            throw new Error(`Failed to list states: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteState(id) {
        try {
            // Check if locked
            if (await this.storage.isLocked(id)) {
                throw new Error(`Cannot delete locked infrastructure: ${id}`);
            }
            // Delete from storage
            await this.storage.delete(id);
            // Remove from cache
            this.stateCache.delete(id);
        }
        catch (error) {
            throw new Error(`Failed to delete state for ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async lockState(id, lockReason, lockBy = 'system') {
        try {
            // Check if already locked
            if (await this.storage.isLocked(id)) {
                throw new Error(`Infrastructure ${id} is already locked`);
            }
            // Lock in storage
            await this.storage.lock(id, lockReason, lockBy);
            // Update cached state if exists
            const cachedState = this.stateCache.get(id);
            if (cachedState) {
                cachedState.metadata.locked = true;
                cachedState.metadata.lockedBy = lockBy;
                cachedState.metadata.lockedAt = new Date();
            }
            // Set timeout to auto-unlock
            setTimeout(async () => {
                try {
                    await this.unlockState(id);
                }
                catch (error) {
                }
            }, this.lockTimeout);
        }
        catch (_error) {
            throw new Error(`Failed to lock state for ${id}: ${_error instanceof Error ? _error.message : 'Unknown error'}`);
        }
    }
    async unlockState(id) {
        try {
            // Unlock in storage
            await this.storage.unlock(id);
            // Update cached state if exists
            const cachedState = this.stateCache.get(id);
            if (cachedState) {
                cachedState.metadata.locked = false;
                cachedState.metadata.lockedBy = undefined;
                cachedState.metadata.lockedAt = undefined;
            }
        }
        catch (_error) {
            throw new Error(`Failed to unlock state for ${id}: ${_error instanceof Error ? _error.message : 'Unknown error'}`);
        }
    }
    async isStateLocked(id) {
        try {
            return await this.storage.isLocked(id);
        }
        catch (_error) {
            throw new Error(`Failed to check lock status for ${id}: ${_error instanceof Error ? _error.message : 'Unknown error'}`);
        }
    }
    async validateStateIntegrity(id) {
        try {
            const state = await this.getState(id);
            if (!state) {
                return {
                    valid: false,
                    errors: [`State ${id} not found`],
                    warnings: []
                };
            }
            const errors = [];
            const warnings = [];
            // Validate checksum
            const currentChecksum = this.calculateChecksum(state);
            if (currentChecksum !== state.metadata.checksum) {
                errors.push('State checksum mismatch - data may be corrupted');
            }
            // Validate required fields
            if (!state.templateId) {
                errors.push('Missing template ID');
            }
            if (!state.environment) {
                warnings.push('Missing environment information');
            }
            // Validate resource states
            for (const resource of state.resources) {
                if (!resource.id) {
                    warnings.push(`Resource ${resource.name} missing ID`);
                }
                if (!resource.lastModified) {
                    warnings.push(`Resource ${resource.name} missing last modified timestamp`);
                }
            }
            // Check for stale locks
            if (state.metadata.locked && state.metadata.lockedAt) {
                const lockAge = Date.now() - state.metadata.lockedAt.getTime();
                if (lockAge > this.lockTimeout) {
                    warnings.push('State has stale lock that may need manual intervention');
                }
            }
            return {
                valid: errors.length === 0,
                errors,
                warnings
            };
        }
        catch (_error) {
            return {
                valid: false,
                errors: [`Failed to validate state integrity: ${_error instanceof Error ? _error.message : 'Unknown error'}`],
                warnings: []
            };
        }
    }
    async cleanupStaleStates(maxAge = 86400000) {
        try {
            const allStates = await this.listStates();
            const staleStates = [];
            const errors = [];
            for (const state of allStates) {
                try {
                    const age = Date.now() - state.updatedAt.getTime();
                    if (age > maxAge && (state.status === infrastructure_js_1.InfrastructureStatus.ERROR ||
                        state.status === infrastructure_js_1.InfrastructureStatus.DESTROYED)) {
                        await this.deleteState(state.id);
                        staleStates.push(state.id);
                    }
                }
                catch (_error) {
                    errors.push(`Failed to cleanup state ${state.id}: ${_error instanceof Error ? _error.message : 'Unknown error'}`);
                }
            }
            return {
                cleanedStates: staleStates,
                errors
            };
        }
        catch (_error) {
            return {
                cleanedStates: [],
                errors: [`Failed to cleanup stale states: ${_error instanceof Error ? _error.message : 'Unknown error'}`]
            };
        }
    }
    calculateChecksum(state) {
        // Create a copy without metadata for checksum calculation
        const stateForChecksum = {
            ...state,
            metadata: {
                ...state.metadata,
                checksum: '', // Exclude current checksum
                locked: false, // Exclude lock status
                lockedBy: undefined,
                lockedAt: undefined
            }
        };
        // Simple checksum calculation - in production, use a proper hash function
        return Buffer.from(JSON.stringify(stateForChecksum)).toString('base64').substr(0, 16);
    }
    clearCache() {
        this.stateCache.clear();
    }
    getCacheSize() {
        return this.stateCache.size;
    }
}
exports.StateManager = StateManager;
/**
 * In-memory implementation of StateStorage for testing
 */
class InMemoryStateStorage {
    constructor() {
        this.states = new Map();
        this.locks = new Map();
    }
    async save(state) {
        this.states.set(state.id, { ...state });
    }
    async get(id) {
        return this.states.get(id) || null;
    }
    async list(filters) {
        let states = Array.from(this.states.values());
        if (filters) {
            if (filters.environment) {
                states = states.filter(s => s.environment === filters.environment);
            }
            if (filters.status && filters.status.length > 0) {
                states = states.filter(s => filters.status.includes(s.status));
            }
            if (filters.createdAfter) {
                states = states.filter(s => s.createdAt >= filters.createdAfter);
            }
            if (filters.createdBefore) {
                states = states.filter(s => s.createdAt <= filters.createdBefore);
            }
            // Note: provider and tags filtering would require loading the template
            // For now, we skip those filters in the in-memory implementation
        }
        return states;
    }
    async delete(id) {
        this.states.delete(id);
        this.locks.delete(id);
    }
    async lock(id, lockReason, lockBy) {
        this.locks.set(id, { reason: lockReason, by: lockBy, at: new Date() });
    }
    async unlock(id) {
        this.locks.delete(id);
    }
    async isLocked(id) {
        return this.locks.has(id);
    }
    // Helper methods for testing
    clear() {
        this.states.clear();
        this.locks.clear();
    }
    size() {
        return this.states.size;
    }
}
exports.InMemoryStateStorage = InMemoryStateStorage;
//# sourceMappingURL=StateManager.js.map