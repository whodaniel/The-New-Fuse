export interface PromptParameter {
  // Implementation needed
}
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    purpose: 'system' | 'user' | 'function' | 'response';
    format?: 'text' | 'json' | 'markdown' | 'code';
}