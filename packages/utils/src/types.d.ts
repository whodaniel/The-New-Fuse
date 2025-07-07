export interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface LogOptions {
  level: string;
  component: string;
  traceId: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  options: Record<string, any>;
}
