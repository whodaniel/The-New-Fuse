export interface ValidationRule {
  // Implementation needed
}
    id: string;
    name: string;
    description?: string;
    type: 'schema' | 'custom' | 'regex' | 'function';
    severity: 'error' | 'warning' | 'info';
    enabled?: boolean;
    metadata?: Record<string, unknown>;
}