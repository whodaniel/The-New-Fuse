// Core interfaces for the Fuse framework

export interface IAgent {
  // Implementation needed
}
  id: string;
  name: string;
  capabilities: string[];
  processMessage(message: string): Promise<string>;
}

export interface IMessage {
  // Implementation needed
}
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  type: 'user' | 'agent' | 'system';
}

export interface IPromptTemplate {
  // Implementation needed
}
  id: string;
  name: string;
  template: string;
  variables: string[];
}

export interface IMemoryStore {
  // Implementation needed
}
  store(key: string, value: unknown, ttl?: number): Promise<void>;
  get(key: string): Promise<unknown>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface ILLMProvider {
  // Implementation needed
}
  name: string;
  model: string;
  generateResponse(prompt: string, options?: any): Promise<string>;
}

export interface IAgentConfiguration {
  // Implementation needed
}
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  capabilities: string[];
  settings: Record<string, any>;
}

export interface ITaskResult {
  // Implementation needed
}
  success: boolean;
  result?: any;
  error?: string;
  duration?: number;
}

export interface IServiceHealth {
  // Implementation needed
}
  healthy: boolean;
  message?: string;
  timestamp: Date;
}