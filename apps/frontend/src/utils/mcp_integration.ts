export {}
exports.MCPWorkflowAdapter = void 0;
import logger_1 from './logger.js';
import messages_1 from './messages.js';
import output_formatter_1 from './output_formatter.js';
import workflow_manager_1 from './workflow_manager.js';
import enhanced_communication_1 from './enhanced_communication.js';
const logger = new logger_1.Logger('MCPWorkflowAdapter');
class MCPWorkflowAdapter {
    constructor() {
        this.commBus = new enhanced_communication_1.EnhancedCommunicationBus();
        this.workflowManager = new workflow_manager_1.WorkflowManager(this.commBus);
        this.messageThread = new messages_1.MessageThread();
        this.outputFormatter = new output_formatter_1.OutputFormatter();
        this.activeAgents = new Map();
        this.tools = new Map();
        this.registerMcpTools();
    }
    registerMcpTools() {
        const createWorkflowTool = (0, messages_1.createTool)({
            name: "create_workflow",
            description: "Create a new workflow from a template",
            properties: {
                template_name: {
                    type: "string",
                    description: "Name of the workflow template to use"
                },
                parameters: {
                    type: "object",
                    description: "Parameters for the workflow"
                }
            },
            required: ["template_name"]
        });
        const cancelWorkflowTool = (0, messages_1.createTool)({
            name: "cancel_workflow",
            description: "Cancel a running workflow",
            properties: {
                workflow_id: {
                    type: "string",
                    description: "ID of the workflow to cancel"
                }
            },
            required: ["workflow_id"]
        });
        const getStatusTool = (0, messages_1.createTool)({
            name: "get_workflow_status",
            description: "Get the current status of a workflow",
            properties: {
                workflow_id: {
                    type: "string",
                    description: "ID of the workflow to check"
                }
            },
            required: ["workflow_id"]
        });
        this.tools.set("create_workflow", createWorkflowTool);
        this.tools.set("cancel_workflow", cancelWorkflowTool);
        this.tools.set("get_workflow_status", getStatusTool);
    }
    async registerAgent(agent) {
        this.activeAgents.set(agent.name, agent);
        await agent.start();
        for (const capability of agent.capabilities) {
            const tool = (0, messages_1.createTool)({
                name: `use_${capability}`,
                description: `Use the ${capability} capability`,
                properties: {
                    parameters: {
                        type: "object",
                        description: `Parameters for ${capability}`
                    }
                }
            });
            this.tools.set(`use_${capability}`, tool);
        }
    }
    async handleToolUse(toolUse) {
        const toolName = toolUse.name;
        const toolInput = toolUse.input;
        try {
            if (toolName === "create_workflow") {
                const workflowId = await this.workflowManager.createWorkflow(toolInput.template_name, toolInput.parameters || {});
                return {
                    tool_use_id: toolUse.id,
                    content: this.outputFormatter.formatJson({
                        workflow_id: workflowId,
                        status: "created"
                    })
                };
            }
            if (toolName === "cancel_workflow") {
                const success = await this.workflowManager.cancelWorkflow(toolInput.workflow_id);
                return {
                    tool_use_id: toolUse.id,
                    content: this.outputFormatter.formatJson({
                        success
                    })
                };
            }
            if (toolName === "get_workflow_status") {
                const status = this.workflowManager.getWorkflowStatus(toolInput.workflow_id);
                return {
                    tool_use_id: toolUse.id,
                    content: this.outputFormatter.formatJson(status)
                };
            }
            if (toolName.startsWith("use_")) {
                const capability = toolName.slice(4);
                const agent = Array.from(this.activeAgents.values())
                    .find(a => a.capabilities.includes(capability));
                if (agent) {
                    const result = await agent.executeTask(capability, toolInput.parameters || {});
                    return {
                        tool_use_id: toolUse.id,
                        content: this.outputFormatter.formatJson(result)
                    };
                }
                else {
                    throw new Error(`No agent found with capability: ${capability}`);
                }
            }
            throw new Error(`Unknown tool: ${toolName}`);
        }
        catch (error) {
            logger.error(`Error handling tool use: ${error.message}`);
            return {
                tool_use_id: toolUse.id,
                content: this.outputFormatter.formatJson({
                    error: error.message
                })
            };
        }
    }
    async processMessage(message) {
        this.messageThread.addUserMessage({ text: message });
        const builder = new messages_1.MessageBuilder();
        const response = await this.generateResponse(message);
        this.messageThread.addAssistantMessage({
            text: response.text,
            toolUses: response.toolUses || []
        });
        return response.text || "";
    }
    async generateResponse(message) {
        return {
            text: "I understand your request. Let me help you with that.",
            toolUses: []
        };
    }
    async cleanup() {
        await Promise.all(Array.from(this.activeAgents.values())
            .map(agent => agent.stop()));
    }
}
exports.MCPWorkflowAdapter = MCPWorkflowAdapter;
export {};
//# sourceMappingURL=mcp_integration.js.map