const logger = new Logger('WorkflowManager');
export class WorkflowManager {
    constructor(commBus) {
        this.workflows = new Map();
        this.templates = new Map();
        this.commBus = commBus;
    }
    async createWorkflow(templateName, parameters) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }
        const workflowId = this.generateWorkflowId();
        const status = {
            id: workflowId,
            templateName,
            status: 'pending',
            progress: 0,
            startTime: new Date().toISOString(),
            metadata: {
                parameters,
                template: template.name
            }
        };
        this.workflows.set(workflowId, status);
        try {
            await this.startWorkflow(workflowId, template, parameters);
            return workflowId;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to start workflow ${workflowId}: ${errorMessage}`);
            status.status = 'failed';
            status.error = errorMessage;
            status.endTime = new Date().toISOString();
            throw error;
        }
    }
    async cancelWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        if (workflow.status === 'completed' || workflow.status === 'failed') {
            return false;
        }
        workflow.status = 'cancelled';
        workflow.endTime = new Date().toISOString();
        const event = {
            workflowId,
            timestamp: workflow.endTime
        };
        await this.commBus.publish('workflow.cancelled', event);
        return true;
    }
    getWorkflowStatus(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        return Object.assign({}, workflow);
    }
    registerTemplate(template) {
        this.templates.set(template.name, template);
    }
    generateWorkflowId() {
        return `wf_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    }
    async startWorkflow(workflowId, template, parameters) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        workflow.status = 'running';
        try {
            for (const step of template.steps) {
                workflow.currentStep = step.name;
                await this.executeStep(step, parameters);
                workflow.progress = (template.steps.indexOf(step) + 1) / template.steps.length * 100;
            }
            workflow.status = 'completed';
            workflow.endTime = new Date().toISOString();
            const completedEvent = {
                workflowId,
                timestamp: workflow.endTime
            };
            await this.commBus.publish('workflow.completed', completedEvent);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            workflow.status = 'failed';
            workflow.error = errorMessage;
            workflow.endTime = new Date().toISOString();
            const failedEvent = {
                workflowId,
                error: errorMessage,
                timestamp: workflow.endTime
            };
            await this.commBus.publish('workflow.failed', failedEvent);
            throw error;
        }
    }
    async executeStep(step, parameters) {
        const execute = async (attempt) => {
            try {
                const startEvent = {
                    step: step.name,
                    attempt,
                    parameters
                };
                await this.commBus.publish('workflow.step.started', startEvent);
                await new Promise(resolve => setTimeout(resolve, 1000));
                const completeEvent = {
                    step: step.name,
                    attempt
                };
                await this.commBus.publish('workflow.step.completed', completeEvent);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const failEvent = {
                    step: step.name,
                    attempt,
                    error: errorMessage
                };
                await this.commBus.publish('workflow.step.failed', failEvent);
                if (step.retryPolicy && attempt < step.retryPolicy.maxAttempts) {
                    const delay = step.retryPolicy.initialDelay *
                        Math.pow(step.retryPolicy.backoffMultiplier, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return execute(attempt + 1);
                }
                throw error;
            }
        };
        await execute(1);
    }
}
//# sourceMappingURL=workflow_manager.js.map