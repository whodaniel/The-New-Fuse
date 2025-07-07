import { ConfigService } from '../config/ConfigService';
export declare class AgentLLMService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    processMessage(message: string): Promise<string>;
    getAgentResponse(prompt: string): Promise<string>;
}
//# sourceMappingURL=AgentLLMService.d.ts.map