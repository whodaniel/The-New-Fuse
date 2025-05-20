import { z } from 'zod';
import { tool } from '../../utils/tool.js';
import { RedisService } from '../../services/redis.service.js';
import { TaskScheduler } from '../../services/scheduler.service.js';

const redis = new RedisService();
const scheduler = new TaskScheduler();

export const tools = {
  queryAgentState: tool({
    description: "Query the state of other agents in the system",
    parameters: z.object({
      agentId: z.string(),
      stateKey: z.string().optional()
    }),
    execute: async ({ agentId, stateKey }) => {
      const state = await redis.get(`agent:${agentId}`);
      return stateKey ? state[stateKey] : state;
    }
  }),

  scheduleTask: tool({
    description: "Schedule a task for execution",
    parameters: z.object({
      type: z.enum(["scheduled", "delayed", "cron"]),
      when: z.union([z.number(), z.string()]),
      payload: z.string()
    }),
    execute: async ({ type, when, payload }) => {
      return await scheduler.schedule(type, when, payload);
    }
  }),

  updateAgentCapabilities: tool({
    description: "Update agent capabilities",
    parameters: z.object({
      capabilities: z.array(z.string())
    }),
    execute: async ({ capabilities }) => {
      return await executions.updateAgentCapabilities({ capabilities });
    }
  })
};

export const executions = {
  updateAgentCapabilities: async ({ capabilities }: { capabilities: string[] }) => {
    // Requires confirmation due to system-level changes
    await redis.publish('AI_COORDINATION_CHANNEL', {
      type: capability_update',
      capabilities
    });
    return { success: true, updatedCapabilities: capabilities };
  }
};
