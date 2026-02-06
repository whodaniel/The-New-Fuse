// Legacy hooks
export { useAgents, useWorkflows } from './api/index';
export * from './hooks/useFeatureSuggestions';
export * from './hooks/useKanbanBoard';
export * from './hooks/useKeyboardShortcuts';
export * from './hooks/useTimeline';
export * from './hooks/useUndoRedo';
export * from './useApiClient';
export * from './useAuth'; // Exports useAuth
export * from './useFeatureToggle';
export * from './useSuggestionActions';
export * from './useWebSocket';
export { apiUseAuth as useApiAuth }; // Rename the conflicting export

// API hooks - use explicit re-exports to avoid naming conflicts
import * as apiHooks from './api/index';

// Re-export all api hooks except useAuth which is already exported above
const { useAuth: apiUseAuth, ...restApiHooks } = apiHooks;
export const apiHooksNamespace = apiHooks;
export { restApiHooks };

export interface UseAuthResult {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  isLoading: boolean; // Add the missing isLoading property
}
