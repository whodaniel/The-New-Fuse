import React, { createContext, useContext, useEffect, useState } from 'react';
import { useA2A, A2AConnectionConfig, A2AHookReturn } from './useA2A';
import { AgentRegistration, A2AMessage, AgentStatus } from '@the-new-fuse/a2a-core';

export interface A2AContextType extends A2AHookReturn {
  // Additional context-specific methods can be added here
}

const A2AContext = createContext<A2AContextType | null>(null);

export interface A2AProviderProps {
  config: A2AConnectionConfig;
  autoConnect?: boolean;
  autoRegister?: boolean;
  agentRegistration?: AgentRegistration;
  children: React.ReactNode;
}

export function A2AProvider({
  config,
  autoConnect = false,
  autoRegister = false,
  agentRegistration,
  children
}: A2AProviderProps) {
  const a2aHook = useA2A(config);

  useEffect(() => {
    if (autoConnect && !a2aHook.connectionState.connected) {
      a2aHook.connect();
    }
  }, [autoConnect, a2aHook.connectionState.connected, a2aHook.connect]);

  useEffect(() => {
    if (autoRegister && agentRegistration && a2aHook.connectionState.authenticated) {
      a2aHook.registerAgent(agentRegistration);
    }
  }, [autoRegister, agentRegistration, a2aHook.connectionState.authenticated, a2aHook.registerAgent]);

  const contextValue: A2AContextType = {
    ...a2aHook
  };

  return (
    <A2AContext.Provider value={contextValue}>
      {children}
    </A2AContext.Provider>
  );
}

export function useA2AContext(): A2AContextType {
  const context = useContext(A2AContext);
  if (!context) {
    throw new Error('useA2AContext must be used within an A2AProvider');
  }
  return context;
}