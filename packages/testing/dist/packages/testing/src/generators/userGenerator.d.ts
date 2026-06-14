import { type TimestampOptions } from './utils';
export type UserRole = 'admin' | 'user' | 'viewer' | 'manager';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export interface GenerateUserOptions {
    role?: UserRole;
    status?: UserStatus;
    timestamps?: TimestampOptions;
    withPreferences?: boolean;
    withMetadata?: boolean;
}
export interface GeneratedUser {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    preferences?: UserPreferences;
    metadata?: Record<string, any>;
}
interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
}
export declare const generateUserPreferences: () => UserPreferences;
export declare const generateUser: (options?: GenerateUserOptions) => GeneratedUser;
export declare const generateUsers: (count: number, options?: GenerateUserOptions) => GeneratedUser[];
export {};
//# sourceMappingURL=userGenerator.d.ts.map