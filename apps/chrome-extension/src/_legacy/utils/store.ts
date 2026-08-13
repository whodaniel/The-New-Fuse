import { create } from 'zustand';

interface PopupState {
  isDarkMode: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  // Keep setDarkMode to allow other components to request a mode change,
  // which Popup.tsx will then persist.
  setDarkMode: (mode: boolean) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'error' | 'connecting') => void;
  // Method to initialize/update from persisted settings
  hydrateDarkMode: (persistedMode: boolean) => void;
}

export const useStore = create<PopupState>((set) => ({
  // Initial value can be a non-committal default, Popup.tsx will hydrate it.
  isDarkMode: window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false,
  connectionStatus: 'disconnected',
  setDarkMode: (mode: boolean) => {
    set({ isDarkMode: mode });
    // Persistence is now handled by Popup.tsx, which will call this
    // after successfully saving to chrome.storage.
  },
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'error' | 'connecting') =>
    set({ connectionStatus: status }),
  hydrateDarkMode: (persistedMode: boolean) => {
    // New action
    set({ isDarkMode: persistedMode });
  },
}));

/**
 * Store class for chrome.storage abstraction
 * Used by SecurityManager for secure storage of secrets
 */
export class Store {
  private static instance: Store;

  static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  async get<T>(key: string): Promise<T | undefined> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] as T);
        });
      } else {
        // Fallback to localStorage for non-extension environments
        const value = localStorage.getItem(key);
        resolve(value ? JSON.parse(value) : undefined);
      }
    });
  }

  async set(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      } else {
        // Fallback to localStorage
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  }
}
