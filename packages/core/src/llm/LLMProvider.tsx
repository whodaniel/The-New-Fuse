// Copyright (c) The New Fuse Project

import { Logger } from '@the-new-fuse/utils';
import { EventEmitter } from 'events';

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  apiKey?: string;
  apiEndpoint?: string;
  apiVersion?: string;
  organization?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export interface LLMContext {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
    name?: string;
  }>;
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface StreamChunk {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export abstract class BaseLLMProvider extends EventEmitter {
  protected logger: Logger;
  protected config: LLMConfig;
  protected isInitialized: boolean = false;

  constructor(config: LLMConfig) {
    super();
    this.config = config;
    this.logger = new Logger(this.constructor.name);
  }

  abstract generate(context: LLMContext): Promise<LLMResponse>;
  abstract stream(context: LLMContext): AsyncGenerator<StreamChunk, void, unknown>;
  abstract checkSetup(): Promise<boolean>;
}
