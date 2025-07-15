import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface StateValue {
  id: string;
  data: any;
  version: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface StateSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface StateSnapshot {
  id: string;
  stateId: string;
  data: any;
  timestamp: Date;
  description?: string;
}

export interface StateTransaction {
  id: string;
  stateId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export interface StateManagerOptions {
  enableSnapshots?: boolean;
  enableTransactionLog?: boolean;
  maxSnapshots?: number;
  persistToDisk?: boolean;
}

@Injectable()
export class StateManager extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(StateManager.name);
  private readonly options: StateManagerOptions;
  private readonly states: Map<string, StateValue> = new Map();
  private readonly schemas: Map<string, StateSchema> = new Map();
  private readonly subscribers: Map<string, Set<(state: unknown) => void>> = new Map();
  private readonly snapshots: Map<string, StateSnapshot[]> = new Map();
  private readonly transactions: Map<string, StateTransaction[]> = new Map();
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(options: StateManagerOptions = {}) {
    super();
    this.options = {
      enableSnapshots: false,
      enableTransactionLog: false,
      maxSnapshots: 10,
      persistToDisk: false,
      ...options
    };
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('StateManager initialized');
    
    if (this.options.persistToDisk) {
      await this.loadPersistedStates();
    }
  }

  private async loadPersistedStates(): Promise<void> {
    try {
      // Load persisted states from disk or database
      this.logger.log('Loading persisted states');
      
      // Implementation would depend on your persistence layer
      // For now, this is a placeholder
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to load persisted states', { error: errorMessage });
    }
  }

  async createState(id: string, data: any, schema?: StateSchema): Promise<StateValue> {
    if (this.states.has(id)) {
      throw new Error(`State with id '${id}' already exists`);
    }

    if (schema) {
      this.validateStateData(data, schema);
      this.schemas.set(id, schema);
    }

    const state: StateValue = {
      id,
      data,
      version: 1,
      timestamp: new Date(),
      metadata: {}
    };

    this.states.set(id, state);

    if (this.options.enableTransactionLog) {
      await this.logTransaction(id, 'CREATE', undefined, data);
    }

    this.emit('stateCreated', state);
    this.notifySubscribers(id, state);

    return state;
  }

  async updateState(id: string, data: any): Promise<StateValue> {
    const existingState = this.states.get(id);
    if (!existingState) {
      throw new Error(`State with id '${id}' not found`);
    }

    const schema = this.schemas.get(id);
    if (schema) {
      this.validateStateData(data, schema);
    }

    if (this.options.enableSnapshots) {
      await this.createSnapshot(id, existingState.data);
    }

    const oldData = existingState.data;
    const updatedState: StateValue = {
      ...existingState,
      data,
      version: existingState.version + 1,
      timestamp: new Date()
    };

    this.states.set(id, updatedState);

    if (this.options.enableTransactionLog) {
      await this.logTransaction(id, 'UPDATE', oldData, data);
    }

    this.emit('stateUpdated', updatedState);
    this.notifySubscribers(id, updatedState);

    return updatedState;
  }

  async deleteState(id: string): Promise<void> {
    const existingState = this.states.get(id);
    if (!existingState) {
      throw new Error(`State with id '${id}' not found`);
    }

    if (this.options.enableTransactionLog) {
      await this.logTransaction(id, 'DELETE', existingState.data, undefined);
    }

    this.states.delete(id);
    this.schemas.delete(id);
    this.subscribers.delete(id);
    this.snapshots.delete(id);
    this.transactions.delete(id);

    this.emit('stateDeleted', { id });
  }

  getState(id: string): StateValue | undefined {
    return this.states.get(id);
  }

  getAllStates(): StateValue[] {
    return Array.from(this.states.values());
  }

  async createSnapshot(stateId: string, data: any, description?: string): Promise<StateSnapshot> {
    const snapshot: StateSnapshot = {
      id: `${stateId}_snapshot_${Date.now()}`,
      stateId,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: new Date(),
      description
    };

    if (!this.snapshots.has(stateId)) {
      this.snapshots.set(stateId, []);
    }

    const snapshots = this.snapshots.get(stateId)!;
    snapshots.push(snapshot);

    // Limit number of snapshots
    const maxSnapshots = this.options.maxSnapshots || 10;
    if (snapshots.length > maxSnapshots) {
      snapshots.splice(0, snapshots.length - maxSnapshots);
    }

    return snapshot;
  }

  getSnapshots(stateId: string): StateSnapshot[] {
    return this.snapshots.get(stateId) || [];
  }

  subscribe(stateId: string, callback: (state: unknown) => void): () => void {
    if (!this.subscribers.has(stateId)) {
      this.subscribers.set(stateId, new Set());
    }

    this.subscribers.get(stateId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(stateId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(stateId);
        }
      }
    };
  }

  private notifySubscribers(stateId: string, state: StateValue): void {
    const subscribers = this.subscribers.get(stateId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          this.logger.error('Error notifying subscriber', { error, stateId });
        }
      });
    }
  }

  private validateStateData(data: any, schema: StateSchema): void {
    // Basic validation - implement more sophisticated validation as needed
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          throw new Error(`Required field '${field}' is missing`);
        }
      }
    }
  }

  private async logTransaction(
    stateId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValue?: any,
    newValue?: any
  ): Promise<void> {
    const transaction: StateTransaction = {
      id: `${stateId}_tx_${Date.now()}`,
      stateId,
      action,
      oldValue,
      newValue,
      timestamp: new Date()
    };

    if (!this.transactions.has(stateId)) {
      this.transactions.set(stateId, []);
    }

    this.transactions.get(stateId)!.push(transaction);
  }

  getTransactions(stateId: string): StateTransaction[] {
    return this.transactions.get(stateId) || [];
  }
}