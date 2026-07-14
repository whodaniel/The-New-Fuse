import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ENV_ENDPOINTS,
  deriveWsUrlFromApi,
  type EndpointSet,
  type TnfDesktopEnvironment,
} from '../config/endpoints';
import { safeStorage } from '../lib/safeStorage';
import BrowserControlService from '../services/BrowserControlService';
import FederationNodeService from '../services/FederationNodeService';
import apiService from '../services/api';
import wsService from '../services/websocket';

/**
 * Settings Store - Manage application settings and connection state
 */

export type Environment = TnfDesktopEnvironment;

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

const ENV_CONFIG: Record<Exclude<Environment, 'custom'>, EndpointSet> = ENV_ENDPOINTS;

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
          wsUrl = deriveWsUrlFromApi(apiUrl);
          relayUrl = ENV_CONFIG.local.relay;
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
      storage: createJSONStorage(() => safeStorage),
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
