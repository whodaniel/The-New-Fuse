import { z } from 'zod';
export declare const ProductionSafetyConfigSchema: z.ZodObject<{
    agentRequestLimit: z.ZodDefault<z.ZodNumber>;
    readmaxLines: z.ZodDefault<z.ZodNumber>;
    maxConcurrentAgents: z.ZodDefault<z.ZodNumber>;
    timeoutMs: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    maxTokenBudget: z.ZodDefault<z.ZodNumber>;
    enableSafetyLogging: z.ZodDefault<z.ZodBoolean>;
    haltOnCriticalFailure: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type ProductionSafetyConfig = z.infer<typeof ProductionSafetyConfigSchema>;
export interface SafetyViolation {
    rule: string;
    current: number;
    limit: number;
    timestamp: number;
    agentId?: string;
}
export declare class ProductionSafetyService {
    private config;
    private requestCounts;
    private violations;
    private activeAgents;
    constructor(config?: Partial<ProductionSafetyConfig>);
    checkRequestLimit(agentId: string): boolean;
    checkConcurrentAgents(agentId: string): boolean;
    checkTokenBudget(estimatedTokens: number): boolean;
    truncateOutput(content: string): string;
    releaseAgent(agentId: string): void;
    resetCounters(): void;
    getViolations(): SafetyViolation[];
    getConfig(): Readonly<ProductionSafetyConfig>;
    private recordViolation;
}
//# sourceMappingURL=productionSafety.d.ts.map