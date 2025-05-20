export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly workflowId?: string,
    public readonly stepId?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkflowError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkflowError);
    }
  }
}
