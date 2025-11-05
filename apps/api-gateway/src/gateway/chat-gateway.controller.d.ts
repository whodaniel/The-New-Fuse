/**
 * Chat Gateway Controller
 * Unified endpoint for chat and real-time communication
 */
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';
export declare class ChatGatewayController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    getChatSessions(headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    createChatSession(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getChatMessages(id: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    sendChatMessage(id: string, body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=chat-gateway.controller.d.ts.map