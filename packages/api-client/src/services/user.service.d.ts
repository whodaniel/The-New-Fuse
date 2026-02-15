import { ApiClient } from '../client/ApiClient';
import { BaseService } from './BaseService';
/**
 * User interface
 */
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * User profile interface
 */
export interface UserProfile {
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
}
/**
 * User update data
 */
export interface UserUpdateData {
    name?: string;
    email?: string;
    role?: string;
    avatar?: string;
    bio?: string;
}
/**
 * User service for managing users
 */
export declare class UserService extends BaseService {
    /**
     * Create a new user service
     * @param api API client instance
     */
    constructor(api: ApiClient);
    /**
     * Get all users
     * @param options Query options (page, limit, search, etc.)
     * @returns Promise with users list
     */
    getUsers(options?: Record<string, any>): Promise<User[]>;
    /**
     * Get user by ID
     * @param id User ID
     * @returns Promise with user data
     */
    getUserById(id: string): Promise<User>;
    /**
     * Update user
     * @param id User ID
     * @param data User data to update
     * @returns Promise with updated user data
     */
    updateUser(id: string, data: UserUpdateData): Promise<User>;
    /**
     * Delete user
     * @param id User ID
     * @returns Promise with deletion response
     */
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Update user profile
     * @param data Profile data to update
     * @returns Promise with updated profile data
     */
    updateProfile(data: UserProfile): Promise<User>;
    /**
     * Change user password
     * @param currentPassword Current password
     * @param newPassword New password
     * @returns Promise with password change response
     */
    changePassword(currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
/**
 * Create a new user service
 * @param api API client instance
 * @returns User service instance
 *
 * @example
 * ```typescript
 * import {
 *   createApiClient,
 *   createUserService,
 *   UserProfile
 * } from '@the-new-fuse/api-client';
 *
 * // Create a new API client
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 * });
 *
 * // Create user service
 * const userService = createUserService(api);
 *
 * // Get all users
 * const users = await userService.getUsers();
 *
 * // Update user profile
 * const profileData: UserProfile = {
 *   name: 'John Doe',
 *   email: 'john.doe@example.com',
 *   bio: 'Software developer',
 *   avatar: 'https://example.com/avatar.jpg'
 * };
 *
 * const updatedUser = await userService.updateProfile(profileData);
 * console.log(`Profile updated for ${updatedUser.name}`);
 * ```
 */
export declare function createUserService(api: ApiClient): UserService;
