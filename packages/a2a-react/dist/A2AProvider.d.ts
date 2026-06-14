import React from 'react';
import { A2AConnectionConfig, A2AHookReturn } from './useA2A';
import { AgentRegistration } from '@the-new-fuse/a2a-core';
export interface A2AContextType extends A2AHookReturn {
}
export interface A2AProviderProps {
    config: A2AConnectionConfig;
    autoConnect?: boolean;
    autoRegister?: boolean;
    agentRegistration?: AgentRegistration;
    children: React.ReactNode;
}
export declare function A2AProvider({ config, autoConnect, autoRegister, agentRegistration, children }: A2AProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useA2AContext(): A2AContextType;
//# sourceMappingURL=A2AProvider.d.ts.map