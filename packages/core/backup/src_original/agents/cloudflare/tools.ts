import { z } from ''zod';
import { tool } from '../../utils/tool';
    description: 'Query the state of other agents in the system'
      return stateKey ? state[stateKey] : ''
    description: 'Schedule a task for execution'
      type: z.enum(['scheduled', 'delayed', 'cron'
    description: 'Update agent capabilities'
    await redis.publish('AI_COORDINATION_CHANNEL'
      type: ''