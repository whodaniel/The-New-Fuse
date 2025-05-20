export declare class User {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
