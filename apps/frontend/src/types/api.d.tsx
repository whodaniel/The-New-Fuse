export interface APIResponse<T> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
}
export declare enum AgentType {
    BASE = "base",
    ENHANCED = "enhanced",
    RESEARCH = "research",
    CASCADE = "cascade",
    WORKFLOW = "workflow",
    MARKETING = "marketing",
    TECHNICAL_SUPPORT = "technical_support",
    CUSTOMER_SUPPORT = "customer_support"
}
export declare enum ReasoningStrategy {
    DEDUCTIVE = "deductive",
    INDUCTIVE = "inductive",
    ABDUCTIVE = "abductive",
    ANALOGICAL = "analogical"
}
export interface AgentCapabilities {
    code_generation?: boolean;
    code_review?: boolean;
    code_optimization?: boolean;
    architecture_review?: boolean;
    dependency_analysis?: boolean;
    security_audit?: boolean;
    documentation?: boolean;
    test_generation?: boolean;
    bug_analysis?: boolean;
    performance_analysis?: boolean;
    data_analysis?: boolean;
    natural_language_processing?: boolean;
    virtual_browser?: boolean;
    web_automation?: boolean;
    project_analysis?: boolean;
    knowledge_graph?: boolean;
    taxonomy_system?: boolean;
    learning_system?: boolean;
    agent_collaboration?: boolean;
    communication_bus?: boolean;
    protocol_handler?: boolean;
}
export interface CharacterArc {
    arcId: string;
    agentId: string;
    arcName: string;
    description: string;
    goals: string[];
    milestones: Array<Record<string, any>>;
    currentStage: string;
    startTime: string;
    endTime?: string;
    progress: number;
    status: string;
}
export interface AgentMetadata {
    name: string;
    description: string;
    capabilities: string[];
    personalityTraits: string[];
    communicationStyle: string;
    expertiseAreas: string[];
    reasoningStrategies?: ReasoningStrategy[];
    characterArcs?: CharacterArc[];
    skillDevelopment?: {
        currentLevel: number;
        targetLevel: number;
        learningPath: string[];
        progress: number;
    };
    performanceMetrics?: {
        successRate: number;
        responseTime: number;
        accuracyScore: number;
        userSatisfaction: number;
    };
}
export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    config?: Record<string, any>;
    description?: string;
    instanceId?: string;
    isActive: boolean;
    capabilities?: AgentCapabilities;
    metadata?: AgentMetadata;
    createdAt: string;
    updatedAt: string;
}
export interface CreateAgentDto {
    name: string;
    type: AgentType;
    config?: Record<string, any>;
    description?: string;
    capabilities?: AgentCapabilities;
    metadata?: Partial<AgentMetadata>;
}
export interface UpdateAgentDto {
    name?: string;
    config?: Record<string, any>;
    description?: string;
    capabilities?: AgentCapabilities;
    metadata?: Partial<AgentMetadata>;
}
export interface GetConversationsResponse {
    conversations: ConversationResponse[];
}
export interface ConversationResponse {
    id: number;
    userId: string;
    messages: MessageResponse[];
    createdAt: string;
    updatedAt: string;
}
export interface MessageResponse {
    id: number;
    conversationId: number;
    sender: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}
export declare const transformApiMessage: (apiMessage: MessageResponse) => MessageResponse;
export declare const transformApiConversation: (apiConversation: ConversationResponse) => ConversationResponse;
