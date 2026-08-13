export interface ErrorContext {
  timestamp: Date;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface ErrorEvent {
  error: Error;
  context: ErrorContext;
  timestamp: string;
}

export class CustomError extends Error {
  public context: ErrorContext;

  constructor(message: string, context: Partial<ErrorContext> = {}) {
    super(message);
    this.name = 'CustomError';
    this.context = {
      timestamp: new Date(),
      source: context.source || 'unknown',
      severity: context.severity || 'medium',
      metadata: context.metadata || {}
    };
  }
}
