export declare enum UserRole {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
}
export declare enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
}
export interface User extends BaseEntity {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  metadata?: Record<string, any>;
}
