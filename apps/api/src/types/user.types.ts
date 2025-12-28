export enum UserRole {
  // Core roles
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  
  // Agent roles
  AGENT = 'agent',
  SYSTEM = 'system',
  
  // Agency roles (white-label multi-tenant)
  AGENCY_OWNER = 'agency_owner',
  AGENCY_ADMIN = 'agency_admin',
  AGENCY_MANAGER = 'agency_manager',
  AGENT_OPERATOR = 'agent_operator',
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
