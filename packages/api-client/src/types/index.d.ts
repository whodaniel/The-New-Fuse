// Type definitions for @the-new-fuse/api-client
declare module '@the-new-fuse/api-client' {
  export * from './core/ApiClient';
  export * from './config/ApiConfig';
  export * from './services/auth.service';
  export * from './services/workflow.service';
  export * from './services/agent.service';
  export * from './services/user.service';
  export * from './integrations/index';
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