import { create } from 'zustand';
export const useStore = create((set) => ({
    // Initial value can be a non-committal default, Popup.tsx will hydrate it.
    isDarkMode: window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false,
    connectionStatus: 'disconnected',
    setDarkMode: (mode) => {
        set({ isDarkMode: mode });
        // Persistence is now handled by Popup.tsx, which will call this
        // after successfully saving to chrome.storage.
    },
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    hydrateDarkMode: (persistedMode) => {
        set({ isDarkMode: persistedMode });
    }
}));
//# sourceMappingURL=store.js.map