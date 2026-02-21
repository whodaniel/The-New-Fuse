// filepath: src/types/llm.types.ts

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface MessageOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ErrorMessage extends Message {
  id: string;
  timestamp: number;
  source: string;
  payload: unknown;
}

export interface SystemMessage extends Message {
  metadata?: Record<string, unknown>;
}

export interface UserMessage extends Message {
  userId?: string;
}
