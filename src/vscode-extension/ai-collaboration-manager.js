"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICollaborationManager = void 0;
const logging_1 = require("./core/logging");
const error_handling_1 = require("./utils/error-handling");
class AICollaborationManager {
    constructor(context, agentClient, lmBridge) {
        this.context = context;
        this.agentClient = agentClient;
        this.lmBridge = lmBridge;
        this.workflows = new Map();
        this.logger = logging_1.Logger.getInstance();
    }
    async startWorkflow(workflow, initialContext) {
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
        }
        catch (error) {
            this.logger.error(`Workflow execution failed: ${(0, error_handling_1.getErrorMessage)(error)}`);
            throw error;
        }
    }
    async executeWorkflowTask(task, context) {
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
        }
        catch (error) {
            this.logger.error(`Task execution failed: ${(0, error_handling_1.getErrorMessage)(error)}`);
            throw error;
        }
    }
    async executeAgentTask(agentId, input) {
        return this.agentClient.sendMessage(agentId, 'executeTask', input);
    }
    async executeLLMGeneration(input) {
        return this.lmBridge.generateText({
            prompt: input.prompt,
            systemPrompt: input.systemPrompt
        });
    }
}
exports.AICollaborationManager = AICollaborationManager;
//# sourceMappingURL=ai-collaboration-manager.js.map