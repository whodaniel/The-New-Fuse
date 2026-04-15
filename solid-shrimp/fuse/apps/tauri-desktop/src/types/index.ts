/**
 * Core Types for The New Fuse Tauri Desktop
 */

// Agent Types
export interface Agent {
  id: string;
  name: string;
  type: 'claude' | 'gemini' | 'gpt' | 'perplexity' | 'custom' | 'local';
  status: 'active' | 'idle' | 'error' | 'offline';
  description: string;
  capabilities: string[];
  lastActive: string;
  tasks: number;
  config: AgentConfig;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
}

// Workflow Types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'archived';
}

export interface WorkflowNode {
  id: string;
  type: 'agent' | 'mcpTool' | 'flowControl' | 'input' | 'output';
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// MCP Types
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  author: string;
  installed: boolean;
  enabled: boolean;
  tools: MCPTool[];
  config?: Record<string, any>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  agentId?: string;
  agentName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  agents: string[];
  createdAt: string;
  updatedAt: string;
}

// Stats Types
export interface DashboardStats {
  activeAgents: number;
  totalWorkflows: number;
  tasksToday: number;
  successRate: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  agentName: string;
  action: string;
  status: 'success' | 'pending' | 'error';
  timestamp: string;
}

// Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  apiKeys: Record<string, string>;
  defaultProvider: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  taskCompletion: boolean;
  agentErrors: boolean;
  systemUpdates: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
