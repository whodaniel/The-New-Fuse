import type { JsonValue, DataMap } from './core/base-types.js';

export interface State<T = unknown> {
  data: T;
  meta: StateMetadata;
  timestamp: number;
}

export interface StateMetadata {
  version: number;
  lastModified: string;
  author?: string;
  changeType?: string;
  customData?: Record<string, JsonValue>;
}

export interface StateManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  subscribe(callback: (state: State) => void): () => void;
}

export interface StateQuery {
  key?: string;
  version?: number;
  fromTimestamp?: number;
  toTimestamp?: number;
  author?: string;
}

export interface StateTransaction {
  id: string;
  changes: Array<{
    key: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  timestamp: number;
  metadata: StateMetadata;
}

export interface StateSnapshot {
  id: string;
  state: Record<string, unknown>;
  timestamp: number;
  metadata: StateMetadata;
}
