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
  metadata?: {
    tokens?: number;
    processingTime?: number;
    model?: string;
  };
}

export interface ConversationRule {
  id: string;
  sourceId: string;
  targetId: string;
  condition?: string;
  priority: number;
  isActive: boolean;
}

export interface ConversationState {
  goal: string;
  mode: 'manual' | 'auto';
  isActive: boolean;
  currentSpeaker?: string;
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
  state: ConversationState;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMProvider {
  id: string;
  name: string;
  icon: React.ComponentType;
  apiKey?: string;
  endpoint: string;
  models: string[];
  supportsImages: boolean;
  supportsStreaming: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: { width: number; height: number };
  quality?: number;
  style?: string;
}

export interface ImageGenerationResponse {
  url: string;
  base64?: string;
  metadata?: {
    size: { width: number; height: number };
    format: string;
    generatedAt: Date;
  };
}

export interface ChatContextValue {
  session: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  agents: Agent[];
  messages: Message[];
  rules: ConversationRule[];
  
  // Agent management
  createAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  
  // Message management
  sendMessage: (text: string, senderId?: string, recipientId?: string) => Promise<void>;
  clearMessages: () => Promise<void>;
  
  // Rule management
  createRule: (rule: Omit<ConversationRule, 'id'>) => Promise<void>;
  updateRule: (id: string, updates: Partial<ConversationRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  
  // Session management
  startSession: (goal?: string) => Promise<void>;
  stopSession: () => Promise<void>;
  setMode: (mode: 'manual' | 'auto') => void;
  setGoal: (goal: string) => void;
  
  // Automation
  automateAll: () => Promise<void>;
  injectScenario: (scenario: string) => Promise<void>;
  
  // Image generation
  generateImage: (request: ImageGenerationRequest) => Promise<ImageGenerationResponse>;
}

export interface MultiAgentChatProps {
  userId?: string;
  sessionId?: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  allowedProviders?: string[];
  maxAgents?: number;
  maxMessages?: number;
  enableImageGeneration?: boolean;
  enableAutomation?: boolean;
  onSessionStart?: (session: ChatSession) => void;
  onSessionEnd?: (session: ChatSession) => void;
  onMessageSent?: (message: Message) => void;
  onAgentCreated?: (agent: Agent) => void;
}
