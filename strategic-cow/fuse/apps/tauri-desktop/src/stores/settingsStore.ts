import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import BrowserControlService from '../services/BrowserControlService';
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

const ENV_CONFIG: Record<Exclude<Environment, 'custom'>, { api: string; ws: string }> = {
  local: {
    api: 'http://localhost:3001',
    ws: 'ws://localhost:3001/ws',
  },
  sandbox: {
    api: 'https://tnf-cloud-sandbox-production.up.railway.app',
    ws: 'wss://tnf-cloud-sandbox-production.up.railway.app/ws', // Backend typically handles WS on the same port/domain
  },
  production: {
    api: 'https://thenewfuse.com/api',
    ws: 'wss://thenewfuse.com/ws', // Assumes /ws is the WebSocket endpoint on production
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

        if (env === 'custom') {
          apiUrl = get().customApiUrl;
          // Simple derivation for custom URLs, can be improved or made explicit in UI later
          wsUrl = apiUrl.startsWith('https')
            ? apiUrl.replace('https', 'wss').replace('/api', '') + '/ws'
            : apiUrl.replace('http', 'ws').replace('/api', '') + '/ws';
        } else {
          const config = ENV_CONFIG[env as Exclude<Environment, 'custom'>];
          apiUrl = config.api;
          wsUrl = config.ws;
        }

        set({ environment: env, apiUrl });

        // Update services
        if (apiUrl) {
          apiService.setBaseUrl(apiUrl);
        }
        if (wsUrl) {
          wsService.setUrl(wsUrl);
          // Assuming Relay shares the same WS URL structure for now,
          // or we can add a specific 'relay' field to ENV_CONFIG later.
          // For now, syncing them ensures "Cloud" mode points to Cloud WS.
          BrowserControlService.setRelayUrl(wsUrl);
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
      },
    }
  )
);
