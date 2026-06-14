import type { NewWorkflow, NewWorkflowExecution, NewWorkflowStep, NewWorkflowTemplate, Workflow, WorkflowExecution, WorkflowStep, WorkflowTemplate } from '../types/index.js';
/**
 * Workflow Repository - provides data access for Workflow entities
 */
export declare class DrizzleWorkflowRepository {
    /**
     * Create a new workflow
     */
    createWorkflow(data: NewWorkflow): Promise<Workflow>;
    /**
     * Find workflow by ID
     */
    findWorkflowById(id: string): Promise<Workflow | null>;
    /**
     * Find workflow with steps
     */
    findWorkflowWithSteps(id: string): Promise<(Workflow & {
        steps: WorkflowStep[];
    }) | null>;
    /**
     * Find workflows by creator ID
     */
    findWorkflowsByCreatorId(creatorId: string): Promise<Workflow[]>;
    /**
     * Find active workflows
     */
    /**
     * Find active workflows for a creator
     */
    findActiveWorkflows(creatorId: string): Promise<Workflow[]>;
    /**
     * Find workflows by status
     */
    /**
     * Find workflows by status for a creator
     */
    findWorkflowsByStatus(status: string, creatorId: string): Promise<Workflow[]>;
    /**
     * Find workflows by agent ID
     */
    /**
     * Find workflows by agent ID (must check creator ownership)
     */
    findWorkflowsByAgentId(agentId: string, creatorId: string): Promise<Workflow[]>;
    /**
     * Update workflow
     */
    updateWorkflow(id: string, data: Partial<NewWorkflow>): Promise<Workflow | null>;
    /**
     * Increment workflow execution count
     */
    incrementExecutionCount(id: string): Promise<void>;
    /**
     * Activate workflow
     */
    activateWorkflow(id: string): Promise<Workflow | null>;
    /**
     * Deactivate workflow
     */
    deactivateWorkflow(id: string): Promise<Workflow | null>;
    /**
     * Soft delete workflow
     */
    softDeleteWorkflow(id: string): Promise<boolean>;
    /**
     * Create workflow step
     */
    createStep(data: NewWorkflowStep): Promise<WorkflowStep>;
    /**
     * Find step by ID
     */
    findStepById(id: string): Promise<WorkflowStep | null>;
    /**
     * Find steps by workflow ID
     */
    findStepsByWorkflowId(workflowId: string): Promise<WorkflowStep[]>;
    /**
     * Update step
     */
    updateStep(id: string, data: Partial<NewWorkflowStep>): Promise<WorkflowStep | null>;
    /**
     * Delete step
     */
    deleteStep(id: string): Promise<boolean>;
    /**
     * Reorder steps
     */
    reorderSteps(workflowId: string, stepIds: string[]): Promise<void>;
    /**
     * Create workflow execution
     */
    createExecution(data: NewWorkflowExecution): Promise<WorkflowExecution>;
    /**
     * Find execution by ID
     */
    findExecutionById(id: string): Promise<WorkflowExecution | null>;
    /**
     * Find executions by workflow ID
     */
    findExecutionsByWorkflowId(workflowId: string, limit?: number): Promise<WorkflowExecution[]>;
    /**
     * Find executions by status
     */
    findExecutionsByStatus(status: string, limit?: number): Promise<WorkflowExecution[]>;
    /**
     * Update execution
     */
    updateExecution(id: string, data: Partial<NewWorkflowExecution>): Promise<WorkflowExecution | null>;
    /**
     * Complete execution
     */
    completeExecution(id: string, output: any): Promise<WorkflowExecution | null>;
    /**
     * Fail execution
     */
    failExecution(id: string, error: string): Promise<WorkflowExecution | null>;
    /**
     * Create workflow template
     */
    createTemplate(data: NewWorkflowTemplate): Promise<WorkflowTemplate>;
    /**
     * Find template by ID
     */
    findTemplateById(id: string): Promise<WorkflowTemplate | null>;
    /**
     * Find public templates
     */
    findPublicTemplates(category?: string, limit?: number): Promise<WorkflowTemplate[]>;
    /**
     * Find templates by creator
     */
    findTemplatesByCreatorId(creatorId: string): Promise<WorkflowTemplate[]>;
    /**
     * Increment template usage count
     */
    incrementTemplateUsage(id: string): Promise<void>;
    /**
     * Update template
     */
    updateTemplate(id: string, data: Partial<NewWorkflowTemplate>): Promise<WorkflowTemplate | null>;
    /**
     * Delete template
     */
    deleteTemplate(id: string): Promise<boolean>;
    /**
     * Count executions by status for a workflow
     */
    countExecutionsByStatus(workflowId: string): Promise<{
        status: string;
        count: number;
    }[]>;
    /**
     * Count total workflows
     */
    count(): Promise<number>;
}
export declare const drizzleWorkflowRepository: DrizzleWorkflowRepository;
//# sourceMappingURL=workflow.repository.d.ts.map