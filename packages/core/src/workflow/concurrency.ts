export interface WorkflowTemplate {
  id: string;
  name: string;
  concurrencyPolicy: 'queue' | 'merge' | 'reject';
  priority?: 'high' | 'normal' | 'low';
}

export interface WorkflowExecutionContext {
  workflowId: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: Date;
}

export class ConcurrencyManager {
  private activeWorkflows = new Map<string, WorkflowExecutionContext>();

  canExecute(template: WorkflowTemplate): boolean {
    const existingExecution = this.activeWorkflows.get(template.id);
    if (!existingExecution) {
      return true;
    }

    switch (template.concurrencyPolicy) {
      case 'queue':
        return false; // Will be queued
      case 'merge':
        return true; // Can merge with existing
      case 'reject':
        return false; // Reject new execution
      default:
        return false;
    }
  }

  startExecution(template: WorkflowTemplate, context: WorkflowExecutionContext): void {
    this.activeWorkflows.set(template.id, context);
  }

  endExecution(templateId: string): void {
    this.activeWorkflows.delete(templateId);
  }

  getActiveExecutions(): WorkflowExecutionContext[] {
    return Array.from(this.activeWorkflows.values());
  }
}

export class ConcurrentExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrentExecutionError';
  }
}

export function createExecutionContext(
  workflowId: string,
  priority: 'high' | 'normal' | 'low' = 'normal'
): WorkflowExecutionContext {
  return {
    workflowId,
    priority,
    timestamp: new Date()
  };
}
