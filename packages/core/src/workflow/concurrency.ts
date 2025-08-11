export interface WorkflowTemplate {
  // Implementation needed
}
  id: string;
  name: string;
  concurrencyPolicy: 'queue' | 'merge' | 'reject';
  priority?: 'high' | 'normal' | 'low';
}

export interface WorkflowExecutionContext {
  // Implementation needed
}
  workflowId: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: Date;
}

export class ConcurrencyManager {
  // Implementation needed
}
  private activeWorkflows = new Map<string, WorkflowExecutionContext>();
  canExecute(template: WorkflowTemplate, context: WorkflowExecutionContext): boolean {
  // Implementation needed
}
    const existingExecution = this.activeWorkflows.get(template.id);
    if (!existingExecution) {
  // Implementation needed
}
      return true;
    }
    
    switch (template.concurrencyPolicy) {
  // Implementation needed
}
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
  // Implementation needed
}
    this.activeWorkflows.set(template.id, context);
  }
  
  endExecution(templateId: string): void {
  // Implementation needed
}
    this.activeWorkflows.delete(templateId);
  }
  
  getActiveExecutions(): WorkflowExecutionContext[] {
  // Implementation needed
}
    return Array.from(this.activeWorkflows.values());
  }
}

export class ConcurrentExecutionError extends Error {
  // Implementation needed
}
  constructor(message: string = 'Concurrent execution not allowed') {
  // Implementation needed
}
    super(message);
    this.name = 'ConcurrentExecutionError';
  }
}

export function createExecutionContext(
  workflowId: string,
  priority: 'high' | 'normal' | 'low' = 'normal'
): WorkflowExecutionContext {
  // Implementation needed
}
  return {
  // Implementation needed
}
    workflowId,
    priority,
    timestamp: new Date()
  };
}