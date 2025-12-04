interface Agent {
    id: string;
    name: string;
    type: string;
    status: string;
}
export declare function useAgents(): {
    agents: Agent[];
    selectedAgent: string | null;
    conversationId: string | null;
    selectAgent: (agentId: string) => void;
    clearConversation: () => void;
};
export {};
