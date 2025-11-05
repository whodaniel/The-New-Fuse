import { MassBlocksService } from './mass-blocks.service';
export declare class CustomAgentService {
    private readonly massBlocksService;
    constructor(massBlocksService: MassBlocksService);
    execute(agentId: string, input: any, config: {
        customLogic: string;
        parameters?: Record<string, any>;
        userId?: string;
    }): Promise<{
        result: any;
        executionMetrics: any;
    }>;
}
//# sourceMappingURL=custom-agent.service.d.ts.map