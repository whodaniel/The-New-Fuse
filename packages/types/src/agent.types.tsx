import type { JsonValue, DataMap } from './core/base-types.js';

export interface AgentConfig {
  tools?: AgentTool[];
  memory?: boolean;
  visualization?: boolean;
}

export interface AgentTool {
  name: string;
  type: string;
  description: string;
  parameters?: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
  execute: (input: DataMap) => Promise<JsonValue>;
}

export interface AgentResponse {
  result: unknown;
  visualization?: {
    nodes: unknown[];
    edges: unknown[];
  };
}

export interface AgentMessage {
  payload: Record<string, unknown>;
}
