// @ts-nocheck
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { DatabaseService } from '../database/database.service.js';
import { Logger } from '@the-new-fuse/utils';
import * as z from 'zod';
import {
  StateValue,
  StateSnapshot,
  StateTransaction,
  StateEvent,
  StateEventType,
  StateManagerOptions,
  StateSchema,
  StateValidationError
} from '@the-new-fuse/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StateManager extends EventEmitter implements OnModuleInit {
  private readonly logger: Logger;
  private readonly redis: Redis;
  private readonly db: DatabaseService;
  private readonly states: Map<string, StateValue>;
  private readonly schemas: Map<string, StateSchema>;
  private readonly subscribers: Map<string, Set<(state: unknown) => void>>;
  private readonly snapshots: Map<string, StateSnapshot[]>;
  private readonly transactions: Map<string, StateTransaction[]>;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor(
    redis: Redis,
    db: DatabaseService,
    options: StateManagerOptions = {}
  ) {
    super();
    this.redis = redis;
    this.db = db;
    this.states = new Map();
    this.schemas = new Map();
    this.subscribers = new Map();
    this.snapshots = new Map();
    this.transactions = new Map();
    this.options = options;
  }

  private async loadPersistedStates(): Promise<void> {
    try {
      const persisted = await this.db.loadPersistedStates();
      persisted.forEach((state) => this.states.set(state.id, state));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to load persisted states:', { error: msg });
    }
  }

  onModuleInit() {
    this.loadPersistedStates();
  }

  subscribe(key: string, callback: (state: unknown) => void): () => void {
    let subscribers = this.subscribers.get(key);
    if (!subscribers) {
      subscribers = new Set();
      this.subscribers.set(key, subscribers);
    }
    subscribers.add(callback);

    return () => {
      subscribers?.delete(callback);
    };
  }

  async set(key: string, value: unknown): Promise<void> {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        // Validate against schema if exists
        const schema = this.schemas.get(key);
        if (schema) {
          const result = schema.safeParse(value);
          if (!result.success) {
            const errors: StateValidationError[] = result.error.errors.map((err) => ({
              message: err.message,
              path: err.path.map((p) => String(p)),
            }));
            throw new Error(`Validation failed for state ${key}: ${JSON.stringify(errors)}`);
          }
        }

        const stateValue: StateValue = {
          value,
          version: new Date(),
          metadata: {},
        };

        // Persist to Redis with error handling
        const redisKey = `state:${key}`;
        const redisValue: StateEvent = {
          type: StateEventType.UPDATED,
          key,
          timestamp: new Date(),
          value,
        };
        await this.redis.set(redisKey, JSON.stringify(stateValue));

        // Notify subscribers
        const subscribers = this.subscribers.get(key);
        if (subscribers) {
          subscribers.forEach((callback) => callback(value));
        }

        // Emit event
        const event: StateEvent = {
          type: StateEventType.UPDATED,
          key,
          timestamp: new Date(),
          value,
        };
        this.emit(StateEventType.UPDATED, event);

        // Clean up old transactions
        await this.cleanupOldTransactions(key);

        break; // Success, exit retry loop
      } catch (error) {
        retries++;
        if (retries === this.maxRetries) {
          this.logger.error('Failed to set state after retries:', { error, key });
        }
      }
    }
  }

  private async cleanupOldTransactions(key: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    try {
      const transactions = this.transactions.get(key);
      if (transactions) {
        const validTransactions = transactions.filter((tx) => tx.timestamp.getTime() > now - maxAge);
        this.transactions.set(key, validTransactions);
        await (this.db.prisma as any).transactionLog.deleteMany({
          where: {
            stateId: key,
            timestamp: {
              lt: new Date(now - maxAge),
            },
          },
        });
      }
    } catch (error) {
      this.logger.warn('Failed to cleanup old transactions:', { error, key });
    }
  }

  async get(key: string): Promise<unknown> {
    try {
      // Try to get from Redis first
      const redisValue = await this.redis.get(`state:${key}`);
      if (redisValue) {
        return JSON.parse(redisValue).value;
      }

      // If not found in Redis, try to get from DB
      const state = await this.db.getState(key);
      if (state) {
        this.states.set(key, state);
        return state.value;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get state:', { error, key });
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(`state:${key}`);
      this.states.delete(key);

      // Notify subscribers
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        const event: StateEvent = {
          type: StateEventType.DELETED,
          key,
          timestamp: new Date(),
        };
        subscribers.forEach((callback) => callback(null));
        this.emit(StateEventType.DELETED, event);
      }
    } catch (error) {
      this.logger.error('Failed to delete state:', { error, key });
    }
  }

  async snapshot(key: string): Promise<StateSnapshot> {
    const state = this.states.get(key);
    if (!state) {
      throw new Error(`State not found for key: ${key}`);
    }

    const snapshot: StateSnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: new Date(),
      data: { [key]: state.value },
      metadata: {},
    };

    let snapshots = this.snapshots.get(key);
    if (!snapshots) {
      snapshots = [];
      this.snapshots.set(key, snapshots);
    }
    const maxSnapshots = this.options.maxSnapshots || 10;
    if (snapshots.length > maxSnapshots) {
      snapshots.splice(0, snapshots.length - maxSnapshots);
    }

    const event: StateEvent = {
      type: StateEventType.SNAPSHOT_CREATED,
      key: snapshot.id,
      timestamp: new Date(),
      value: snapshot,
    };
    this.emit(StateEventType.SNAPSHOT_CREATED, event);

    return snapshot;
  }

  async getSnapshot(key: string, snapshotId: string): Promise<StateSnapshot | null> {
    const snapshots = this.snapshots.get(key);
    if (!snapshots) {
      return null;
    }

    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    return snapshot;
  }

  async restoreSnapshot(key: string, snapshotId: string): Promise<void> {
    const snapshot = await this.getSnapshot(key, snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const state = snapshot.data[key];
    if (!state) {
      throw new Error(`State not found in snapshot for key: ${key}`);
    }

    await this.set(key, state);
  }

  private async logTransaction(state: StateValue, action: 'CREATE' | 'UPDATE' | 'DELETE'): Promise<void> {
    if (!this.db.prisma) {
      throw new Error('Database connection not initialized');
    }

    await this.db.prisma.$transaction([
      this.db.(prisma as any).state.create({ data: state }),
      this.db.(prisma as any).transactionLog.create({
        data: {
          stateId: state.id,
          action,
          timestamp: new Date(),
        },
      }),
    ]);
  }
}
