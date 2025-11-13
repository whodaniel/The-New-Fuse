import React, { createContext, useContext, useMemo } from 'react';
const ApiContext = createContext(undefined);
/**
 * Hook to access the API context
 * @returns API context value
 *
 * @example
 * // Use API context
 * const { apiClient, authService } = useApi();
 *
 * // Make API requests
 * const handleLogin = async () => {
 *   try {
 *     await authService.login({ email, password });
 *     // Handle success
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export function useApi() {
    const context = useContext(ApiContext);
    if (!context) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
}
/**
 * API provider component
 * @param props API provider props
 * @returns API provider component
 *
 * @example
 * // Create API client and services
 * const apiClient = new ApiClient({
 *   baseURL: 'https://api.example.com',
 * });
 * const tokenStorage = new TokenStorage();
 * const authService = new AuthService(apiClient, tokenStorage);
 * const userService = new UserService(apiClient);
 * const agentService = new AgentService(apiClient);
 * const workflowService = new WorkflowService(apiClient);
 *
 * // Provide API client and services to the application
 * <ApiProvider
 *   apiClient={apiClient}
 *   tokenStorage={tokenStorage}
 *   authService={authService}
 *   userService={userService}
 *   agentService={agentService}
 *   workflowService={workflowService}
 * >
 *   <App />
 * </ApiProvider>
 */
export function ApiProvider({ apiClient, tokenStorage, authService, userService, agentService, workflowService, children, }) {
    const value = useMemo(() => ({
        apiClient,
        tokenStorage,
        authService,
        userService,
        agentService,
        workflowService,
    }), [apiClient, tokenStorage, authService, userService, agentService, workflowService]);
    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
//# sourceMappingURL=ApiProvider.js.map