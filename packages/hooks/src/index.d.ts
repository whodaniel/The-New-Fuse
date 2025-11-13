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
export { useAgents, useWorkflows } from './api/index';
declare const apiUseAuth: any, restApiHooks: any;
export { apiUseAuth as useApiAuth };
export declare const apiHooksNamespace: any;
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