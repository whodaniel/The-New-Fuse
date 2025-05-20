import type { UnknownRecord } from './core/index.js';

// TODO: Define state management types and interfaces here.
// For example:

/**
 * Represents a generic state object.
 */
export interface AppState {
  [key: string]: unknown; // Allow arbitrary properties
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Represents an action that can modify the state.
 */
export interface StateAction {
  type: string;
  payload?: UnknownRecord | unknown; // Payload can be anything
}

/**
 * Represents a reducer function that takes the current state and an action,
 * and returns the new state.
 */
export type StateReducer<S extends AppState = AppState> = (
  state: S,
  action: StateAction
) => S;

/**
 * Represents a store that holds the state and allows dispatching actions.
 */
export interface StateStore<S extends AppState = AppState> {
  getState: () => S;
  dispatch: (action: StateAction) => void;
  subscribe: (listener: () => void) => () => void; // Returns an unsubscribe function
}

// Re-export imported types or define specific state types
export type { UnknownRecord };
