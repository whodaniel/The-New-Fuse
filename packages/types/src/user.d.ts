import type { BaseEntity, UUID } from './core/index';
/**
 * Represents user roles within the system.
 */
export type UserRole = 'admin' | 'developer' | 'user' | 'guest';
/**
 * Represents system permissions that can be granted to users
 */
export declare enum Permission {
    READ_USERS = "READ_USERS",
    WRITE_USERS = "WRITE_USERS",
    DELETE_USERS = "DELETE_USERS",
    MANAGE_AGENTS = "MANAGE_AGENTS",
    ADMIN_ACCESS = "ADMIN_ACCESS"
}
/**
 * Represents user preferences or settings.
 */
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
        email?: boolean;
        push?: boolean;
    };
    [key: string]: unknown;
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
    authProvider?: string;
    authProviderId?: string;
}
/**
 * Data Transfer Object for creating a new user.
 * Often includes password which should not be stored on the User object itself.
 */
export interface CreateUserDto {
    username: string;
    email: string;
    password?: string;
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
    listUsers(filter?: Partial<User>): Promise<User[]>;
}
//# sourceMappingURL=user.d.ts.map