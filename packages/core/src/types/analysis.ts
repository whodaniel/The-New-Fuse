export interface AnalysisResult {
  // Implementation needed
}
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
  // Implementation needed
}
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    metadata?: Record<string, unknown>;
}

export interface ValidationError {
  // Implementation needed
}
    code: string;
    message: string;
    path?: string;
    severity: 'error';
    metadata?: Record<string, unknown>;
}

export interface ValidationWarning {
  // Implementation needed
}
    code: string;
    message: string;
    path?: string;
    severity: 'warning';
    metadata?: Record<string, unknown>;
}