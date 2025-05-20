export const cloudflareConfig = {
  agent: {
    namespace: 'newfuse-agents',
    persistence: {
      type: 'durable-objects',
      database: true,
    },
    communication: {
      websocket: true,
      redis: true,
    },
    scaling: {
      minInstances: 1,
      maxInstances: 100,
    },
  },
  ai: {
    gateway: {
      enabled: true,
      caching: true,
      rateLimiting: true,
      retries: 3,
    },
    vectorize: {
      enabled: true,
      collections: ['agent-memory', 'task-context'],
    },
  },
};