import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { DatabaseService } from '../database/database.service.js';
import { Logger } from '@the-new-fuse/utils';
import {
  StateValue,
  StateSnapshot,
  StateTransaction,
  StateEvent,
  StateEventType,
  StateManagerOptions,
  StateLock,
  StateValidationError
} from '@the-new-fuse/types';

@Injectable()
export class StateService extends EventEmitter implements OnModuleInit {
  private readonly logger: Logger;
  private readonly redis: Redis;
  private readonly db: DatabaseService;
  private readonly state: Map<string, StateValue>;
  private readonly transactions: Map<string, StateTransaction>;
  private readonly locks: Map<string, StateLock>;
  private readonly lockTimeout: number;
  private readonly snapshotInterval: number;
  private snapshotTimer: NodeJS.Timeout | null;

  constructor(redis: Redis, db: DatabaseService, options?: StateManagerOptions) {
    super();
    this.redis = redis;
    this.db = db;
    this.state = new Map();
    this.transactions = new Map();
    this.locks = new Map();
    this.lockTimeout = options?.lockTimeout || 30000;
    this.snapshotInterval = options?.snapshotInterval || 60000;
    this.snapshotTimer = null;
  }

  async onModuleInit(): Promise<void> {
    await this.loadState();
    if (this.snapshotInterval) {
      this.snapshotTimer = setInterval(() => this.createSnapshot(), this.snapshotInterval);
    }
  }

  private async loadState(): Promise<void> {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
    }
    try {
      const keys = await this.redis.keys('state:*');
      for (const key of keys) {
        const value = await this.redis.get(key);
        if (value) {
          const stateValue: StateValue = JSON.parse(value);
          // Extract the actual key name without the 'state:' prefix
          const stateKey = key.substring(6); // Remove 'state:' prefix
          this.state.set(stateKey, stateValue);
        }
      }
      this.logger.info(`Loaded ${this.state.size} state entries`);
    } catch (error) {
      this.logger.error('Failed to load state:', error);
    }
  }

  private async createSnapshot(): Promise<StateSnapshot> {
    const snapshot: StateSnapshot = {
      id: `snapshot_${Date.now()}`,
      value: {},
      version: 1,
      timestamp: new Date(),
      metadata: {}
    };

    for (const [key, value] of this.state.entries()) {
      (snapshot.value as Record<string, unknown>)[key] = value.value;
    }

    try {
      await this.db.collection('snapshots').insertOne(snapshot);
      const event: StateEvent = {
        id: crypto.randomUUID(),
        stateId: snapshot.stateId,
        payload: snapshot,
        timestamp: new Date()
      };
      this.emit(StateEventType.SNAPSHOT_CREATED, event);
      
      return snapshot;
    } catch (error) {
      this.logger.error('Failed to create snapshot:', error);
      throw error;
    }
  }

  public async getState<T>(key: string): Promise<T | undefined> {
    const stateValue = await this.redis.get(key);
    return stateValue ? JSON.parse(stateValue) : undefined;
  }

  public async setState<T>(key: string, value: T): Promise<void> {
    const stateValue: StateValue = {
      id: crypto.randomUUID(),
      version: (this.state.get(key)?.version || 0) + 1,
      timestamp: new Date(),
      metadata: {}
    };

    try {
      await this.redis.set(`state:${key}`, JSON.stringify(stateValue));
      const event: StateEvent = {
        id: crypto.randomUUID(),
        stateId: key,
        payload: value,
        timestamp: new Date()
      };
      this.emit(StateEventType.UPDATED, event);
    } catch (error) {
      this.logger.error('Failed to set state:', { error, key });
    }
  }

  public async deleteState(key: string): Promise<void> {
    try {
      await this.redis.del(`state:${key}`);
      const event: StateEvent = {
        id: crypto.randomUUID(),
        stateId: key,
        timestamp: new Date()
      };
      this.emit(StateEventType.DELETED, event);
    } catch (error) {
      this.logger.error('Failed to delete state:', { error, key });
    }
  }

  public async acquireLock(key: string, holder: string): Promise<boolean> {
    const existingLock: StateLock | undefined = this.locks.get(key);
    if (existingLock && existingLock.expires > new Date()) {
      return false;
    }

    const lock: StateLock = {
      holder,
      acquired: new Date(),
      expires: new Date(Date.now() + this.lockTimeout),
      metadata: {}
    };

    this.locks.set(key, lock);
    const event: StateEvent = {
      id: crypto.randomUUID(),
      stateId: key,
      timestamp: new Date(),
      metadata: { holder }
    };
    this.emit(StateEventType.LOCK_ACQUIRED, event);
    return true;
  }

  public async releaseLock(key: string, holder: string): Promise<boolean> {
    const lock: StateLock | undefined = this.locks.get(key);
    if (!lock || lock.holder !== holder) {
      return false;
    }

    this.locks.delete(key);
    
    const event: StateEvent = {
      id: crypto.randomUUID(),
      stateId: key,
      timestamp: new Date(),
      metadata: { holder }
    };
    this.emit(StateEventType.LOCK_RELEASED, event);
    return true;
  }

  public async getSnapshot(id: string): Promise<StateSnapshot | null> {
    try {
      const result = await this.db.collection('snapshots').findOne({ id });
      if (!result) return null;
      
      return {
        id: result.id,
        stateId: result.stateId,
        value: result.value,
        version: result.version,
        timestamp: result.timestamp,
        lastUpdated: result.lastUpdated,
        metadata: result.metadata,
        hash: result.hash,
        parentSnapshotId: result.parentSnapshotId
      };
    } catch (error: unknown) {
      this.logger.error('Failed to get snapshot:', { error, id });
      return null;
    }
  }

  public async clearState(): Promise<void> {
    try {
      const keys = await this.redis.keys('state:*');
      await this.redis.del(...keys);
    } catch (error) {
      this.logger.error('Failed to clear state:', error);
      throw error;
    }
  }
}
