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
  hydrateDarkMode: (persistedMode: boolean) => { // New action
    set({ isDarkMode: persistedMode });
  }
}));
