export interface ValidationRule {
    id: string;
    name: string;
    description?: string;
    type: 'schema' | 'custom' | 'regex' | 'function'
    severity: 'error' | 'warning' | 'info'