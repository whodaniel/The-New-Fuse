export declare const tools: {
    queryAgentState: any;
    scheduleTask: any;
    updateAgentCapabilities: any;
};
export declare const executions: {
    updateAgentCapabilities: ({ capabilities }: {
        capabilities: string[];
    }) => Promise<{
        success: boolean;
        updatedCapabilities: string[];
    }>;
};
