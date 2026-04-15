import { createContext } from 'react';

// Auth Context Types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthContextProps {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
});

// API Client Context Types
export interface ApiClientContextProps {
  baseUrl: string;
  apiKey?: string;
  client?: any;
  isReady: boolean;
}

export const ApiClientContext = createContext<ApiClientContextProps>({
  baseUrl: '',
  isReady: false,
});

// WebSocket Context Types
export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface WebSocketContextProps {
  isConnected: boolean;
  send: (message: WebSocketMessage) => void;
  messages: WebSocketMessage[];
}

export const WebSocketContext = createContext<WebSocketContextProps>({
  isConnected: false,
  send: () => { throw new Error('Not implemented'); },
  messages: [],
});

// Feature Toggle Context Types
export interface FeatureFlags {
  [key: string]: boolean;
}

export interface FeatureToggleContextProps {
  features: FeatureFlags;
  isEnabled: (featureName: string) => boolean;
  setFeature: (featureName: string, enabled: boolean) => void;
}

export const FeatureToggleContext = createContext<FeatureToggleContextProps>({
  features: {},
  isEnabled: () => false,
  setFeature: () => {},
});

// Suggestion Actions Context Types
export interface SuggestionActionsContextProps {
  createSuggestion: (title: string, description: string) => Promise<void>;
  voteSuggestion: (id: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  deleteSuggestion: (id: string) => Promise<void>;
  loading: boolean;
}

export const SuggestionActionsContext = createContext<SuggestionActionsContextProps>({
  createSuggestion: async () => { throw new Error('Not implemented'); },
  voteSuggestion: async () => { throw new Error('Not implemented'); },
  updateStatus: async () => { throw new Error('Not implemented'); },
  deleteSuggestion: async () => { throw new Error('Not implemented'); },
  loading: false,
});