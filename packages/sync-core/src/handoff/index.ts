/**
 * Prompt Handoff Flywheel System
 *
 * Exports all components of the prompt handoff flywheel system that integrates
 * with existing template and orchestration systems.
 */

export * from './EnhancedAgentHandoffTemplateService';
export * from './PromptHandoffFlywheel';
export * from './PromptTemplateIntegration';

// Re-export key types for convenience
export type {
  AgentCapability,
  HandoffContext,
  HandoffExecution,
  HandoffQueue,
  HandoffTemplate,
} from './PromptHandoffFlywheel';

export type {
  EnhancedHandoffTemplate,
  HandoffSession,
  TemplateAnalytics,
  TemplateVersion,
} from './EnhancedAgentHandoffTemplateService';

export type { IntegratedTemplate, TemplateExecutionResult } from './PromptTemplateIntegration';
