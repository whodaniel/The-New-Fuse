export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'agent' | 'system';
    timestamp: string;
    agentId?: string;
    agentName?: string;
    agentAvatar?: string;
    type?: 'text' | 'code' | 'image' | 'file';
}
export interface ChatAgent {
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'offline' | 'busy';
    type: 'assistant' | 'specialist' | 'admin';
    systemPrompt: string;
    voice?: string;
    model: string;
    profilePictureUrl?: string;
}
export interface ConversationRule {
    id: string;
    sourceId: string;
    targetId: string;
}
export interface SynthesisJob {
    id: string;
    summary: string;
    imagePrompts: string[];
    timestamp: Date;
    status: 'processing' | 'completed' | 'failed';
}
export interface Chat {
    id: string;
    messages: Message[];
    agents: ChatAgent[];
    createdAt: string;
    updatedAt: string;
}
declare class ChatApiService {
    private baseUrl;
    getChats(): Promise<Chat[]>;
    getChat(chatId: string): Promise<Chat | null>;
    createChat(chatData: Partial<Chat>): Promise<Chat | null>;
    addMessage(chatId: string, messageData: Partial<Message>): Promise<Message | null>;
    generateAgentResponse(chatId: string, prompt: string, agentId: string): Promise<string | null>;
    automateConversation(chatId: string, conversationGoal?: string): Promise<boolean>;
    createConversationRule(ruleData: Omit<ConversationRule, 'id'>): Promise<ConversationRule | null>;
    getConversationRules(): Promise<ConversationRule[]>;
    createSynthesisJob(jobData: Omit<SynthesisJob, 'id'>): Promise<SynthesisJob | null>;
    getSynthesisJobs(): Promise<SynthesisJob[]>;
    callTextApi(prompt: string, systemPrompt?: string): Promise<string>;
    callImageApi(prompt: string): Promise<string>;
}
export declare const chatApiService: ChatApiService;
export {};
