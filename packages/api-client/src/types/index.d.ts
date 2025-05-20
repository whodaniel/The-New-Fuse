// Type definitions for @the-new-fuse/api-client
declare module '@the-new-fuse/api-client' {
  export * from './core/ApiClient.js';
  export * from './config/ApiConfig.js';
  export * from './services/auth.service.js';
  export * from './services/workflow.service.js';
  export * from './services/agent.service.js';
  export * from './services/user.service.js';
  export * from './integrations/index.js';
}

export interface ApiError {
  message: string;
  code: number;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = {
  data: T;
  error?: ApiError;
};