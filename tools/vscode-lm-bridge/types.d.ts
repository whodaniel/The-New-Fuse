/**
 * TypeScript type definitions for VS Code Language Model Bridge
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunkDelta {
  role?: 'assistant';
  content?: string;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: ChatCompletionChunkDelta;
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface Model {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  family: string;
  vendor: string;
  maxInputTokens: number;
  capabilities: {
    chat: boolean;
    streaming: boolean;
  };
}

export interface ModelsListResponse {
  object: 'list';
  data: Model[];
}

export interface ErrorResponse {
  error: {
    message: string;
    type: 'authentication_error' | 'invalid_request_error' | 'server_error';
    code?: string;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  vsCodeConnected: boolean;
  modelsLoaded: number;
  availableModels: Array<{
    id: string;
    vendor: string;
  }>;
}

// WebSocket message types
export interface WSGetModelsRequest {
  type: 'get_models';
  requestId: string;
}

export interface WSModelsResponse {
  type: 'models_response';
  requestId: string;
  models?: Model[];
}

export interface WSChatRequest {
  type: 'chat_request';
  requestId: string;
  messages: ChatMessage[];
  model: string;
  options?: {
    temperature?: number;
    max_tokens?: number;
  };
}

export interface WSChatResponse {
  type: 'response';
  requestId: string;
  content: string;
}

export interface WSModelsUpdate {
  type: 'models_update';
  models: Model[];
}

export type WSMessage =
  | WSGetModelsRequest
  | WSModelsResponse
  | WSChatRequest
  | WSChatResponse
  | WSModelsUpdate;

export interface PendingRequest {
  resolve: (value: any) => void;
  reject?: (error: Error) => void;
}

// Express app type
import { Express } from 'express';

export const app: Express;
