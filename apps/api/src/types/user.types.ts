export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system',
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    desktop?: boolean;
  };
  timezone?: string;
  displayName?: string;
}

export interface UserMetadata {
  lastActivity?: Date;
  loginCount?: number;
  failedLoginAttempts?: number;
  verificationStatus?: {
    email?: boolean;
    phone?: boolean;
    twoFactor?: boolean;
  };
  securityLog?: Array<{
    action: string;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
  }>;
}
