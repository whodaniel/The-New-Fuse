export declare enum LearningType {
    CONVERSATION = "conversation",
    TASK_EXECUTION = "task_execution",
    ERROR_HANDLING = "error_handling",
    USER_FEEDBACK = "user_feedback",
    SYSTEM_ADAPTATION = "system_adaptation",
    PATTERN_RECOGNITION = "pattern_recognition"
}
export declare enum FeedbackType {
    POSITIVE = "positive",
    NEGATIVE = "negative",
    NEUTRAL = "neutral",
    SUGGESTION = "suggestion"
}
export interface LearningData {
    id: string;
    type: LearningType;
    input: unknown;
    output: unknown;
    feedback?: {
        type: FeedbackType;
        content: string;
        source: string;
        timestamp: Date;
    };
    context?: {
        userId?: string;
        taskId?: string;
        sessionId?: string;
        environment?: string;
    };
    metadata: {
        timestamp: Date;
        version: string;
        tags: string[];
        confidence?: number;
        performance?: {
            executionTime: number;
            memoryUsage: number;
            accuracy?: number;
        };
    };
}
export interface Pattern {
    id: string;
    type: string;
    pattern: unknown;
    confidence: number;
    occurrences: number;
    firstSeen: Date;
    lastSeen: Date;
    metadata: Record<string, unknown>;
}
export interface Adaptation {
    id: string;
    type: string;
    trigger: {
        pattern: Pattern;
        threshold: number;
        condition?: string;
    };
    action: {
        type: string;
        parameters: Record<string, unknown>;
    };
    status: pending' | 'active' | 'disabled';
    metadata: {
        created: Date;
        updated: Date;
        performance?: {
            successRate: number;
            failureRate: number;
            averageLatency: number;
        };
    };
}
export interface LearningConfig {
    enabled: boolean;
    adaptationThreshold: number;
    minConfidence: number;
    maxPatterns: number;
    learningRate: number;
    decayFactor: number;
    features: {
        patternRecognition: boolean;
        errorLearning: boolean;
        performanceOptimization: boolean;
        userAdaptation: boolean;
    };
}
export interface LearningMetrics {
    totalSamples: number;
    patternCount: number;
    adaptationCount: number;
    averageConfidence: number;
    successRate: number;
    learningProgress: number;
    recentAdaptations: Adaptation[];
    performanceMetrics: {
        accuracy: number;
        latency: number;
        efficiency: number;
    };
}
