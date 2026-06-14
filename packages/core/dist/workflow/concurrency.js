export class ConcurrencyManager {
    constructor() {
        this.activeWorkflows = new Map();
    }
    canExecute(template) {
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
    startExecution(template, context) {
        this.activeWorkflows.set(template.id, context);
    }
    endExecution(templateId) {
        this.activeWorkflows.delete(templateId);
    }
    getActiveExecutions() {
        return Array.from(this.activeWorkflows.values());
    }
}
export class ConcurrentExecutionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConcurrentExecutionError';
    }
}
export function createExecutionContext(workflowId, priority = 'normal') {
    return {
        workflowId,
        priority,
        timestamp: new Date()
    };
}
//# sourceMappingURL=concurrency.js.map