import { A2AMessage, AgentRegistration, AgentHeartbeat, AgentStatus, A2AError } from '@the-new-fuse/a2a-core';
export interface A2AConnectionConfig {
    url: string;
    agentId: string;
    token?: string;
    signature?: string;
}
export interface A2AConnectionState {
    connected: boolean;
    authenticated: boolean;
    connecting: boolean;
    error: string | null;
    lastHeartbeat: Date | null;
}
export interface A2AHookReturn {
    connectionState: A2AConnectionState;
    connect: () => Promise<void>;
    disconnect: () => void;
    sendMessage: (message: Omit<A2AMessage, 'id' | 'timestamp' | 'fromAgent'>) => Promise<void>;
    sendRequest: (toAgent: string, payload: any, options?: {
        timeout?: number;
        conversationId?: string;
    }) => Promise<A2AMessage>;
    broadcast: (payload: any, options?: {
        channel?: string;
        topic?: string;
    }) => Promise<void>;
    joinConversation: (conversationId: string) => Promise<void>;
    leaveConversation: (conversationId: string) => Promise<void>;
    discoverAgents: (criteria?: {
        type?: string;
        capabilities?: string[];
        status?: AgentStatus;
    }) => Promise<AgentRegistration[]>;
    sendHeartbeat: (data: Omit<AgentHeartbeat, 'agentId' | 'timestamp'>) => Promise<void>;
    onMessage: (callback: (message: A2AMessage) => void) => () => void;
    onAgentRegistered: (callback: (agent: AgentRegistration) => void) => () => void;
    onAgentDisconnected: (callback: (agentId: string) => void) => () => void;
    onError: (callback: (error: A2AError) => void) => () => void;
    messages: A2AMessage[];
    connectedAgents: string[];
}
export declare function useA2A(config: A2AConnectionConfig): A2AHookReturn;
//# sourceMappingURL=useA2A.d.ts.map