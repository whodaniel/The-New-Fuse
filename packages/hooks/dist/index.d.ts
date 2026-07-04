export * from './useFeatureToggle.js';
export * from './useApiClient.js';
export * from './useSuggestionActions.js';
export * from './useAuth.js';
export * from './useWebSocket.js';
export * from './hooks/useFeatureSuggestions.js';
export * from './hooks/useKanbanBoard.js';
export * from './hooks/useTimeline.js';
export * from './hooks/useKeyboardShortcuts.js';
export * from './hooks/useUndoRedo.js';
import * as apiHooks from './api/index.js';
export { useAgents, useWorkflows } from './api/index.js';
declare const apiUseAuth: typeof apiHooks.useAuth, restApiHooks: {
    useAgents(options: apiHooks.UseAgentsOptions): apiHooks.UseAgentsResult;
    useWorkflows(options: apiHooks.UseWorkflowsOptions): apiHooks.UseWorkflowsResult;
};
export { apiUseAuth as useApiAuth };
export declare const apiHooksNamespace: typeof apiHooks;
export { restApiHooks };
export interface UseAuthResult {
    isAuthenticated: boolean;
    user: any | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, name: string) => Promise<void>;
    loading: boolean;
    error: string | null;
    isLoading: boolean;
}
//# sourceMappingURL=index.d.ts.map