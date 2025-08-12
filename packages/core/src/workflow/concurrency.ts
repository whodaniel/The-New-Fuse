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
  canExecute(): unknown {
    const existingExecution = this.activeWorkflows.get(template.id);
    if(): unknown {
      return true;
    }
    
    switch(): unknown {
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
  
  startExecution(): unknown {
    this.activeWorkflows.set(template.id, context);
  }
  
  endExecution(): unknown {
    this.activeWorkflows.delete(templateId);
  }
  
  getActiveExecutions(): unknown {
    return Array.from(this.activeWorkflows.values());
  }
}

export class ConcurrentExecutionError {
  constructor(): unknown {
    super(): unknown {
  return {
  // Implementation needed
}
    workflowId,
    priority,
    timestamp: new Date()
  };
}