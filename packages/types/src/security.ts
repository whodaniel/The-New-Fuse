// Security types
export interface SecurityConfig {
  apiKey?: string;
  secret?: string;
  allowedOrigins?: string[];
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
  userId: string;
}
