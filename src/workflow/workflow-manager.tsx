import { EventEmitter } from 'events';

export interface WorkflowVersion {
    version: number;
    timestamp: number;
    steps: WorkflowStep[];
    metadata: Record<string, unknown>;
}

export interface WorkflowStep {
    id: string;
    type: string;
    config: Record<string, unknown>;
    dependencies: string[];
}

export class WorkflowManager extends EventEmitter {
    private workflows: Map<string, WorkflowVersion[]> = new Map();

    public createVersion(workflowId: string, steps: WorkflowStep[]): WorkflowVersion {
        const versions = this.workflows.get(workflowId) || [];
        const newVersion: WorkflowVersion = {
            version: versions.length + 1,
            timestamp: Date.now(),
            steps,
            metadata: {}
        };

        versions.push(newVersion);
        this.workflows.set(workflowId, versions);
        this.emit('versionCreated', workflowId, newVersion);

        return newVersion;
    }

    public validateWorkflow(workflow: WorkflowVersion): string[] {
        const errors: string[] = [];
        const stepIds = new Set(workflow.steps.map(s => s.id));

        // Validate steps and dependencies
        workflow.steps.forEach(step => {
            if (!step.type) {
                errors.push(`Step ${step.id} missing type`);
            }
            step.dependencies.forEach(depId => {
                if (!stepIds.has(depId)) {
                    errors.push(`Step ${step.id} has invalid dependency: ${depId}`);
                }
            });
        });

        return errors;
    }
}
