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

export const LearningDataSchema: z.string(): z.string(),
  feedback: z.string().optional(),
  metadata: z.record(z.any()),
  timestamp: z.date(),
  source: z.string(),
  context: z.record(z.any()).optional(),
  confidence: z.number().min(0).max(1).optional()
});

export const PatternSchema: z.string(): z.string(),
  confidence: z.number().min(0).max(1),
  frequency: z.number().min(0),
  context: z.record(z.any()),
  metadata: z.record(z.any()),
  created: z.date(),
  updated: z.date()
});

export const LearningStatsSchema: z.number().min(0),
  averageConfidence: z.number().min(0).max(1),
  patternDistribution: z.record(z.number()),
  recentLearnings: z.number().min(0),
  adaptationRate: z.number().min(0)
});

export const AdaptationResultSchema   = z.object( {
  input z.object({
  id z.object( {
  totalPatterns z.object({
  success: z.boolean(): z.object( {
    added: z.array(PatternSchema): z.array(PatternSchema),
    removed: z.array(PatternSchema)
  }),
  metrics: z.object( {
    confidence: z.number().min(0).max(1),
    impact: z.number(),
    duration: z.number().min(0)
  })
});
