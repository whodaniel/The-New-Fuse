/**
 * Agent Sync Bridge - Agent state synchronization
 *
 * Provides synchronization capabilities between agents:
 * - State synchronization
 * - Conflict resolution
 * - Distributed locking
 * - Event sourcing
 */

import { BaseBridge, MessageType, Priority } from './index';

// ============================================================
// SYNC TYPES
// ============================================================

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

// ============================================================
// AGENT SYNC BRIDGE
// ============================================================

export class AgentSyncBridge extends BaseBridge {
  private states: Map<string, SyncState> = new Map();
  private events: SyncEvent[] = [];
  private locks: Map<string, Lock> = new Map();
  private subscribers: Map<string, (event: SyncEvent) => void> = new Map();
  private conflictResolution: ConflictResolution = { strategy: 'last-write-wins' };
  private lockCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private maxEventsSize = 10000;

  constructor() {
    super('agent-sync-bridge');
  }

  async connect(): Promise<void> {
    this.emit('connecting');
    this.startLockCleanup();
    this.isConnected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    this.stopLockCleanup();
    this.isConnected = false;
    this.emit('disconnected');
  }

  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.COMMAND,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    const action = message.action as string;

    switch (action) {
      case 'sync':
        await this.syncState(message.agentId as string, message.state as Record<string, unknown>);
        break;
      case 'lock':
        await this.acquireLock(
          message.resource as string,
          message.agentId as string,
          message.ttlMs as number
        );
        break;
      case 'unlock':
        await this.releaseLock(message.resource as string, message.agentId as string);
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
  getState(agentId: string): SyncState | undefined {
    return this.states.get(agentId);
  }

  /**
   * Update state for an agent
   */
  async syncState(agentId: string, data: Record<string, unknown>): Promise<SyncState> {
    const existing = this.states.get(agentId);
    const version = existing ? existing.version + 1 : 1;

    const state: SyncState = {
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
    const event = this.createEvent(
      agentId,
      existing ? 'update' : 'create',
      '/',
      data,
      existing?.data
    );
    this.recordEvent(event);

    this.emit('state:synced', state);
    return state;
  }

  /**
   * Patch state (partial update)
   */
  async patchState(agentId: string, path: string, value: unknown): Promise<SyncState> {
    const existing = this.states.get(agentId);
    if (!existing) {
      throw new Error(`No state found for agent: ${agentId}`);
    }

    const previousValue = this.getValueAtPath(existing.data, path);
    const newData = this.setValueAtPath({ ...existing.data }, path, value);

    const state: SyncState = {
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
  async deleteState(agentId: string): Promise<void> {
    const existing = this.states.get(agentId);
    if (!existing) return;

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
  setConflictResolution(resolution: ConflictResolution): void {
    this.conflictResolution = resolution;
  }

  /**
   * Detect if there's a conflict
   */
  private detectConflict(existing: SyncState, incoming: SyncState): boolean {
    // Simple conflict detection based on checksum
    return (
      existing.checksum !== incoming.checksum &&
      existing.timestamp.getTime() > incoming.timestamp.getTime() - 1000
    );
  }

  /**
   * Resolve conflict based on strategy
   */
  private resolveConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): Record<string, unknown> {
    switch (this.conflictResolution.strategy) {
      case 'last-write-wins':
        return remote;
      case 'first-write-wins':
        return local;
      case 'merge':
        return this.deepMerge(local, remote);
      case 'manual':
        if (this.conflictResolution.resolver) {
          return this.conflictResolution.resolver(local, remote) as Record<string, unknown>;
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
  async acquireLock(resource: string, holder: string, ttlMs = 30000): Promise<Lock | null> {
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

    const lock: Lock = {
      id: `lock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  async releaseLock(resource: string, holder: string): Promise<boolean> {
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
  isLocked(resource: string): boolean {
    const lock = this.locks.get(resource);
    return lock !== undefined && lock.expiresAt > new Date();
  }

  /**
   * Get lock holder
   */
  getLockHolder(resource: string): string | null {
    const lock = this.locks.get(resource);
    if (lock && lock.expiresAt > new Date()) {
      return lock.holder;
    }
    return null;
  }

  /**
   * Start lock cleanup
   */
  private startLockCleanup(): void {
    if (this.lockCleanupInterval) return;

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
  private stopLockCleanup(): void {
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
  subscribeToEvents(agentId: string, handler: (event: SyncEvent) => void): void {
    this.subscribers.set(agentId, handler);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribeFromEvents(agentId: string): void {
    this.subscribers.delete(agentId);
  }

  /**
   * Get events for an agent
   */
  getEventsForAgent(agentId: string, limit = 100): SyncEvent[] {
    return this.events.filter((e) => e.agentId === agentId).slice(-limit);
  }

  /**
   * Create a sync event
   */
  private createEvent(
    agentId: string,
    type: SyncEvent['type'],
    path: string,
    value?: unknown,
    previousValue?: unknown
  ): SyncEvent {
    const state = this.states.get(agentId);
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  private recordEvent(event: SyncEvent): void {
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

  private calculateChecksum(data: unknown): string {
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
  }

  private getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('/').filter(Boolean);
    let current: unknown = obj;
    for (const part of parts) {
      if (typeof current !== 'object' || current === null) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private setValueAtPath(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): Record<string, unknown> {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return value as Record<string, unknown>;

    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
    return obj;
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...target };
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(
          (target[key] as Record<string, unknown>) || {},
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  getStatistics(): {
    connected: boolean;
    agents: number;
    locks: number;
    events: number;
    subscribers: number;
  } {
    return {
      connected: this.isConnected,
      agents: this.states.size,
      locks: this.locks.size,
      events: this.events.length,
      subscribers: this.subscribers.size,
    };
  }
}

export default AgentSyncBridge;
