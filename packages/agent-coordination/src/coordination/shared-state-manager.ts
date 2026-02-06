import { Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { v4 as uuidv4 } from 'uuid';
import { MessageSerializer } from '../serializers/message-serializer';
import { SharedState, StateLock } from '../types/coordination.types';

/**
 * Shared state manager for collaborative agent tasks
 */
export class SharedStateManager {
  private readonly logger = new Logger(SharedStateManager.name);
  private readonly keyPrefix: string;
  private readonly serializer: MessageSerializer;
  private readonly defaultTTL: number = 3600; // 1 hour
  private readonly lockTTL: number = 30; // 30 seconds

  constructor(
    private readonly redisService: UnifiedRedisService,
    keyPrefix: string,
    serializer: MessageSerializer
  ) {
    this.keyPrefix = keyPrefix + 'state:';
    this.serializer = serializer;
  }

  /**
   * Set shared state
   */
  async setState(
    key: string,
    value: any,
    ownerId: string,
    options?: {
      ttl?: number;
      version?: number;
    }
  ): Promise<SharedState> {
    const existing = await this.getState(key);
    const version = options?.version ?? (existing ? existing.version + 1 : 1);

    const state: SharedState = {
      key,
      value,
      version,
      ownerId,
      lastModified: Date.now(),
      ttl: options?.ttl,
    };

    const stateKey = this.keyPrefix + key;
    const ttl = options?.ttl || this.defaultTTL;

    await this.redisService.set(stateKey, this.serializer.serialize(state), ttl);

    this.logger.debug('State set: ' + key + ' (version ' + version + ')');
    return state;
  }

  /**
   * Get shared state
   */
  async getState(key: string): Promise<SharedState | null> {
    const stateKey = this.keyPrefix + key;
    const data = await this.redisService.get(stateKey);

    if (!data) return null;

    try {
      return this.serializer.deserialize<SharedState>(data);
    } catch (error) {
      this.logger.error('Failed to deserialize state for ' + key + ':', error);
      return null;
    }
  }

  /**
   * Update shared state with optimistic locking
   */
  async updateState(
    key: string,
    updater: (currentValue: any) => any,
    ownerId: string
  ): Promise<SharedState | null> {
    const current = await this.getState(key);

    if (!current) {
      throw new Error('State not found: ' + key);
    }

    const newValue = updater(current.value);
    const newVersion = current.version + 1;

    return await this.setState(key, newValue, ownerId, {
      version: newVersion,
      ttl: current.ttl,
    });
  }

  /**
   * Delete shared state
   */
  async deleteState(key: string): Promise<boolean> {
    const stateKey = this.keyPrefix + key;
    const result = await this.redisService.del(stateKey);

    if (result > 0) {
      this.logger.debug('State deleted: ' + key);
      return true;
    }

    return false;
  }

  /**
   * Acquire lock on state
   */
  async acquireLock(
    key: string,
    agentId: string,
    ttl: number = this.lockTTL
  ): Promise<StateLock | null> {
    const lockKey = this.keyPrefix + 'lock:' + key;
    const lockId = uuidv4();

    const lock: StateLock = {
      lockId,
      key,
      agentId,
      acquiredAt: Date.now(),
      expiresAt: Date.now() + ttl * 1000,
      renewable: true,
    };

    await this.redisService.set(lockKey, this.serializer.serialize(lock), ttl);

    this.logger.debug('Lock acquired: ' + key + ' by ' + agentId);
    return lock;
  }

  /**
   * Release lock on state
   */
  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const lockKey = this.keyPrefix + 'lock:' + key;
    const lockData = await this.redisService.get(lockKey);

    if (!lockData) return false;

    try {
      const lock = this.serializer.deserialize<StateLock>(lockData);

      if (lock.lockId === lockId) {
        await this.redisService.del(lockKey);
        this.logger.debug('Lock released: ' + key);
        return true;
      }
    } catch (error) {
      this.logger.error('Failed to release lock:', error);
    }

    return false;
  }

  /**
   * Renew lock
   */
  async renewLock(key: string, lockId: string, ttl: number = this.lockTTL): Promise<boolean> {
    const lockKey = this.keyPrefix + 'lock:' + key;
    const lockData = await this.redisService.get(lockKey);

    if (!lockData) return false;

    try {
      const lock = this.serializer.deserialize<StateLock>(lockData);

      if (lock.lockId === lockId && lock.renewable) {
        lock.expiresAt = Date.now() + ttl * 1000;

        await this.redisService.set(lockKey, this.serializer.serialize(lock), ttl);

        this.logger.debug('Lock renewed: ' + key);
        return true;
      }
    } catch (error) {
      this.logger.error('Failed to renew lock:', error);
    }

    return false;
  }

  /**
   * Check if state is locked
   */
  async isLocked(key: string): Promise<boolean> {
    const lockKey = this.keyPrefix + 'lock:' + key;
    return await this.redisService.exists(lockKey);
  }

  /**
   * Get lock info
   */
  async getLockInfo(key: string): Promise<StateLock | null> {
    const lockKey = this.keyPrefix + 'lock:' + key;
    const lockData = await this.redisService.get(lockKey);

    if (!lockData) return null;

    try {
      return this.serializer.deserialize<StateLock>(lockData);
    } catch (error) {
      this.logger.error('Failed to get lock info:', error);
      return null;
    }
  }

  /**
   * List all state keys
   */
  async listStates(pattern: string = '*'): Promise<string[]> {
    const fullPattern = this.keyPrefix + pattern;
    const keys = await this.redisService.keys(fullPattern);

    return keys
      .filter((key) => !key.includes(':lock:'))
      .map((key) => key.replace(this.keyPrefix, ''));
  }

  /**
   * Batch get states
   */
  async batchGetStates(keys: string[]): Promise<Map<string, SharedState>> {
    const results = new Map<string, SharedState>();

    await Promise.all(
      keys.map(async (key) => {
        const state = await this.getState(key);
        if (state) {
          results.set(key, state);
        }
      })
    );

    return results;
  }

  /**
   * Batch set states
   */
  async batchSetStates(
    states: Array<{ key: string; value: any; ownerId: string; ttl?: number }>
  ): Promise<SharedState[]> {
    return await Promise.all(
      states.map(({ key, value, ownerId, ttl }) => this.setState(key, value, ownerId, { ttl }))
    );
  }
}
