import { z } from 'zod';
export declare const TraceEntrySchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    agentId: z.ZodString;
    action: z.ZodString;
    durationMs: z.ZodOptional<z.ZodNumber>;
    success: z.ZodOptional<z.ZodBoolean>;
    errorType: z.ZodOptional<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type TraceEntry = z.infer<typeof TraceEntrySchema>;
export interface TraceIssue {
    category: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedAgents: Set<string>;
    examples: TraceEntry[];
}
export interface TraceMetrics {
    totalEntries: number;
    successRate: number;
    errorRate: number;
    avgDurationMs: number;
    p95DurationMs: number;
    errorCategories: Record<string, number>;
    agentBreakdown: Record<string, {
        total: number;
        errors: number;
        avgDuration: number;
    }>;
    timeRange: {
        start: number;
        end: number;
    } | null;
}
export declare class TraceAnalyzer {
    private entries;
    loadTraces(entries: TraceEntry[]): void;
    addEntry(entry: TraceEntry): void;
    computeMetrics(): TraceMetrics;
    identifyIssues(): TraceIssue[];
    generateEvaluationPlan(): {
        focusAreas: string[];
        metrics: string[];
        thresholds: Record<string, number>;
    };
    clear(): void;
}
//# sourceMappingURL=traceAnalyzer.d.ts.map