export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  PROMISE_REJECTION = 'promise_rejection',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  UNKNOWN = 'unknown'
}

export enum ErrorPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorMetadata {
  timestamp: number;
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  [key: string]: any;
}