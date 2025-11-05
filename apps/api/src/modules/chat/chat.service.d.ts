import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from '../../agents/agents.service';
import { LlmService } from '../../llm/llm.service';
interface Message {
    id: string;
    content: string;
    sender: 'user' | 'agent' | 'system';
    timestamp: Date;
    agentId?: string;
    agentName?: string;
    type?: 'text' | 'code' | 'image' | 'file';
}
interface ConversationRule {
    id: string;
    sourceId: string;
    targetId: string;
}
export declare class ChatService {
    private prisma;
    private agentsService;
    private llmService;
    private readonly logger;
    constructor(prisma: PrismaService, agentsService: AgentsService, llmService: LlmService);
    findAll(userId: string): Promise<any>;
    findOne(id: string, userId: string): Promise<any>;
    create(userId: string, createChatDto: any): Promise<any>;
    addMessage(chatId: string, userId: string, messageData: Partial<Message>): Promise<any>;
    createConversationRule(userId: string, ruleData: Omit<ConversationRule, 'id'>): Promise<any>;
    getConversationRules(userId: string): Promise<any>;
    generateAgentResponse(prompt: string, agentId: string, userId: string): Promise<any>;
    createSynthesisJob(userId: string, jobData: any): Promise<any>;
    getSynthesisJobs(userId: string): Promise<{
        id: string;
        userId: string;
        status: string;
        createdAt: Date;
        result: string;
    }[]>;
    automateConversation(chatId: string, userId: string, conversationGoal?: string): Promise<any>;
}
export {};
//# sourceMappingURL=chat.service.d.ts.map