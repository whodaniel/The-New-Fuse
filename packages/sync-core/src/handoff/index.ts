/**
 * Prompt Handoff Flywheel System
 * 
 * Exports all components of the prompt handoff flywheel system that integrates
 * with existing template and orchestration systems.
 */

export * from './PromptHandoffFlywheel';
export * from './EnhancedAgentHandoffTemplateService';
export * from './PromptTemplateIntegration';

// Re-export key types for convenience
export type {
  HandoffContext,
  HandoffExecution,
  HandoffTemplate,
  HandoffQueue,
  AgentCapability
} from './PromptHandoffFlywheel';

export type {
  EnhancedHandoffTemplate,
  TemplateVersion,
  TemplateAnalytics,
  HandoffSession
} from './EnhancedAgentHandoffTemplateService';

export type {
  IntegratedTemplate,
  TemplateExecutionResult
} from './PromptTemplateIntegration';