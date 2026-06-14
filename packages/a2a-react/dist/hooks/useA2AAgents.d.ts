export declare function useA2AAgents(): {
    agents: {
        agentId: string;
        name: string;
        type: import("@the-new-fuse/a2a-core", { with: { "resolution-mode": "import" } }).AgentType;
        version: string;
        capabilities: string[];
        description?: string | undefined;
        metadata?: Record<string, any> | undefined;
        endpoints?: {
            websocket?: string | undefined;
            http?: string | undefined;
            redis?: string | undefined;
        } | undefined;
        authentication?: {
            type: "token" | "none" | "certificate";
            credentials?: Record<string, string> | undefined;
        } | undefined;
        maxConcurrentRequests?: number | undefined;
        averageResponseTime?: number | undefined;
        reliability?: number | undefined;
        lastSeen?: number | undefined;
        isOnline?: boolean | undefined;
    }[];
    refreshAgents: () => Promise<void>;
    findAgentsByType: (type: string) => {
        agentId: string;
        name: string;
        type: import("@the-new-fuse/a2a-core", { with: { "resolution-mode": "import" } }).AgentType;
        version: string;
        capabilities: string[];
        description?: string | undefined;
        metadata?: Record<string, any> | undefined;
        endpoints?: {
            websocket?: string | undefined;
            http?: string | undefined;
            redis?: string | undefined;
        } | undefined;
        authentication?: {
            type: "token" | "none" | "certificate";
            credentials?: Record<string, string> | undefined;
        } | undefined;
        maxConcurrentRequests?: number | undefined;
        averageResponseTime?: number | undefined;
        reliability?: number | undefined;
        lastSeen?: number | undefined;
        isOnline?: boolean | undefined;
    }[];
};
//# sourceMappingURL=useA2AAgents.d.ts.map