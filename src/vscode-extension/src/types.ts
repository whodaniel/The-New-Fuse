export interface AgentMessage {
  id: string;
  type: string;
  source: string; // Changed from sender
  recipient?: string;
  timestamp: number; // Changed from Date, to align with Date.now() usage
  metadata?: Record<string, any>;
  action?: string; // Ensured optional
  payload: any; // Standardized data property, content removed
}

export interface AgentRegistration {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  active: boolean;
  lastSeen: number;
  apiVersion: string;
  provider?: string; // Added as optional since it's required in some definitions
}

export interface TheFuseAPI {
  // Add placeholder methods or properties if known, otherwise leave empty
  // e.g., getModelAccess(modelId: string): Promise<LanguageModelAccessInformation | undefined>;
}

export interface LanguageModelAccessInformation {
  // Add placeholder properties if known, otherwise leave empty
  // e.g., endpoint?: string;
  // e.g., apiKey?: string;
}

export interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  // Add other potential options based on usage in provider files if necessary
}

export interface LLMModelInfo {
  id: string;
  name: string;
  maxTokens?: number;
}

export interface LLMProviderInfo {
  id: string;
  name: string;
  version: string;
  maxTokens: number;
  isAvailable: boolean; // indicates provider availability status
  models: string[] | LLMModelInfo[];
  description?: string; // Adding description as it's used in provider implementations
  capabilities?: string[]; // e.g., 'streaming', 'function_calling'
  status?: 'available' | 'unavailable' | 'beta';
  metadata?: Record<string, any>; // For additional provider-specific info
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): Promise<boolean>;
  getInfo(): Promise<LLMProviderInfo>;
  generate(prompt: string, options?: GenerateOptions, context?: any): Promise<string>; // context can be used for history, etc.
  // Optional methods for streaming, function calling, etc.
  // streamGenerate?(prompt: string, options?: GenerateOptions, context?: any): AsyncGenerator<string>;
}

// AICoder specific types, previously in ../types/ai-coder
export enum AICoderRole {
    Engineer = 'Software Engineer',
    Reviewer = 'Code Reviewer',
    Architect = 'Software Architect',
    Tester = 'QA Tester',
    Documenter = 'Technical Writer'
}

export interface AICoderContext {
    fileUri: import('vscode').Uri;
    selection?: import('vscode').Selection;
    workspaceFolder?: import('vscode').WorkspaceFolder;
    languageId?: string;
    metadata?: Record<string, any>;
}

export interface AICoderRequest {
    role: AICoderRole;
    task: string;
    context?: AICoderContext;
}

export interface AICoderSuggestion {
    text: string;
    // Potentially add range, type of suggestion, etc.
}
export interface AICoderResult {
    response: string;
    suggestions?: AICoderSuggestion[];
    error?: string;
}