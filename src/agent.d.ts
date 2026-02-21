/**
 * Agent-related type definitions
 */

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  capabilities: string[];
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  config?: Record<string, unknown>;
}

export interface AgentConfig {
  tools?: AgentTool[];
  memory?: boolean;
  visualization?: boolean;
}

export interface AgentTool {
  name: string;
  description: string;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface CreateAgentDto {
  name: string;
  description?: string;
  type: string;
  capabilities: string[];
  systemPrompt?: string;
  status?: string;
  configuration?: Record<string, unknown>;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  systemPrompt?: string;
  capabilities?: string[];
  status?: string;
  configuration?: Record<string, unknown>;
}
