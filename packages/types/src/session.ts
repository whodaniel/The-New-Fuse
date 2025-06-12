// Session types
export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface SessionManager {
  create(userId: string): Promise<Session>;
  validate(sessionId: string): Promise<boolean>;
  destroy(sessionId: string): Promise<void>;
}
