export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  llm: string;
  model: string;
  profilePictureUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  agentId?: string;
  timestamp: Date;
  llm?: string;
  status?: 'sending' | 'sent' | 'error';
  mode: 'manual' | 'auto';
}

export interface ConversationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiAgentChatState {
  agents: Agent[];
  messages: Message[];
  rules: ConversationRule[];
  activeAgentId?: string;
  isLoading: boolean;
  error?: string;
}

export interface MultiAgentChatActions {
  createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): void;
  createRule(rule: Omit<ConversationRule, 'id' | 'createdAt' | 'updatedAt'>): void;
  setMode(mode: 'manual' | 'auto'): void;
  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): void;
  selectAgent(agentId: string): void;
  updateAgent(agentId: string, updates: Partial<Agent>): void;
  updateRule(ruleId: string, updates: Partial<ConversationRule>): void;
  deleteAgent(agentId: string): void;
  deleteRule(ruleId: string): void;
  // UI related actions
  setTheme(theme: 'light' | 'dark' | 'system'): void;
}