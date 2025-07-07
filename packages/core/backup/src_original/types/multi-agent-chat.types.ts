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
  status?: 'sending' | 'sent' | 'error'
  mode: 'manual' | 'auto'
  createAgent: (agent: Omit<Agent, 'id' | 'createdAt' | '
  createRule: (rule: Omit<ConversationRule, '
  setMode: (mode: 'manual' | '
  theme?: 'light' | 'dark' | '