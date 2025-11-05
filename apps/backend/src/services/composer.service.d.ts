import { OnModuleInit } from '@nestjs/common';
import { RedisService } from './RedisService';
import { AgentService } from './agent.service';
export declare class ComposerService implements OnModuleInit {
    private readonly redisService;
    private readonly agentService;
    constructor(redisService: RedisService, agentService: AgentService);
    onModuleInit(): Promise<void>;
    handleStatusUpdate(data: any): Promise<void>;
    handleCommunication(data: any): Promise<void>;
}
//# sourceMappingURL=composer.service.d.ts.map