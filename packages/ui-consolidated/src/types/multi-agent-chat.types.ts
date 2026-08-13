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

// --- Firebase-backed provider types (MultiAgentChatProvider) ---
// These describe the contract MultiAgentChatProvider expects from its injected
// firebaseService/llmService props; concrete implementations are supplied by the
// consuming app, not by this package.

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  agentId?: string;
  llm?: string;
}

export interface ConversationRule {
  id?: string;
  sourceId: string;
  targetId: string;
  priority: number;
  isActive: boolean;
}

export interface ChatSessionState {
  goal: string;
  mode: 'manual' | 'auto';
  isActive: boolean;
  turnCount: number;
  startedAt: Date;
  lastActivity: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  agents: Agent[];
  messages: Message[];
  rules: ConversationRule[];
  state: ChatSessionState;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageGenerationRequest {
  prompt: string;
}

export interface MultiAgentChatViewProps {
  className?: string;
  theme?: 'auto' | 'light' | 'dark';
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  onMessageSent?: (message: Message) => void;
  onAgentCreated?: (agent: Partial<Agent>) => void;
}

export interface ImageGenerationResult {
  url: string;
}

export interface ChatContextValue {
  session: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  agents: Agent[];
  messages: Message[];
  rules: ConversationRule[];

  createAgent: (agentData: Partial<Agent>) => Promise<void>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;

  sendMessage: (text: string, senderId?: string, recipientId?: string) => Promise<void>;
  clearMessages: () => Promise<void>;

  createRule: (rule: Partial<ConversationRule>) => Promise<void>;
  updateRule: (id: string, updates: Partial<ConversationRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  startSession: (goal?: string) => Promise<void>;
  stopSession: () => Promise<void>;
  setMode: (mode: ChatSessionState['mode']) => void;
  setGoal: (goal: string) => void;

  automateAll: () => Promise<void>;
  injectScenario: (scenario: string) => Promise<void>;
  generateImage: (request: ImageGenerationRequest) => Promise<ImageGenerationResult>;
}

export interface MultiAgentChatFirebaseService {
  authenticateUser: () => Promise<{ uid: string }>;
  subscribeToAgents: (userId: string, callback: (agents: Agent[]) => void) => () => void;
  subscribeToMessages: (userId: string, callback: (messages: Message[]) => void) => () => void;
  subscribeToRules: (userId: string, callback: (rules: ConversationRule[]) => void) => () => void;
  createAgent: (userId: string, agentData: Partial<Agent>) => Promise<string>;
  updateAgent: (userId: string, id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (userId: string, id: string) => Promise<void>;
  addMessage: (userId: string, message: Partial<Message>) => Promise<void>;
  clearMessages: (userId: string) => Promise<void>;
  clearAllData: (userId: string) => Promise<void>;
  createRule: (userId: string, rule: Partial<ConversationRule>) => Promise<void>;
  updateRule: (userId: string, id: string, updates: Partial<ConversationRule>) => Promise<void>;
  deleteRule: (userId: string, id: string) => Promise<void>;
}

export interface MultiAgentChatLLMService {
  callTextAPI: (
    prompt: string,
    systemPrompt?: string,
    llm?: string,
    model?: string,
    history?: unknown,
    options?: { responseMimeType?: string }
  ) => Promise<string>;
  generateImage: (request: ImageGenerationRequest) => Promise<ImageGenerationResult>;
}
