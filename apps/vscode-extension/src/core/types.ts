/**
 * The New Fuse VSCode Extension - Core Types
 * Version 9.0.0 - Clean Architecture
 */

// ============================================
// Message Types
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  tokens?: number;
  processingTime?: number;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
  content?: string;
}

// ============================================
// Webview Message Protocol
// ============================================

export type WebviewMessageType =
  | 'ready'
  | 'sendMessage'
  | 'clearChat'
  | 'newChat'
  | 'attachFiles'
  | 'filesDropped'
  | 'setMode'
  | 'getStatus';

export interface WebviewMessage {
  type: WebviewMessageType;
  payload?: unknown;
}

export interface WebviewOutboundMessage {
  type: 'addMessage' | 'clearChat' | 'updateStatus' | 'focusInput' | 'setTheme' | 'error';
  payload?: unknown;
}

// ============================================
// LLM Provider Types
// ============================================

/**
 * Supported LLM providers (December 2025)
 * Includes both API-based and CLI-based providers
 */
export type LLMProviderType =
  // API-based providers
  | 'openai' // GPT-5.2, GPT-5.1-Codex-Max
  | 'anthropic' // Claude Opus 4.5, Sonnet 4.5
  | 'gemini' // Gemini 3 Pro, Gemini 2.5 Flash
  | 'openrouter' // Multi-provider access
  | 'litellm' // Self-hosted proxy
  | 'deepseek' // DeepSeek-V3.2-Speciale, DeepSeek-R1
  | 'qwen' // Qwen3-Coder, Qwen 2.5-Max
  | 'copilot' // VS Code Copilot
  // CLI-based agents (local tools)
  | 'claude-cli' // Anthropic Claude CLI
  | 'gemini-cli' // Google Gemini CLI
  | 'jules-cli' // Jules AI CLI
  | 'aider-cli' // Aider coding assistant
  | 'custom-cli'; // Custom CLI command

export interface LLMProviderConfig {
  type: LLMProviderType;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Configuration for CLI-based AI agents
 */
export interface CLIAgentConfig {
  name: string;
  command: string; // e.g., 'claude', 'gemini', 'jules'
  args?: string[]; // Additional CLI arguments
  env?: Record<string, string>;
  workingDirectory?: string;
  inputFormat: 'stdin' | 'arg' | 'file'; // How to pass the prompt
  outputFormat: 'stdout' | 'file' | 'json';
  timeout?: number; // Timeout in milliseconds
  enabled: boolean;
}

export interface LLMRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// ============================================
// MCP Types
// ============================================

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPConnection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  tools?: MCPTool[];
  resources?: MCPResource[];
  lastError?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

// ============================================
// Extension State
// ============================================

export interface ExtensionState {
  isInitialized: boolean;
  activeProvider: LLMProviderType | null;
  mcpConnections: MCPConnection[];
  chatHistory: ChatMessage[];
  currentMode: 'chat' | 'code' | 'agent';
}

export interface ExtensionConfig {
  defaultProvider: LLMProviderType;
  defaultModel: string;
  autoConnect: boolean;
  enableTelemetry: boolean;
  theme: 'auto' | 'light' | 'dark';
}

// ============================================
// Command Types
// ============================================

export interface CommandDefinition {
  id: string;
  title: string;
  category?: string;
  handler: () => Promise<void>;
}

// ============================================
// Status Types
// ============================================

export interface SystemStatus {
  version: string;
  isConnected: boolean;
  activeProvider: string | null;
  mcpStatus: 'active' | 'inactive' | 'partial';
  mcpServerCount: number;
}

// ============================================
// Extension API (For other extensions)
// ============================================

export interface AgentCapabilities {
  supportsStreaming: boolean;
  supportsImages: boolean;
  supportsTools: boolean;
}

export interface RegisteredAgent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapabilities;
}

export interface TheNewFuseAPI {
  /**
   * Register a new AI agent with the platform
   */
  registerAgent(agent: RegisteredAgent): void;

  /**
   * Send a message to the orchestrator/chat
   */
  sendMessage(message: string, context?: unknown): Promise<void>;

  /**
   * Get the current active LLM provider
   */
  getActiveProvider(): LLMProviderType | null;

  /**
   * Get list of connected MCP servers
   */
  getMCPServers(): MCPServerConfig[];
}
