import { ConfigService } from '@nestjs/config';
import { AgentLLMService } from './agent-llm.service.js';
export declare class AgentFactory {
    private readonly configService;
    private readonly llmService;
    constructor(configService: ConfigService, llmService: AgentLLMService);
    createAgent(): Promise<void>;
}
export default AgentFactory;
