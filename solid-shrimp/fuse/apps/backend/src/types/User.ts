export interface User {
  id: string;
  email: string;
  name: string;
  googleId?: string;
  emailVerified: boolean;
  role: 'USER' | 'ADMIN';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthEvent {
  id: string;
  userId: string;
  type: string;
  success: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}