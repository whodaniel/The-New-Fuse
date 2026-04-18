/**
 * Agent Implementations Index
 * All agent implementations following the IAgent interface
 */

export { ResearchAgent } from './research_agent';
export type { ResearchConfig, ResearchQuery, ResearchResult, Source } from './research_agent';

export { LLMChatAgent } from './llm_chat_agent';
export type { ChatMessage, ChatResponse, ChatSession, LLMChatConfig } from './llm_chat_agent';

export { WorkflowAgent } from './workflow_agent';
export type {
  StepResult,
  Workflow,
  WorkflowConfig,
  WorkflowExecution,
  WorkflowStep,
} from './workflow_agent';

export { CascadeAgent } from './cascade_agent';
export type {
  CascadeConfig,
  CascadeExecution,
  CascadePipeline,
  CascadeStep,
  CascadeStepResult,
} from './cascade_agent';

export { InteractiveAgent } from './interactive_agent';
export type {
  InteractiveAction,
  InteractiveConfig,
  InteractiveMessage,
  InteractiveResponse,
  InteractiveSession,
} from './interactive_agent';

export { ClineAgent } from './cline_agent';
export type {
  ClineConfig,
  ClineResult,
  CodeGeneration,
  CommandExecution,
  FileOperation,
} from './cline_agent';

// Placeholder exports for remaining stubs (to be implemented)
export * from './enhanced_agent';
export * from './example_agent';
export * from './simple_enhanced_agent';
export * from './unified_agent';
