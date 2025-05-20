import type { BaseEntity, UUID } from './core/index.js';

/**
 * Represents user roles within the system.
 */
export type UserRole = 'admin' | 'developer' | 'user' | 'guest';

/**
 * Represents user preferences or settings.
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  // Add other user-specific preferences
  [key: string]: unknown; // Allow arbitrary preferences
}

/**
 * Represents a user in the system.
 */
export interface User extends BaseEntity {
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  roles: UserRole[];
  isActive: boolean;
  lastLogin?: Date | null;
  preferences?: UserPreferences;
  // Optional fields for linking to external auth providers
  authProvider?: string; // e.g., 'google', 'github', 'local'
  authProviderId?: string;
}

/**
 * Data Transfer Object for creating a new user.
 * Often includes password which should not be stored on the User object itself.
 */
export interface CreateUserDto {
  username: string;
  email: string;
  password?: string; // Required for local auth, optional for external
  displayName?: string;
  roles?: UserRole[];
  authProvider?: string;
  authProviderId?: string;
}

/**
 * Data Transfer Object for updating an existing user.
 */
export interface UpdateUserDto {
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  roles?: UserRole[];
  isActive?: boolean;
  preferences?: Partial<UserPreferences>;
  // Password updates might be handled separately for security
}

/**
 * Interface for a service managing users.
 */
export interface UserService {
  createUser(userData: CreateUserDto): Promise<User>;
  getUserById(userId: UUID): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  updateUser(userId: UUID, updates: UpdateUserDto): Promise<User | null>;
  deleteUser(userId: UUID): Promise<boolean>;
  listUsers(filter?: Partial<User>): Promise<User[]>; // Simple filter example
  // Add methods for password management, role assignment, etc.
}
