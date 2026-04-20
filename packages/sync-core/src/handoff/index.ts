/**
 * Prompt Handoff Flywheel System
 * 
 * Exports all components of the prompt handoff flywheel system that integrates
 * with existing template and orchestration systems.
 */

export * from './PromptHandoffFlywheel.js';
export * from './EnhancedAgentHandoffTemplateService.js';
export * from './PromptTemplateIntegration.js';

// Re-export key types for convenience
export type {
  HandoffContext,
  HandoffExecution,
  HandoffTemplate,
  HandoffQueue,
  AgentCapability
} from './PromptHandoffFlywheel.js';

export type {
  EnhancedHandoffTemplate,
  TemplateVersion,
  TemplateAnalytics,
  HandoffSession
} from './EnhancedAgentHandoffTemplateService.js';

export type {
  IntegratedTemplate,
  TemplateExecutionResult
} from './PromptTemplateIntegration.js';