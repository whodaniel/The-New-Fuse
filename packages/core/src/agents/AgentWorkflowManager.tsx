import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { AgentCommunicationBridge } from './AgentCommunicationBridge.js';
import { GDesignerService } from '../integrations/GDesignerService.js';
import { MetricsProcessor } from '../security/metricsProcessor.js';

const logger: Logger = getLogger('agent_workflow');

export interface WorkflowConfig {
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryStrategy: {
        maxAttempts: number;
        backoffMultiplier: number;
        initialDelay: number;
    };
}

export interface AgentWorkflow {
    id: string;
    name: string;
    description: string;
    tasks: WorkflowTask[];
    metadata: Record<string, unknown>;
}

export interface WorkflowTask {
    id: string;
    type: string;
    parameters: Record<string, unknown>;
    dependencies?: string[];
    timeout?: number;
}

export interface WorkflowState {
    workflow: AgentWorkflow;
    status: string;
    startTime: number;
    completedTasks: number;
}

export class AgentWorkflowManager {
    private readonly communicationBridge: AgentCommunicationBridge;
    private readonly gdesignerService: GDesignerService;
    private readonly metricsProcessor: MetricsProcessor;
    private activeWorkflows: Map<string, WorkflowState>;

    constructor(
        private config: WorkflowConfig,
        communicationBridge: AgentCommunicationBridge,
        gdesignerService: GDesignerService,
        metricsProcessor: MetricsProcessor
    ) {
        this.communicationBridge = communicationBridge;
        this.gdesignerService = gdesignerService;
        this.metricsProcessor = metricsProcessor;
        this.activeWorkflows = new Map();
    }

    async startWorkflow(workflow: AgentWorkflow): Promise<void> {
        const workflowId = workflow.id;
        logger.info(`Starting workflow ${workflowId}`);

        try {
            await this.validateWorkflow(workflow);
            const enrichedWorkflow = await this.enrichWorkflow(workflow);

            this.activeWorkflows.set(workflowId, {
                workflow: enrichedWorkflow,
                status: 'running',
                startTime: Date.now(),
                completedTasks: 0
            });

            await this.executeWorkflowTasks(enrichedWorkflow);

            await this.metricsProcessor.processWorkflowMetrics({
                workflowId,
                type: 'workflow_started',
                timestamp: Date.now()
            });
        } catch (error) {
            logger.error(`Failed to start workflow ${workflowId}:`, error);
            await this.handleWorkflowError(workflow, error);
            throw error;
        }
    }

    private async executeWorkflowTasks(workflow: AgentWorkflow): Promise<void> {
        const tasks = await this.prepareTasks(workflow);
        const taskGroups = this.groupTasksByDependency(tasks);

        for (const taskGroup of taskGroups) {
            await Promise.all(
                taskGroup.map(task => this.executeTask(task, workflow.id))
            );
        }
    }

    private async executeTask(task: WorkflowTask, workflowId: string): Promise<void> {
        let attempts = 0;
        let delay = this.config.retryStrategy.initialDelay;

        while (attempts < this.config.retryStrategy.maxAttempts) {
            try {
                // Convert WorkflowTask to GDesignerTask
                const gdesignerTask = {
                    id: task.id,
                    type: task.type,
                    parameters: task.parameters,
                    priority: 'medium',
                    context: {
                        workflowId: workflowId,
                        attempt: attempts + 1
                    }
                };

                await this.gdesignerService.processTask(gdesignerTask);
                return;
            } catch (error) {
                attempts++;
                if (attempts < this.config.retryStrategy.maxAttempts) {
                    await this.delay(delay);
                    delay *= this.config.retryStrategy.backoffMultiplier;
                } else {
                    throw error;
                }
            }
        }
    }

    private groupTasksByDependency(tasks: WorkflowTask[]): WorkflowTask[][] {
        // Implementation of topological sort for task dependencies
        const groups: WorkflowTask[][] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (task: WorkflowTask, group: WorkflowTask[]): any => {
            if (visiting.has(task.id)) {
                throw new Error('Circular dependency detected');
            }
            if (visited.has(task.id)) {
                return;
            }

            visiting.add(task.id);
            for (const depId of task.dependencies || []) {
                const depTask = tasks.find(t => t.id === depId);
                if (depTask) {
                    visit(depTask, group);
                }
            }
            visiting.delete(task.id);
            visited.add(task.id);
            group.push(task);
        };

        const remainingTasks = [...tasks];
        while (remainingTasks.length > 0) {
            const group: WorkflowTask[] = [];
            visit(remainingTasks[0], group);
            groups.push(group);
            remainingTasks.splice(0, group.length);
        }

        return groups;
    }

    private async validateWorkflow(workflow: AgentWorkflow): Promise<void> {
        // Validate workflow structure and task dependencies
        if (!workflow.id || !workflow.tasks || !Array.isArray(workflow.tasks)) {
            throw new Error('Invalid workflow structure');
        }

        // Check for duplicate task IDs
        const taskIds = new Set<string>();
        for (const task of workflow.tasks) {
            if (taskIds.has(task.id)) {
                throw new Error(`Duplicate task ID: ${task.id}`);
            }
            taskIds.add(task.id);
        }

        // Validate task dependencies
        for (const task of workflow.tasks) {
            if (task.dependencies) {
                for (const depId of task.dependencies) {
                    if (!taskIds.has(depId)) {
                        throw new Error(`Task ${task.id} depends on non-existent task ${depId}`);
                    }
                }
            }
        }
    }

    private async enrichWorkflow(workflow: AgentWorkflow): Promise<AgentWorkflow> {
        // Add additional metadata or context to the workflow
        return {
            ...workflow,
            metadata: {
                ...workflow.metadata,
                enrichedAt: Date.now(),
                enrichedBy: 'AgentWorkflowManager'
            }
        };
    }

    private async handleWorkflowError(workflow: AgentWorkflow, error: Error): Promise<void> {
        logger.error(`Workflow ${workflow.id} failed:`, error);

        // Update workflow state
        this.activeWorkflows.set(workflow.id, {
            workflow,
            status: 'failed',
            startTime: Date.now(),
            completedTasks: 0
        });

        // Record metrics
        await this.metricsProcessor.processWorkflowMetrics({
            workflowId: workflow.id,
            type: 'workflow_failed',
            timestamp: Date.now(),
            error: error.message
        });
    }

    private async prepareTasks(workflow: AgentWorkflow): Promise<WorkflowTask[]> {
        // Prepare tasks for execution, adding default values or context
        return workflow.tasks.map(task => ({
            ...task,
            timeout: task.timeout || this.config.taskTimeout
        }));
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}