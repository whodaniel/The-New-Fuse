import { PrismaService } from '../../../lib/prisma/prisma.service';
export interface MassBlockConfig {
    type: 'aggregate' | 'reflect' | 'debate' | 'custom' | 'tool-use';
    parameters: Record<string, any>;
}
export interface MassBlockResult {
    result: any;
    metadata: {
        executionTime: number;
        tokensUsed: number;
        model: string;
        timestamp: string;
    };
}
export declare class MassBlocksService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    executeBlock(agentId: string, input: any, config: MassBlockConfig): Promise<MassBlockResult>;
    private executeAggregate;
    private executeReflect;
    private executeDebate;
    private executeCustom;
    private executeToolUse;
}
export declare class AggregateBlock {
    private readonly massBlocksService;
    constructor(massBlocksService: MassBlocksService);
    execute(input: any[], config: any): Promise<any>;
}
export declare class ReflectBlock {
    private readonly massBlocksService;
    constructor(massBlocksService: MassBlocksService);
    execute(input: any, config: any): Promise<any>;
}
export declare class DebateBlock {
    private readonly massBlocksService;
    constructor(massBlocksService: MassBlocksService);
    execute(input: any, config: any): Promise<any>;
}
export declare class CustomBlock {
    private readonly massBlocksService;
    constructor(massBlocksService: MassBlocksService);
    execute(input: any, config: any): Promise<any>;
}
export declare class ToolUseBlock {
    private readonly massBlocksService;
    constructor(massBlocksService: MassBlocksService);
    execute(input: any, config: any): Promise<any>;
}
export declare class AgentExecutorService {
    private readonly massBlocksService;
    constructor(massBlocksService: MassBlocksService);
    execute(agentId: string, input: any, config: MassBlockConfig): Promise<MassBlockResult>;
}
//# sourceMappingURL=mass-blocks.service.d.ts.map