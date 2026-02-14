export { useAgents, useWorkflows } from './api/index';
export * from './hooks/useFeatureSuggestions';
export * from './hooks/useKanbanBoard';
export * from './hooks/useKeyboardShortcuts';
export * from './hooks/useTimeline';
export * from './hooks/useUndoRedo';
export * from './useApiClient';
export * from './useAuth';
export * from './useFeatureToggle';
export * from './useSuggestionActions';
export * from './useWebSocket';
export { apiUseAuth as useApiAuth };
import * as apiHooks from './api/index';
declare const apiUseAuth: typeof apiHooks.useAuth,
  restApiHooks: {
    useAgents(options: apiHooks.UseAgentsOptions): apiHooks.UseAgentsResult;
    useWorkflows(options: apiHooks.UseWorkflowsOptions): apiHooks.UseWorkflowsResult;
  };
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
