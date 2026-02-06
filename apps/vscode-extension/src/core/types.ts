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
  type: 'text' | 'image' | 'pdf' | 'other';
  content?: string; // Base64 for images, text for documents
  mimeType?: string; // e.g., 'image/png', 'image/jpeg', 'text/plain'
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
  | 'sambanova' // SambaNova Cloud (Llama 3.1 405B)
  | 'openrouter' // Multi-provider access
  | 'litellm' // Self-hosted proxy
  | 'deepseek' // DeepSeek-V3.2-Speciale, DeepSeek-R1
  | 'qwen' // Qwen3-Coder, Qwen 2.5-Max
  | 'copilot' // VS Code Copilot
  | 'google-antigravity' // Antigravity Cloud Code Assist
  | 'kilocode' // Kilo Code free tier
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
  tools?: ToolDefinition[]; // Tool definitions for function calling
  onChunk?: (chunk: string) => void; // Streaming callback
  enableThinking?: boolean; // For Claude 3.7+ and o1
  thinkingBudget?: number; // For o1 models
  // Tool Discovery Protocol support
  enableToolSearch?: boolean; // Enable dynamic tool search (adds beta headers)
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
  toolCalls?: any[]; // Tool calls requested by the model
  // Tool Discovery Protocol support
  toolSearchResults?: any[]; // Results from tool_search_tool (contains tool_reference blocks)
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
  // Tool Discovery Protocol support
  default_defer_loading?: boolean; // Whether to defer tools by default
  always_loaded_tools?: string[]; // Tools to never defer (always load immediately)
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
  // Tool Discovery Protocol support (Anthropic advanced-tool-use-2025-11-20)
  defer_loading?: boolean; // Whether tool should be loaded lazily via search
  always_load?: boolean; // Whether tool must always be loaded (never deferred)
  category?: string; // Tool category for filtering
  keywords?: string[]; // Keywords for BM25 search indexing
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

// ============================================
// Tool Orchestration Types
// ============================================

/**
 * Tool definition for LLM function calling
 * Compatible with both Anthropic and OpenAI formats
 * Extended with Tool Discovery Protocol support
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  // Tool Discovery Protocol (Anthropic advanced-tool-use-2025-11-20)
  defer_loading?: boolean; // Mark tool for lazy loading via search
}

/**
 * Tool use request from LLM (Anthropic format)
 */
export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  tool_use_id: string;
  content: string | Record<string, unknown>;
  is_error?: boolean;
}

/**
 * Tool call from OpenAI format
 */
export interface FunctionCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

// ============================================
// Workspace Service Types
// ============================================

/**
 * Options for text search in workspace
 */
export interface SearchOptions {
  pattern: string; // Search text or regex
  isRegex?: boolean;
  isCaseSensitive?: boolean;
  includePattern?: string; // Glob pattern for files to include
  excludePattern?: string; // Glob pattern for files to exclude
  maxResults?: number; // Limit number of results
}

/**
 * Single search result
 */
export interface SearchResult {
  file: string; // File path
  line: number; // Line number (1-indexed)
  column: number; // Column number (1-indexed)
  matchText: string; // The matching line
  contextBefore?: string[]; // Lines before the match
  contextAfter?: string[]; // Lines after the match
}

/**
 * Workspace file tree node
 */
export interface FileTree {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTree[];
  size?: number;
}

// ============================================
// Git Service Types
// ============================================

/**
 * Git commit information
 */
export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
}

/**
 * Git file status
 */
export interface GitFileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

/**
 * Git blame information for a line
 */
export interface GitBlameInfo {
  commit: GitCommit;
  line: number;
  originalLine: number;
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
// Tool Discovery Protocol Types
// ============================================

/**
 * Configuration for Anthropic Tool Search/Discovery Protocol
 * See: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool
 */
export interface ToolSearchConfig {
  enabled: boolean; // Enable tool search protocol
  maxResults: number; // Max tools returned per search (default: 5)
  defaultMethod: 'regex' | 'bm25'; // Default search algorithm
  alwaysLoadedTools: string[]; // Tools to never defer
  deferredCategories: string[]; // Tool categories to defer by default
}

/**
 * Tool search result from tool_search_tool
 */
export interface ToolSearchResult {
  tools: ToolDefinition[]; // Discovered tools
  search_query: string; // The query used
  search_method: 'regex' | 'bm25'; // Search method used
  total_available: number; // Total deferred tools available
  processing_time_ms: number; // Search time in milliseconds
}

/**
 * Tool reference returned by tool search (before expansion)
 */
export interface ToolReference {
  type: 'tool_reference';
  tool_name: string;
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
