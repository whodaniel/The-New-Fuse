/**
 * Base types and interfaces shared across the Chrome extension
 */

// Message types for communication
export interface Message {
  type: string;
  data: unknown;
  source?: string;
  timestamp?: number;
}

// Event listener types
export interface EventHandler {
  (event: CustomEvent): void;
}

export interface ExtensionEventMap {
  'message': CustomEvent<Message>;
  'status': CustomEvent<string>;
  'error': CustomEvent<Error>;
}

// Storage types
export interface StorageData {
  apiKey?: string;
  settings?: ExtensionSettings;
  history?: Message[];
}

export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoSync: boolean;
  debugMode: boolean;
}

// API types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

// Store types
export interface GlobalState {
  messages: Message[];
  settings: ExtensionSettings;
  connected: boolean;
  loading: boolean;
  error: string | null;
}

export type ActionHandler<T> = (state: GlobalState, payload: T) => Partial<GlobalState>;
