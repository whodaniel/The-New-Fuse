export declare const useAgentsWorkflow: () => {
    agents: Agent[];
    loading: boolean;
    error: Error | null;
    loadAgents: () => Promise<void>;
};
export default useAgentsWorkflow;
