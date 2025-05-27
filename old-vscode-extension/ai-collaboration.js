"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICollaborationManager = void 0;
class AICollaborationManager {
    constructor(context, agentClient, lmBridge) {
        this.context = context;
        this.agentClient = agentClient;
        this.lmBridge = lmBridge;
        this.workflows = new Map();
    }
    async startWorkflow(workflow, initialContext) {
        try {
            const workflowId = `workflow-${Date.now()}`;
            workflow.id = workflowId;
            this.workflows.set(workflowId, workflow);
            // Execute workflow steps
            for (const step of workflow.steps) {
                const result = await this.executeWorkflowStep(step, initialContext);
                step.output = result;
            }
            return { workflowId, success: true };
        }
        catch (error) {
            throw new Error(`Workflow execution failed: ${error.message}`);
        }
    }
    async executeWorkflowStep(step, context) {
        switch (step.type) {
            case 'agent-task':
                if (!step.agentId) {
                    throw new Error('Agent ID required for agent-task step');
                }
                return this.executeAgentTask(step.agentId, step.input);
            case 'llm-generation':
                return this.executeLLMGeneration(step.input);
            default:
                throw new Error(`Unknown step type: ${step.type}`);
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
//# sourceMappingURL=ai-collaboration.js.map