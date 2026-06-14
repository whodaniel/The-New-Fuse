"use strict";
/**
 * Agent Sync Bridge - Agent state synchronization
 *
 * Provides synchronization capabilities between agents:
 * - State synchronization
 * - Conflict resolution
 * - Distributed locking
 * - Event sourcing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSyncBridge = void 0;
const index_js_1 = require("./index.js");
// ============================================================
// AGENT SYNC BRIDGE
// ============================================================
class AgentSyncBridge extends index_js_1.BaseBridge {
    constructor() {
        super('agent-sync-bridge');
        this.states = new Map();
        this.events = [];
        this.locks = new Map();
        this.subscribers = new Map();
        this.conflictResolution = { strategy: 'last-write-wins' };
        this.lockCleanupInterval = null;
        this.maxEventsSize = 10000;
    }
    async connect() {
        this.emit('connecting');
        this.startLockCleanup();
        this.isConnected = true;
        this.emit('connected');
    }
    async disconnect() {
        this.stopLockCleanup();
        this.isConnected = false;
        this.emit('disconnected');
    }
    async sendMessage(message, messageType = index_js_1.MessageType.COMMAND, priority = index_js_1.Priority.MEDIUM) {
        const action = message.action;
        switch (action) {
            case 'sync':
                await this.syncState(message.agentId, message.state);
                break;
            case 'lock':
                await this.acquireLock(message.resource, message.agentId, message.ttlMs);
                break;
            case 'unlock':
                await this.releaseLock(message.resource, message.agentId);
                break;
            default:
                this.emit('message', { action, message });
        }
    }
    // ============================================================
    // STATE SYNCHRONIZATION
    // ============================================================
    /**
     * Get current state for an agent
     */
    getState(agentId) {
        return this.states.get(agentId);
    }
    /**
     * Update state for an agent
     */
    async syncState(agentId, data) {
        const existing = this.states.get(agentId);
        const version = existing ? existing.version + 1 : 1;
        const state = {
            agentId,
            version,
            data,
            timestamp: new Date(),
            checksum: this.calculateChecksum(data),
        };
        // Check for conflicts
        if (existing) {
            const hasConflict = this.detectConflict(existing, state);
            if (hasConflict) {
                state.data = this.resolveConflict(existing.data, state.data);
                state.checksum = this.calculateChecksum(state.data);
            }
        }
        this.states.set(agentId, state);
        // Record sync event
        const event = this.createEvent(agentId, existing ? 'update' : 'create', '/', data, existing?.data);
        this.recordEvent(event);
        this.emit('state:synced', state);
        return state;
    }
    /**
     * Patch state (partial update)
     */
    async patchState(agentId, path, value) {
        const existing = this.states.get(agentId);
        if (!existing) {
            throw new Error(`No state found for agent: ${agentId}`);
        }
        const previousValue = this.getValueAtPath(existing.data, path);
        const newData = this.setValueAtPath({ ...existing.data }, path, value);
        const state = {
            agentId,
            version: existing.version + 1,
            data: newData,
            timestamp: new Date(),
            checksum: this.calculateChecksum(newData),
        };
        this.states.set(agentId, state);
        const event = this.createEvent(agentId, 'update', path, value, previousValue);
        this.recordEvent(event);
        this.emit('state:patched', { path, value, state });
        return state;
    }
    /**
     * Delete an agent's state
     */
    async deleteState(agentId) {
        const existing = this.states.get(agentId);
        if (!existing)
            return;
        this.states.delete(agentId);
        const event = this.createEvent(agentId, 'delete', '/', undefined, existing.data);
        this.recordEvent(event);
        this.emit('state:deleted', { agentId });
    }
    // ============================================================
    // CONFLICT RESOLUTION
    // ============================================================
    /**
     * Set conflict resolution strategy
     */
    setConflictResolution(resolution) {
        this.conflictResolution = resolution;
    }
    /**
     * Detect if there's a conflict
     */
    detectConflict(existing, incoming) {
        // Simple conflict detection based on checksum
        return (existing.checksum !== incoming.checksum &&
            existing.timestamp.getTime() > incoming.timestamp.getTime() - 1000);
    }
    /**
     * Resolve conflict based on strategy
     */
    resolveConflict(local, remote) {
        switch (this.conflictResolution.strategy) {
            case 'last-write-wins':
                return remote;
            case 'first-write-wins':
                return local;
            case 'merge':
                return this.deepMerge(local, remote);
            case 'manual':
                if (this.conflictResolution.resolver) {
                    return this.conflictResolution.resolver(local, remote);
                }
                return remote;
            default:
                return remote;
        }
    }
    // ============================================================
    // DISTRIBUTED LOCKING
    // ============================================================
    /**
     * Acquire a lock on a resource
     */
    async acquireLock(resource, holder, ttlMs = 30000) {
        const existing = this.locks.get(resource);
        if (existing && existing.expiresAt > new Date()) {
            if (existing.holder === holder) {
                // Renew existing lock
                existing.expiresAt = new Date(Date.now() + ttlMs);
                this.emit('lock:renewed', existing);
                return existing;
            }
            // Lock held by another agent
            this.emit('lock:denied', { resource, holder, existingHolder: existing.holder });
            return null;
        }
        const lock = {
            id: `lock-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            resource,
            holder,
            acquiredAt: new Date(),
            expiresAt: new Date(Date.now() + ttlMs),
            renewable: true,
        };
        this.locks.set(resource, lock);
        this.emit('lock:acquired', lock);
        return lock;
    }
    /**
     * Release a lock
     */
    async releaseLock(resource, holder) {
        const lock = this.locks.get(resource);
        if (!lock || lock.holder !== holder) {
            return false;
        }
        this.locks.delete(resource);
        this.emit('lock:released', lock);
        return true;
    }
    /**
     * Check if resource is locked
     */
    isLocked(resource) {
        const lock = this.locks.get(resource);
        return lock !== undefined && lock.expiresAt > new Date();
    }
    /**
     * Get lock holder
     */
    getLockHolder(resource) {
        const lock = this.locks.get(resource);
        if (lock && lock.expiresAt > new Date()) {
            return lock.holder;
        }
        return null;
    }
    /**
     * Start lock cleanup
     */
    startLockCleanup() {
        if (this.lockCleanupInterval)
            return;
        this.lockCleanupInterval = setInterval(() => {
            const now = new Date();
            for (const [resource, lock] of this.locks) {
                if (lock.expiresAt <= now) {
                    this.locks.delete(resource);
                    this.emit('lock:expired', lock);
                }
            }
        }, 5000);
    }
    /**
     * Stop lock cleanup
     */
    stopLockCleanup() {
        if (this.lockCleanupInterval) {
            clearInterval(this.lockCleanupInterval);
            this.lockCleanupInterval = null;
        }
    }
    // ============================================================
    // EVENT SOURCING
    // ============================================================
    /**
     * Subscribe to sync events
     */
    subscribeToEvents(agentId, handler) {
        this.subscribers.set(agentId, handler);
    }
    /**
     * Unsubscribe from events
     */
    unsubscribeFromEvents(agentId) {
        this.subscribers.delete(agentId);
    }
    /**
     * Get events for an agent
     */
    getEventsForAgent(agentId, limit = 100) {
        return this.events.filter((e) => e.agentId === agentId).slice(-limit);
    }
    /**
     * Create a sync event
     */
    createEvent(agentId, type, path, value, previousValue) {
        const state = this.states.get(agentId);
        return {
            id: `event-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            agentId,
            type,
            path,
            value,
            previousValue,
            version: state?.version || 1,
            timestamp: new Date(),
        };
    }
    /**
     * Record an event
     */
    recordEvent(event) {
        this.events.push(event);
        if (this.events.length > this.maxEventsSize) {
            this.events = this.events.slice(-this.maxEventsSize / 2);
        }
        // Notify subscribers
        for (const [, handler] of this.subscribers) {
            handler(event);
        }
        this.emit('event:recorded', event);
    }
    // ============================================================
    // HELPERS
    // ============================================================
    calculateChecksum(data) {
        return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
    }
    getValueAtPath(obj, path) {
        const parts = path.split('/').filter(Boolean);
        let current = obj;
        for (const part of parts) {
            if (typeof current !== 'object' || current === null)
                return undefined;
            current = current[part];
        }
        return current;
    }
    setValueAtPath(obj, path, value) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 0)
            return value;
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return obj;
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    // ============================================================
    // STATISTICS
    // ============================================================
    getStatistics() {
        return {
            connected: this.isConnected,
            agents: this.states.size,
            locks: this.locks.size,
            events: this.events.length,
            subscribers: this.subscribers.size,
        };
    }
}
exports.AgentSyncBridge = AgentSyncBridge;
exports.default = AgentSyncBridge;
//# sourceMappingURL=agent_sync_bridge.js.map