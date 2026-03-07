import { z } from 'zod';

export interface AgentTool {
  name: string;
  description: string;
  schema: z.ZodSchema;
  execute(params: any): Promise<any>;
}

export const queryAgentStateTool: AgentTool = {
  name: 'queryAgentState',
  description: 'Query the state of other agents in the system',
  schema: z.object({
    agentId: z.string(),
    stateKey: z.string().optional()
  }),
  async execute(params: { agentId: string; stateKey?: string }): Promise<any> {
    const { agentId, stateKey } = params;
    // Mock implementation
    const state = { status: 'active', messages: [], capabilities: [] };
    return stateKey ? state[stateKey as keyof typeof state] : state;
  }
};

export const scheduleTaskTool: AgentTool = {
  name: 'scheduleTask',
  description: 'Schedule a task for execution',
  schema: z.object({
    taskId: z.string(),
    type: z.enum(['scheduled', 'delayed', 'cron']),
    delay: z.number().optional(),
    cronExpression: z.string().optional()
  }),
  async execute(params: { 
    taskId: string; 
    type: 'scheduled' | 'delayed' | 'cron'; 
    delay?: number; 
    cronExpression?: string 
  }): Promise<any> {
    const { taskId, type, delay, cronExpression } = params;
    // Mock implementation
    return {
      taskId, 
      type, 
      scheduledAt: new Date().toISOString(),
      delay,
      cronExpression
    };
  }
};

export const updateCapabilitiesTool: AgentTool = {
  name: 'updateCapabilities',
  description: 'Update agent capabilities',
  schema: z.object({
    agentId: z.string(),
    capabilities: z.array(z.string())
  }),
  async execute(params: { agentId: string; capabilities: string[] }): Promise<any> {
    const { agentId, capabilities } = params;
    // Mock implementation - would publish to coordination channel
    console.log(`Publishing capability update for agent ${agentId}`);
    return {
      agentId,
      capabilities, 
      updatedAt: new Date().toISOString() 
    };
  }
};

export const cloudflareAgentTools = [
  queryAgentStateTool,
  scheduleTaskTool,
  updateCapabilitiesTool
];