import * as vscode from 'vscode';
import { LMAPIBridge } from './lm-api-bridge.js';
import { AgentClient } from './agent-communication.js';
import { getLogger,  Logger  } from './src/core/logging.js';
import { getErrorMessage } from './utils/error-handling.js';

export interface AICollaborationWorkflow {
    id: string;
    type: string;
    tasks: WorkflowTask[];
    context?: Record<string, any>;
}

interface WorkflowTask {
    id: string;
    type: string;
    agentId?: string;
    input?: any;
    output?: any;
}

export class AICollaborationManager {
    private logger: Logger;
    private workflows: Map<string, AICollaborationWorkflow> = new Map();

    constructor(
        private context: vscode.ExtensionContext,
        private agentClient: AgentClient,
        private lmBridge: LMAPIBridge
    ) {
        this.logger = getLogger();
    }

    async startWorkflow(workflow: AICollaborationWorkflow, initialContext?: Record<string, any>): Promise<{ workflowId: string; success: boolean }> {
        try {
            const workflowId = workflow.id || `workflow-${Date.now()}`;
            workflow.id = workflowId;
            this.workflows.set(workflowId, workflow);

            // Execute workflow tasks
            for (const task of workflow.tasks) {
                const result = await this.executeWorkflowTask(task, initialContext);
                task.output = result;
            }

            return { workflowId, success: true };
        } catch (error) {
            this.logger.error(`Workflow execution failed: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    private async executeWorkflowTask(task: WorkflowTask, _context?: Record<string, any>): Promise<any> {
        try {
            this.logger.info(`Executing task: ${task.id} (${task.type})`);

            switch (task.type) {
                case 'agent-task':
                    if (!task.agentId) {
                        throw new Error('Agent ID required for agent-task');
                    }
                    return this.executeAgentTask(task.agentId, task.input);

                case 'llm-generation':
                    return this.executeLLMGeneration(task.input);

                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
        } catch (error) {
            this.logger.error(`Task execution failed: ${getErrorMessage(error)}`);
            throw error;
        }
    }

    private async executeAgentTask(agentId: string, input: any): Promise<any> {
        return this.agentClient.sendMessage({
            recipient: agentId,
            type: 'agent-command', // Example type, adjust as needed
            action: 'executeTask',
            payload: input,
            source: 'ai-collaboration-manager' // Identifier for the sender
        });
    }

    private async executeLLMGeneration(input: any): Promise<any> {
        return this.lmBridge.generate({
            prompt: input.prompt,
            systemPrompt: input.systemPrompt
        });
    }
}