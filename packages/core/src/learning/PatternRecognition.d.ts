import { LearningPattern } from './LearningSystem.js';
export interface PatternMatch {
    pattern: LearningPattern;
    confidence: number;
    matchedFeatures: string[];
}
export declare class PatternRecognition {
    private logger;
    private readonly db;
    private readonly minConfidence;
    private readonly maxPatternAge;
    constructor();
    private detectTimeClusters;
    private findSequentialPatterns;
}
