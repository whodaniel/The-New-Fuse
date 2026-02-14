export class AgentAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentAssignmentError';
  }
}

export class WorkflowValidationError extends Error {
  constructor(
    message: string,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'WorkflowValidationError';
  }
}
