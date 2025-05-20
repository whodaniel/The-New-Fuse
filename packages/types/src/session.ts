export interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionCreateInput {
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionUpdateInput {
  token?: string;
  expiresAt?: Date;
  userAgent?: string;
  ipAddress?: string;
}
