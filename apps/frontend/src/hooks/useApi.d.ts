/**
 * Hook for accessing API services
 *
 * @example
 * // Usage in a component
 * const { authService, userService, agentService, workflowService } = useApi();
 *
 * // Get all agents
 * const fetchAgents = async () => {
 *   const { data } = await agentService.getAgents();
 *   setAgents(data);
 * };
 */
export declare function useApi(): {
    api: any;
    authService: any;
    userService: any;
    agentService: any;
    workflowService: any;
    isAuthenticated: boolean;
    loading: boolean;
    error: Error | null;
    callApi: <T>(apiCall: () => Promise<T>) => Promise<T | null>;
};
