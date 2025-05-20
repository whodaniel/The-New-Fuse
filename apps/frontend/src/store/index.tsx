import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define the shape of your store's state
interface AppState {
  system: {
    isDevelopment: boolean;
    // Add other system-related state properties here
  };
  // Add other top-level state slices here (e.g., user, chat, agents)
  // Example:
  // user: {
  //   currentUser: User | null;
  //   isLoading: boolean;
  // };
}

// Define actions (functions to update the state)
interface AppActions {
  setDevelopmentMode: (isDev: boolean) => void;
  // Add other actions here
}

// Create the Zustand store
const useStoreImpl = create<AppState & AppActions>()(
  devtools(
    (set) => ({
      // Initial state
      system: {
        // Determine initial development mode (e.g., from env vars or hostname)
        isDevelopment: process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost',
      },
      // user: { currentUser: null, isLoading: false },

      // Actions implementation
      setDevelopmentMode: (isDev) =>
        set((state) => ({ system: { ...state.system, isDevelopment: isDev } }), false, 'setDevelopmentMode'),

      // Add other action implementations here
    }),
    { name: 'AppStore' } // Name for Redux DevTools extension
  )
);

// Export the hook for components to use
export const useStore = useStoreImpl;

// Optional: Export parts of the state or actions directly if needed
// export const useSystemState = () => useStore((state) => state.system);
