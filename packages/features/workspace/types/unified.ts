export interface UnifiedMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: {
    id: string;
    type: 'user' | 'agent' | 'system';
    name: string;
  };
  metadata: {
    workspaceId: string;
    threadId: string;
    llmProvider: string;
    [key: string]: any;
  };
}

export interface ChatThread {
  id: string;
  name: string;
  messages: UnifiedMessage[];
}

export interface Agent {
  id: string;
  name: string;
  llmConfig: {
    provider: string;
  };
}

export interface UnifiedWorkspace {
  id: string;
  name: string;
  threads: ChatThread[];
  agents: Agent[];
  llmConfig: {
    defaultProvider: string;
  };
}
