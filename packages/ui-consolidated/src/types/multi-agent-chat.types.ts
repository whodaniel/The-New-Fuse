export interface Agent {
  id: string;
  name: string;
  profilePictureUrl?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  capabilities: string[];
  metadata?: Record<string, unknown>;
  // LLM properties
  llm?: 'gemini' | 'openai' | 'anthropic' | 'claude' | 'custom';
  model?: string;
  systemPrompt?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: Agent;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationState {
  id: string;
  participants: Agent[];
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'ended';
  topic?: string;
}

export interface MultiAgentChatProps {
  conversationId?: string;
  currentAgentId: string;
  participants?: Agent[];
  onMessage?: (message: ConversationMessage) => void;
  onParticipantJoin?: (agent: Agent) => void;
  onParticipantLeave?: (agentId: string) => void;
  className?: string;
}

export interface MultiAgentChatContextValue {
  conversationState: ConversationState;
  currentUser: Agent | null;
  sendMessage: (content: string) => Promise<void>;
  joinConversation: (agent: Agent) => Promise<void>;
  leaveConversation: (agentId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseMultiAgentChatReturn extends MultiAgentChatContextValue {
  refresh: () => Promise<void>;
}
