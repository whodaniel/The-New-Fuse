import React, { createContext, ReactNode, useContext } from 'react';
import { useRelayCore, UseRelayCoreReturn } from './useRelayCore';

/**
 * Context for the Relay Bridge.
 * Stores the singleton instance of the Relay connection.
 */
const RelayContext = createContext<UseRelayCoreReturn | null>(null);

/**
 * Props for the RelayProvider
 */
interface RelayProviderProps {
  children: ReactNode;
}

/**
 * RelayProvider
 * Wraps the application to provide global access to the Relay Bridge.
 * This ensures the connection logic in useRelayCore is instantiated once.
 */
export const RelayProvider: React.FC<RelayProviderProps> = ({ children }) => {
  const relay = useRelayCore();

  return <RelayContext.Provider value={relay}>{children}</RelayContext.Provider>;
};

/**
 * Hook to consume the Relay Context.
 * Throws an error if used outside of RelayProvider.
 */
export const useRelay = (): UseRelayCoreReturn => {
  const context = useContext(RelayContext);

  if (!context) {
    throw new Error('useRelay must be used within a RelayProvider');
  }

  return context;
};
