"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JulesAgentAdapter = void 0;
const types_1 = require("@the-new-fuse/types");
const uuid_1 = require("uuid");
const JulesApiClient_js_1 = require("./JulesApiClient.js");
const utils_js_1 = require("./utils.js");
const TNF_WEBHOOK_BASE_URL = process.env.TNF_WEBHOOK_BASE_URL || 'https://app.thenewfuse.com/api/webhooks/incoming/jules';
class JulesAgentAdapter {
    constructor(agentRegistry, agentRepo, taskRepo, redisService // Redis can be used for other things, like distributed locks
    ) {
        this.agentRegistry = agentRegistry;
        this.agentRepo = agentRepo;
        this.taskRepo = taskRepo;
        this.redisService = redisService;
    }
    /**
     * Registers or retrieves the Jules agent for a given tenant.
     * @param tenantId The ID of the tenant.
     * @returns The registered agent from the database.
     */
    async registerJulesAgent(tenantId) {
        const agentId = `jules-agent-${tenantId}`;
        let agent = await this.agentRepo.findById(agentId, tenantId);
        if (!agent) {
            const agentData = {
                id: agentId,
                name: 'Jules Assistant',
                type: types_1.AgentType.GITHUB_JULES,
                status: types_1.AgentStatus.IDLE,
                userId: tenantId, // Assuming tenantId can map to a userId
                description: 'An AI agent powered by Google Jules for code implementation and GitHub management.',
                capabilities: [
                    'code_implementation',
                    'github_operations',
                    'pr_management',
                    'bug_fixing',
                    'code_review',
                ],
                config: {
                    platform: 'jules',
                    version: '1.0.0',
                    tenantId,
                    julesIntegration: true,
                },
            };
            agent = await this.agentRepo.create(agentData);
        }
        // Also register in the Redis registry for discovery
        const agentMetadata = {
            id: agent.id,
            name: agent.name,
            status: 'online', // Redis registry uses 'online'/'offline'
            platform: 'jules',
            capabilities: agent.capabilities.map((c) => ({ name: c })),
            metadata: {
                version: '1.0.0',
                tenantId,
            },
        };
        await this.agentRegistry.register(agentMetadata);
        return agent;
    }
    /**
     * Delegates a task to the Jules agent.
     * @param params Parameters for the task delegation.
     * @returns The created task ID and the Jules session ID.
     */
    async delegateTask(params) {
        const { tenantId, taskDescription, repo, conversationId, requireApproval } = params;
        // 1. Get API key and create Jules API client
        const apiKey = await this.getApiKey(tenantId);
        const julesApiClient = new JulesApiClient_js_1.JulesApiClient(apiKey);
        // 2. Ensure Jules agent is registered for the tenant
        const julesAgent = await this.registerJulesAgent(tenantId);
        // 3. Create a new task in the TNF database
        const newTask = {
            id: (0, uuid_1.v4)(),
            title: 'Jules Task: ' + taskDescription.substring(0, 50),
            description: taskDescription,
            type: 'jules_task',
            status: types_1.TaskStatus.PENDING,
            userId: tenantId,
            assignedToId: julesAgent.id,
            data: {
                repo,
                conversationId,
            },
        };
        const createdTask = await this.taskRepo.createTask(newTask);
        const taskId = createdTask.id;
        // 4. Build the webhook URL
        const webhookUrl = this.buildWebhookUrl(tenantId, taskId, conversationId);
        // 5. Call Jules API to create a session
        const { sessionId: julesSessionId } = await julesApiClient.createSession({
            repo,
            task: taskDescription,
            requirePlanApproval: requireApproval,
            webhookUrl,
        });
        // 6. Link task to Jules session (using metadata field for now)
        await this.taskRepo.updateTask(taskId, {
            metadata: {
                ...(createdTask.metadata || {}),
                julesSessionId,
            },
            status: types_1.TaskStatus.IN_PROGRESS,
        });
        // 7. Update agent status to BUSY
        await this.updateAgentStatus(tenantId, types_1.AgentStatus.BUSY);
        return { taskId, julesSessionId };
    }
    /**
     * Updates the status of the Jules agent.
     * @param tenantId The ID of the tenant whose agent to update.
     * @param status The new status for the agent.
     */
    async updateAgentStatus(tenantId, status) {
        const agentId = `jules-agent-${tenantId}`;
        // Update in database
        await this.agentRepo.updateStatus(agentId, status);
        // Update in Redis registry
        const agent = await this.agentRepo.findById(agentId, tenantId);
        if (agent) {
            const agentMetadata = {
                id: agent.id,
                name: agent.name,
                // Map DB status to a valid Redis registry status
                status: status === types_1.AgentStatus.BUSY ? 'busy' : 'online',
                platform: 'jules',
                capabilities: agent.capabilities.map((c) => ({ name: c })),
                metadata: {
                    version: '1.0.0',
                    tenantId,
                },
            };
            await this.agentRegistry.register(agentMetadata);
        }
    }
    /**
     * Retrieves the Jules API key for a given tenant.
     * This method should be implemented to securely fetch the tenant's key.
     * It falls back to a platform-wide key if no tenant-specific key is found.
     * @param tenantId The ID of the tenant.
     * @returns The Jules API key.
     */
    async getApiKey(tenantId) {
        // TODO: Implement secure fetching of tenant-specific API keys
        // For now, we'll use a placeholder and fall back to the platform key.
        const tenantApiKey = null; // e.g., await keyVault.get(`jules-api-key-${tenantId}`);
        if (tenantApiKey) {
            return tenantApiKey;
        }
        if (process.env.PLATFORM_JULES_API_KEY) {
            return process.env.PLATFORM_JULES_API_KEY;
        }
        throw new Error('Jules API key is not configured for the tenant or the platform.');
    }
    /**
     * Builds the webhook URL for Jules to send session updates.
     * @param tenantId The ID of the tenant.
     * @param taskId The ID of the TNF task.
     * @param conversationId Optional conversation ID.
     * @returns The fully formed webhook URL.
     */
    buildWebhookUrl(tenantId, taskId, conversationId) {
        const context = {
            tenantId,
            taskId,
            conversationId,
        };
        const encodedContext = (0, utils_js_1.toBase64Url)(JSON.stringify(context));
        return `${TNF_WEBHOOK_BASE_URL}/${encodedContext}`;
    }
}
exports.JulesAgentAdapter = JulesAgentAdapter;
