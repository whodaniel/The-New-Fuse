import { AgentMetadata, RedisAgentRegistry } from '@the-new-fuse/agent';
import { DrizzleAgentRepository, DrizzleTaskRepository } from '@the-new-fuse/database';
import { AgentStatus, AgentType, TaskStatus } from '@the-new-fuse/types';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { JulesApiClient } from './JulesApiClient';
import { toBase64Url } from './utils';

const TNF_WEBHOOK_BASE_URL =
  process.env.TNF_WEBHOOK_BASE_URL || 'https://app.thenewfuse.com/api/webhooks/incoming/jules';

export class JulesAgentAdapter {
  constructor(
    private agentRegistry: RedisAgentRegistry,
    private agentRepo: InstanceType<typeof DrizzleAgentRepository>,
    private taskRepo: InstanceType<typeof DrizzleTaskRepository>,
    private redis: Redis // Redis can be used for other things, like distributed locks
  ) {}

  /**
   * Registers or retrieves the Jules agent for a given tenant.
   * @param tenantId The ID of the tenant.
   * @returns The registered agent from the database.
   */
  async registerJulesAgent(tenantId: string): Promise<any> {
    const agentId = `jules-agent-${tenantId}`;

    let agent = await this.agentRepo.findById(agentId, tenantId);

    if (!agent) {
      const agentData = {
        id: agentId,
        name: 'Jules Assistant',
        type: AgentType.GITHUB_JULES,
        status: AgentStatus.IDLE,
        userId: tenantId, // Assuming tenantId can map to a userId
        description:
          'An AI agent powered by Google Jules for code implementation and GitHub management.',
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

      agent = await this.agentRepo.create(agentData as any);
    }

    // Also register in the Redis registry for discovery
    const agentMetadata: Omit<AgentMetadata, 'lastSeen'> = {
      id: agent.id,
      name: agent.name,
      status: 'online', // Redis registry uses 'online'/'offline'
      platform: 'jules',
      capabilities: (agent.capabilities as string[]).map((c) => ({ name: c })),
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
  async delegateTask(params: {
    tenantId: string;
    taskDescription: string;
    repo: string;
    conversationId?: string;
    delegatedByAgentId?: string;
    requireApproval?: boolean;
  }): Promise<{ taskId: string; julesSessionId: string }> {
    const { tenantId, taskDescription, repo, conversationId, requireApproval } = params;

    // 1. Get API key and create Jules API client
    const apiKey = await this.getApiKey(tenantId);
    const julesApiClient = new JulesApiClient(apiKey);

    // 2. Ensure Jules agent is registered for the tenant
    const julesAgent = await this.registerJulesAgent(tenantId);

    // 3. Create a new task in the TNF database
    const newTask = {
      id: uuidv4(),
      title: 'Jules Task: ' + taskDescription.substring(0, 50),
      description: taskDescription,
      type: 'jules_task',
      status: TaskStatus.PENDING,
      userId: tenantId,
      assignedToId: julesAgent.id,
      data: {
        repo,
        conversationId,
      },
    };
    const createdTask = await this.taskRepo.createTask(newTask as any);
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
        ...((createdTask.metadata as object) || {}),
        julesSessionId,
      },
      status: TaskStatus.IN_PROGRESS,
    });

    // 7. Update agent status to BUSY
    await this.updateAgentStatus(tenantId, AgentStatus.BUSY);

    return { taskId, julesSessionId };
  }

  /**
   * Updates the status of the Jules agent.
   * @param tenantId The ID of the tenant whose agent to update.
   * @param status The new status for the agent.
   */
  async updateAgentStatus(tenantId: string, status: AgentStatus): Promise<void> {
    const agentId = `jules-agent-${tenantId}`;

    // Update in database
    await this.agentRepo.updateStatus(agentId, status);

    // Update in Redis registry
    const agent = await this.agentRepo.findById(agentId, tenantId);
    if (agent) {
      const agentMetadata: Omit<AgentMetadata, 'lastSeen'> = {
        id: agent.id,
        name: agent.name,
        // Map DB status to a valid Redis registry status
        status: status === AgentStatus.BUSY ? 'busy' : 'online',
        platform: 'jules',
        capabilities: (agent.capabilities as string[]).map((c) => ({ name: c })),
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
  private async getApiKey(tenantId: string): Promise<string> {
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
  private buildWebhookUrl(tenantId: string, taskId: string, conversationId?: string): string {
    const context = {
      tenantId,
      taskId,
      conversationId,
    };

    const encodedContext = toBase64Url(JSON.stringify(context));

    return `${TNF_WEBHOOK_BASE_URL}/${encodedContext}`;
  }
}
