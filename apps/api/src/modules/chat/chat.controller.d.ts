import { ChatService } from './chat.service';
import { AuthenticatedRequest } from '../../types/request.types';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getChats(req: AuthenticatedRequest): Promise<any>;
    getChat(id: string, req: AuthenticatedRequest): Promise<any>;
    createChat(createChatDto: any, req: AuthenticatedRequest): Promise<any>;
    addMessage(chatId: string, messageData: any, req: AuthenticatedRequest): Promise<any>;
    automateConversation(chatId: string, automateDto: {
        conversationGoal?: string;
    }, req: AuthenticatedRequest): Promise<any>;
    createConversationRule(ruleData: any, req: AuthenticatedRequest): Promise<any>;
    getConversationRules(req: AuthenticatedRequest): Promise<any>;
    createSynthesisJob(jobData: any, req: AuthenticatedRequest): Promise<any>;
    getSynthesisJobs(req: AuthenticatedRequest): Promise<any>;
    generateResponse(chatId: string, generateDto: {
        prompt: string;
        agentId: string;
    }, req: AuthenticatedRequest): Promise<{
        response: any;
    }>;
}
//# sourceMappingURL=chat.controller.d.ts.map