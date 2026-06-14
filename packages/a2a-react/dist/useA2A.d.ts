import { AgentRegistration, A2AMessage } from '@the-new-fuse/a2a-core';
export interface A2AConnectionConfig {
    url: string;
    agentId: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}
export interface A2AConnectionState {
    connected: boolean;
    connecting: boolean;
    authenticated: boolean;
    error: string | null;
    reconnectAttempts: number;
}
export interface A2AHookReturn {
    connectionState: A2AConnectionState;
    connect: () => Promise<void>;
    disconnect: () => void;
    registerAgent: (registration: AgentRegistration) => Promise<void>;
    sendMessage: (message: Partial<A2AMessage>) => Promise<void>;
    agents: any[];
    messages: A2AMessage[];
}
export declare function useA2A(config: A2AConnectionConfig): A2AHookReturn;
//# sourceMappingURL=useA2A.d.ts.map