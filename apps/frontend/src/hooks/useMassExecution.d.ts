export declare const useMassExecution: () => {
    executeAggregate: (agentIds: string[], input: any, config: {
        aggregationStrategy: "majority_vote" | "weighted_average" | "consensus";
        parallelExecution?: boolean;
    }) => Promise<any>;
    executeReflect: (predictorAgentId: string, reflectorAgentId: string, input: any, config: {
        maxRounds?: number;
    }) => Promise<any>;
    executeDebate: (debaterAgentIds: string[], input: any, config: {
        debateRounds?: number;
        votingStrategy?: "majority" | "weighted" | "consensus";
    }) => Promise<any>;
    executeCustomAgent: (agentId: string, input: any, config: any) => Promise<any>;
    executeToolUse: (agentId: string, toolName: string, input: any, config: any) => Promise<any>;
    loading: boolean;
    error: string | null;
};
