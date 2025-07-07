export const cloudflareConfig = {
  agent: {
    namespace: 'newfuse-agents'
      type: 'durable-objects'
      collections: ['agent-memory', 'task-context'