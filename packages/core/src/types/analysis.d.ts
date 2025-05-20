export interface AnalysisResult {
    id: string;
    type: string;
    timestamp: Date;
    data: unknown;
    metadata?: Record<string, unknown>;
    score?: number;
    confidence?: number;
    tags?: string[];
}
export interface ValidationReport {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    metadata?: Record<string, unknown>;
}
export interface ValidationError {
    code: string;
    message: string;
    path?: string;
    severity: 'error'; // Corrected string literal
    metadata?: Record<string, unknown>;
}
export interface ValidationWarning {
    code: string;
    message: string;
    path?: string;
    severity: 'warning'; // Corrected string literal
    metadata?: Record<string, unknown>;
}
export interface AnalysisMetrics {
    totalAnalyses: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    averageAnalysisTime: number;
    averageConfidence: number;
    byType: Record<string, {
        count: number;
        averageScore: number;
        averageConfidence: number;
    }>;
}
export interface AnalysisRequest {
    type: string;
    data: unknown;
    options?: {
        timeout?: number;
        priority?: number;
        validateOnly?: boolean;
        requireConfidence?: number;
    };
    metadata?: Record<string, unknown>;
}
export interface AnalysisResponse {
    requestId: string;
    result: AnalysisResult;
    validation?: ValidationReport;
    metrics: {
        processingTime: number;
        confidence: number;
        score?: number;
    };
    metadata?: Record<string, unknown>;
}
