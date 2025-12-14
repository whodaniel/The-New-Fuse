// Core message and conversation types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// System status types
export interface SystemStatus {
  isConnected: boolean;
  version: string;
  lastActivity?: string;
}

// VSCode API types (extensions to @types/vscode)
export interface WebviewMessage {
  type: string;
  content?: string;
  message?: Message;
  status?: string;
  provider?: string;
  files?: DroppedFile[];
}

export interface DroppedFile {
  name: string;
  size: number;
  type: string;
  path: string;
}

// AI Service types
export interface AIProvider {
  name: string;
  client: unknown; // Will be properly typed when importing OpenAI/Anthropic types
  status: 'healthy' | 'unhealthy' | 'unavailable';
  lastCheck: number;
  error?: string;
}

export interface AIHealthStatus {
  [provider: string]: {
    status: 'healthy' | 'unhealthy' | 'unavailable';
    lastCheck: number;
    error?: string;
  };
}

export interface AIGenerationOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  systemPrompt?: string;
  skipCache?: boolean;
}

export interface RateLimiter {
  requests: number;
  windowStart: number;
  limit: number;
  window: number;
}

export interface ConversationExport {
  history: Message[];
  provider: string;
  exportedAt: number;
}

// MCP Protocol types
export interface MCPServerConfig {
  id?: string;
  url: string;
  authToken?: string;
  autoConnect?: boolean;
  protocolVersion?: string;
}

export interface MCPClientCapabilities {
  tools: Record<string, unknown>;
  resources: Record<string, unknown>;
  prompts: Record<string, unknown>;
  logging: Record<string, unknown>;
}

export interface MCPInitializeParams {
  protocolVersion: string;
  capabilities: MCPClientCapabilities;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Record<string, unknown>[];
}

export interface MCPHealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: number;
  responseTime?: number;
}

export interface MCPServerStatus {
  id: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  connectedAt: number;
  lastHealthCheck: number;
  responseTime?: number;
  circuitBreaker: 'closed' | 'open' | 'half-open';
  failures: number;
  tools: string[];
  resources: string[];
  prompts: string[];
}

export interface MCPServerStatusSummary {
  totalServers: number;
  healthyServers: number;
  unhealthyServers: number;
  servers: MCPServerStatus[];
}

export interface CircuitBreaker {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

// Security types
export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors?: string[];
  warnings?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
}

export interface RateLimitCheck {
  allowed: boolean;
  remaining?: number;
  resetTime?: number;
}

export interface SecurityConfig {
  enabled: boolean;
  emergencyMode: boolean;
  rateLimits: Record<string, unknown>;
  permissions: Record<string, boolean>;
  auditEnabled: boolean;
  encryptionEnabled: boolean;
  httpsEnforced: boolean;
}

export interface SecurityHealthStatus {
  timestamp: string;
  modules: Record<string, 'healthy' | 'unhealthy' | 'uninitialized' | 'error'>;
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

export interface SecurityDashboard {
  securityEnabled: boolean;
  emergencyMode: boolean;
  lastSecurityCheck: string;
  modules: Record<string, { status: string }>;
  vulnerabilityScan?: unknown;
  auditStats?: unknown;
  rateLimitStats?: unknown;
  connectionStats?: unknown;
}

export interface AuditEvent {
  id: string;
  event?: string;
  eventType: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  extensionVersion?: string;
  details?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'high' | 'critical' | 'error';
}

export interface PermissionCheck {
  action: string;
  allowed: boolean;
  userId: string;
  timestamp: string;
}

// Configuration types
export interface ExtensionConfig {
  ai: {
    activeProvider?: string;
    contextWindowSize?: number;
  };
  security: {
    strictValidation?: boolean;
    maxInputLength?: number;
    encryptionEnabled?: boolean;
    connectionTimeout?: number;
    maxSockets?: number;
    scanInterval?: number;
    monitoringEnabled?: boolean;
    logLevel?: string;
    maxLogs?: number;
  };
}

// API response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

export interface AIResponse extends APIResponse<string> {
  provider: string;
  model: string;
  tokensUsed?: number;
}

// Error types
export class ExtensionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export class SecurityError extends ExtensionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SECURITY_ERROR', details);
    this.name = 'SecurityError';
  }
}

export class MCPError extends ExtensionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MCP_ERROR', details);
    this.name = 'MCPError';
  }
}

export class AIError extends ExtensionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AI_ERROR', details);
    this.name = 'AIError';
  }
}

// Type guards
export function isMessage(obj: unknown): obj is Message {
  return obj !== null &&
    typeof obj === 'object' &&
    'role' in obj &&
    typeof (obj as any).role === 'string' &&
    ['user', 'assistant', 'system'].includes((obj as any).role) &&
    'content' in obj &&
    typeof (obj as any).content === 'string' &&
    'timestamp' in obj &&
    typeof (obj as any).timestamp === 'string';
}

export function isWebviewMessage(obj: unknown): obj is WebviewMessage {
  return obj !== null &&
    typeof obj === 'object' &&
    'type' in obj &&
    typeof (obj as any).type === 'string';
}

export function isMCPServerConfig(obj: unknown): obj is MCPServerConfig {
  return obj !== null &&
    typeof obj === 'object' &&
    'url' in obj &&
    typeof (obj as any).url === 'string' &&
    ((obj as any).authToken === undefined || typeof (obj as any).authToken === 'string');
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;