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
export { useAgents, useWorkflows } from './api.js';
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