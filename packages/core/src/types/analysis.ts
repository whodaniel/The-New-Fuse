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
    severity: 'error';
    metadata?: Record<string, unknown>;
}

export interface ValidationWarning {
    code: string;
    message: string;
    path?: string;
    severity: 'warning';
    metadata?: Record<string, unknown>;
}