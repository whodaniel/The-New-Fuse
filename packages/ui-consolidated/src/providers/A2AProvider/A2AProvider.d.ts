import React from 'react';
import { A2AConnectionConfig } from '../../hooks/useA2A';
import { AgentRegistration } from '@the-new-fuse/a2a-core';
export interface A2AProviderProps {
    children: React.ReactNode;
    config: A2AConnectionConfig;
    autoConnect?: boolean;
    autoRegister?: boolean;
    agentRegistration?: Omit<AgentRegistration, 'agentId'>;
}
export declare function A2AProvider({ children, config, autoConnect, autoRegister, agentRegistration }: A2AProviderProps): void;
//# sourceMappingURL=A2AProvider.d.ts.map