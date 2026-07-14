// Legacy hooks
export * from './useFeatureToggle.js';
export * from './useApiClient.js';
export * from './useSuggestionActions.js';
export * from './useAuth.js'; // Exports useAuth
export * from './useWebSocket.js';
export * from './hooks/useFeatureSuggestions.js';
export * from './hooks/useKanbanBoard.js';
export * from './hooks/useTimeline.js';
export * from './hooks/useKeyboardShortcuts.js';
export * from './hooks/useUndoRedo.js';
// API hooks - use explicit re-exports to avoid naming conflicts
import * as apiHooks from './api/index.js';
export { useAgents, useWorkflows } from './api/index.js';
// Re-export all api hooks except useAuth which is already exported above
const { useAuth: apiUseAuth, ...restApiHooks } = apiHooks;
export { apiUseAuth as useApiAuth }; // Rename the conflicting export
export const apiHooksNamespace = apiHooks;
export { restApiHooks };
//# sourceMappingURL=index.js.map