import { ApiClient } from '../client/ApiClient.js';
import { BaseService } from './BaseService.js';

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
export class UserService extends BaseService {
  /**
   * Create a new user service
   * @param api API client instance
   */
  constructor(api: ApiClient) {
    super(api, '/users');
  }

  /**
   * Get all users
   * @param options Query options (page, limit, search, etc.)
   * @returns Promise with users list
   */
  async getUsers(options: Record<string, any> = {}): Promise<User[]> {
    return this.list<User[]>('', options);
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns Promise with user data
   */
  async getUserById(id: string): Promise<User> {
    return this.getById<User>(id);
  }

  /**
   * Update user
   * @param id User ID
   * @param data User data to update
   * @returns Promise with updated user data
   */
  async updateUser(id: string, data: UserUpdateData): Promise<User> {
    return this.updateById<User>(id, data);
  }

  /**
   * Delete user
   * @param id User ID
   * @returns Promise with deletion response
   */
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return this.deleteById<{ success: boolean; message: string }>(id);
  }

  /**
   * Update user profile
   * @param data Profile data to update
   * @returns Promise with updated profile data
   */
  async updateProfile(data: UserProfile): Promise<User> {
    this.validateRequired({ name: data.name, email: data.email }, ['name', 'email']);
    return this.put<User>('/profile', data);
  }

  /**
   * Change user password
   * @param currentPassword Current password
   * @param newPassword New password
   * @returns Promise with password change response
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    this.validateRequired({ currentPassword, newPassword }, ['currentPassword', 'newPassword']);
    return this.post<{ success: boolean; message: string }>('/change-password', {
      currentPassword,
      newPassword,
    });
  }
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
export function createUserService(api: ApiClient): UserService {
  return new UserService(api);
}
