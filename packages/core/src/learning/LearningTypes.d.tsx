import { z } from 'zod';
export interface LearningData {
    input: string;
    output: string;
    feedback?: string;
    metadata: Record<string, unknown>;
    timestamp: Date;
    source: string;
    context?: Record<string, unknown>;
    confidence?: number;
}
export interface Pattern {
    id: string;
    type: string;
    confidence: number;
    frequency: number;
    context: Record<string, unknown>;
    metadata: Record<string, unknown>;
    created: Date;
    updated: Date;
}
export interface LearningStats {
    totalPatterns: number;
    averageConfidence: number;
    patternDistribution: Record<string, number>;
    recentLearnings: number;
    adaptationRate: number;
}
export interface AdaptationResult {
    success: boolean;
    changes: {
        added: Pattern[];
        modified: Pattern[];
        removed: Pattern[];
    };
    metrics: {
        confidence: number;
        impact: number;
        duration: number;
    };
}
export declare const LearningDataSchema: z.string;
export declare const PatternSchema: z.string;
export declare const LearningStatsSchema: z.number;
export declare const AdaptationResultSchema: z.ZodObject<z.ZodRawShape, "strip", z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
