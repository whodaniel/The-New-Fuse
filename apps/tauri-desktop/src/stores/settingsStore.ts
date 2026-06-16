import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import BrowserControlService from '../services/BrowserControlService';
import FederationNodeService from '../services/FederationNodeService';
import apiService from '../services/api';
import wsService from '../services/websocket';

/**
 * Settings Store - Manage application settings and connection state
 */

export type Environment = 'local' | 'sandbox' | 'production' | 'custom';

interface SettingsState {
  environment: Environment;
  apiUrl: string;
  customApiUrl: string;
  isCloudMode: boolean;

  // Actions
  setEnvironment: (env: Environment) => void;
  setCustomApiUrl: (url: string) => void;
  toggleCloudMode: () => void;
}

const ENV_CONFIG: Record<Exclude<Environment, 'custom'>, { api: string; ws: string; relay: string }> = {
  local: {
    api: 'http://localhost:3001',
    ws: 'ws://localhost:3001/ws',
    relay: 'ws://127.0.0.1:3000/ws',
  },
  sandbox: {
    api: 'https://api-gateway-241337102384.us-central1.run.app',
    ws: 'wss://api-gateway-241337102384.us-central1.run.app/ws',
    relay: 'wss://api-gateway-241337102384.us-central1.run.app/ws',
  },
  production: {
    api: 'https://thenewfuse.com/api',
    ws: 'wss://thenewfuse.com/ws',
    relay: 'wss://thenewfuse.com/ws',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      environment: 'local',
      apiUrl: ENV_CONFIG.local.api,
      customApiUrl: '',
      isCloudMode: false,

      setEnvironment: (env) => {
        let apiUrl = '';
        let wsUrl = '';
        let relayUrl = '';

        if (env === 'custom') {
          apiUrl = get().customApiUrl;
          wsUrl = apiUrl.startsWith('https')
            ? apiUrl.replace('https', 'wss').replace('/api', '') + '/ws'
            : apiUrl.replace('http', 'ws').replace('/api', '') + '/ws';
          relayUrl = wsUrl;
        } else {
          const config = ENV_CONFIG[env as Exclude<Environment, 'custom'>];
          apiUrl = config.api;
          wsUrl = config.ws;
          relayUrl = config.relay;
        }

        set({ environment: env, apiUrl });

        if (apiUrl) {
          apiService.setBaseUrl(apiUrl);
        }
        if (wsUrl) {
          wsService.setUrl(wsUrl);
        }
        if (relayUrl) {
          BrowserControlService.setRelayUrl(relayUrl);
          FederationNodeService.setRelayUrl(relayUrl);
        }
      },

      setCustomApiUrl: (url) => {
        set({ customApiUrl: url });
        if (get().environment === 'custom') {
          get().setEnvironment('custom'); // Re-trigger updates
        }
      },

      toggleCloudMode: () => {
        const newMode = !get().isCloudMode;
        set({ isCloudMode: newMode });

        // If enabling cloud mode and in local env, switch to sandbox
        if (newMode && get().environment === 'local') {
          get().setEnvironment('sandbox');
        } else if (!newMode && get().environment !== 'local') {
          get().setEnvironment('local');
        }
      },
    }),
    {
      name: 'tnf-settings-store',
      // Ensure we re-apply the base URL on load
      onRehydrateStorage: () => (state) => {
        if (state?.apiUrl) {
          apiService.setBaseUrl(state.apiUrl);
        }
        if (state?.environment && state.environment !== 'custom') {
          const relayUrl = ENV_CONFIG[state.environment].relay;
          BrowserControlService.setRelayUrl(relayUrl);
          FederationNodeService.setRelayUrl(relayUrl);
        }
      },
    }
  )
);
