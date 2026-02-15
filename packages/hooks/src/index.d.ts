export * from './useFeatureToggle';
export * from './useApiClient';
export * from './useSuggestionActions';
export * from './useAuth';
export * from './useWebSocket';
export * from './hooks/useFeatureSuggestions';
export * from './hooks/useKanbanBoard';
export * from './hooks/useTimeline';
export * from './hooks/useKeyboardShortcuts';
export * from './hooks/useUndoRedo';
import * as apiHooks from './api/index';
export { useAgents, useWorkflows } from './api/index';
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
