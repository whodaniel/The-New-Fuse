export enum AuthEventType {
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
}

export interface AuthMetadata {
  [key: string]: unknown;
}