/**
 * Types related to LLM providers and models
 */

export enum LLMProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  GOOGLE_ADK = 'google-adk',
  OPENROUTER = 'openrouter',
  LITELLM = 'litellm',
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
  COPILOT = 'copilot',
  CLAUDE_CLI = 'claude-cli',
  GEMINI_CLI = 'gemini-cli',
  JULES_CLI = 'jules-cli',
  AIDER_CLI = 'aider-cli',
  OPENCODE = 'opencode',
  OPENCODE_CLI = 'opencode-cli',
  CUSTOM_CLI = 'custom-cli',
}

export interface ModelCost {
  input: number; // Cost per 1K tokens for input
  output: number; // Cost per 1K tokens for output
}

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  costPer1kTokens: ModelCost;
  maxOutputTokens?: number;
  capabilities?: string[];
}

export interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  models: LLMModel[];
  available: boolean;
  maxRatePerMinute: number;
  capabilities?: string[];
  authType?: 'bearer' | 'header' | 'query';
}

export interface CompletionOptions {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  user?: string;
  stream?: boolean;
  provider?: string;
}

export interface CompletionResult {
  id: string;
  provider: string;
  model: string;
  completion: string;
  finishReason: 'stop' | 'length' | 'content_filter' | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  created: number;
}
