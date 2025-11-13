export interface Agent {
    id: string;
    name: string;
    description?: string;
    role?: string;
    status: string;
    capabilities: string[];
    configuration?: Record<string, any>;
    lastActiveAt?: Date;
    createdAt?: Date;
    userId?: string;
    profilePictureUrl?: string;
    llm?: string;
    model?: string;
    systemPrompt?: string;
}
export interface Message {
    id: string;
    content: string;
    text?: string;
    senderId: string;
    recipientId?: string;
    timestamp: Date;
    type?: 'user' | 'agent' | 'system';
    metadata?: Record<string, any>;
}
export interface ConversationRule {
    id: string;
    name: string;
    description?: string;
    sourceId: string;
    targetId: string;
    conditions?: Record<string, any>;
    actions?: Record<string, any>;
    priority?: number;
    isActive: boolean;
}
export interface ChatSession {
    id: string;
    name?: string;
    participants: Agent[];
    messages: Message[];
    rules: ConversationRule[];
    status: 'active' | 'paused' | 'completed';
    startedAt: Date;
    endedAt?: Date;
    metadata?: Record<string, any>;
}
export interface ImageGenerationRequest {
    prompt: string;
    style?: string;
    size?: string;
    quality?: string;
}
export interface ChatContextValue {
    agents: Agent[];
    selectedAgents: Agent[];
    createAgent: (agentData: Partial<Agent>) => Promise<void>;
    updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
    deleteAgent: (id: string) => Promise<void>;
    selectAgent: (agent: Agent) => void;
    deselectAgent: (agent: Agent) => void;
    messages: Message[];
    sendMessage: (text: string, senderId: string, recipientId?: string) => Promise<void>;
    clearMessages: () => Promise<void>;
    rules: ConversationRule[];
    createRule: (rule: Partial<ConversationRule>) => Promise<void>;
    updateRule: (id: string, updates: Partial<ConversationRule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    currentSession: ChatSession | null;
    session?: ChatSession | null;
    startSession: (goal: string) => Promise<void>;
    endSession: () => Promise<void>;
    mode: 'setup' | 'conversation' | 'analysis' | 'auto' | 'manual';
    setMode: (mode: 'setup' | 'conversation' | 'analysis' | 'auto' | 'manual') => void;
    goal: string;
    setGoal: (goal: string) => void;
    injectScenario: (scenario: any) => Promise<void>;
    generateImage?: (request: ImageGenerationRequest) => Promise<any>;
    isLoading?: boolean;
    automateAll?: () => void;
    loading: boolean;
    error: string | null;
}
export interface MultiAgentChatProps {
    initialAgents?: Agent[];
    onSessionStart?: (session: ChatSession) => void;
    onSessionEnd?: (session: ChatSession) => void;
    onMessageSent?: (message: Message) => void;
    onAgentCreated?: (agent: Agent) => void;
    theme?: 'light' | 'dark' | 'auto';
    className?: string;
}
//# sourceMappingURL=multi-agent-chat.types.d.ts.map