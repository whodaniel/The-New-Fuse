import { useState, useEffect } from 'react';

// Legacy hooks
export * from './useFeatureToggle';
export * from './useApiClient';
export * from './useSuggestionActions';
export * from './useAuth'; // Exports useAuth
export * from './useWebSocket';
export * from './hooks/useFeatureSuggestions';
export * from './hooks/useKanbanBoard';
export * from './hooks/useTimeline';
export * from './hooks/useKeyboardShortcuts';
export * from './hooks/useUndoRedo';

// API hooks - use explicit re-exports to avoid naming conflicts
import * as apiHooks from './api/index';
export { 
  useAgents,
  useWorkflows
} from './api/index';

// Re-export all api hooks except useAuth which is already exported above
const {useAuth: apiUseAuth, ...restApiHooks} = apiHooks;
export {apiUseAuth as useApiAuth}; // Rename the conflicting export
export const apiHooksNamespace = apiHooks;
export {restApiHooks};

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