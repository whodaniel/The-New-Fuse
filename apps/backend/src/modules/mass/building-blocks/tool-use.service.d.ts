import { MassBlocksService } from './mass-blocks.service';
export declare class ToolUseService {
    private readonly massBlocksService;
    constructor(massBlocksService: MassBlocksService);
    execute(agentId: string, input: any, config: {
        toolName: string;
        parameters?: Record<string, any>;
        userId?: string;
    }): Promise<{
        result: any;
        executionMetrics: any;
    }>;
}
//# sourceMappingURL=tool-use.service.d.ts.map