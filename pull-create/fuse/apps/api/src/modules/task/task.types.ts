export type TaskExecutionLogLevel = 'info' | 'warn' | 'error';

export type TaskExecutionLogPayload = {
  level: TaskExecutionLogLevel;
  message: string;
  actor: string;
  source: string;
  stage?: string;
  metadata?: Record<string, unknown>;
};

export type TaskExecutionLogEntry = TaskExecutionLogPayload & {
  id: string;
  timestamp: string;
};
