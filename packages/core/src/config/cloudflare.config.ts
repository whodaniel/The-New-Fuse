export interface CloudflareConfig {
  agent: {
    namespace: string;
    type: string;
    collections: string[];
  };
  r2: {
    bucketName: string;
    publicUrl?: string;
  };
  kv: {
    namespaces: {
      cache: string;
      sessions: string;
    };
  };
  durableObjects: {
    bindings: string[];
  };
  workers: {
    environment: 'production' | 'development' | 'staging';
    compatibilityDate: string;
  };
}

export const cloudflareConfig: CloudflareConfig = {
  agent: {
    namespace: 'newfuse-agents',
    type: 'durable-objects',
    collections: ['agent-memory', 'task-context']
  },
  r2: {
    bucketName: process.env.CLOUDFLARE_R2_BUCKET || 'newfuse-storage',
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL
  },
  kv: {
    namespaces: {
      cache: process.env.CLOUDFLARE_KV_CACHE || 'newfuse-cache',
      sessions: process.env.CLOUDFLARE_KV_SESSIONS || 'newfuse-sessions'
    }
  },
  durableObjects: {
    bindings: ['AgentState', 'TaskManager', 'ConversationHistory']
  },
  workers: {
    environment: (process.env.NODE_ENV as 'production' | 'development' | 'staging') || 'development',
    compatibilityDate: '2024-01-01'
  }
};