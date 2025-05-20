import { create } from 'zustand';

interface PopupState {
  isDarkMode: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  setDarkMode: (mode: boolean) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'error' | 'connecting') => void;
}

// Use chrome.storage.local to persist dark mode preference
const getInitialDarkMode = (): boolean => {
  // Default to system preference if available
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  return false;
};

export const useStore = create<PopupState>((set) => ({
  isDarkMode: getInitialDarkMode(),
  connectionStatus: 'disconnected',
  setDarkMode: (mode: boolean) => {
    set({ isDarkMode: mode });
    // Also save to storage for persistence
    if (chrome.storage) {
      chrome.storage.local.set({ isDarkMode: mode });
    }
  },
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'error' | 'connecting') => 
    set({ connectionStatus: status }),
}));
