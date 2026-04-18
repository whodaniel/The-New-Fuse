import { BaseService } from './BaseService.js';

/**
 * User data
 */
export interface User {
  /**
   * User ID
   */
  id: string;
  /**
   * User email
   */
  email: string;
  /**
   * User name
   */
  name: string;
  /**
   * User avatar URL
   */
  avatar?: string;
  /**
   * User creation date
   */
  createdAt: string;
  /**
   * User update date
   */
  updatedAt: string;
}

/**
 * User update data
 */
export interface UserUpdateData {
  /**
   * User name
   */
  name?: string;
  /**
   * User avatar URL
   */
  avatar?: string;
}

/**
 * User service for managing users
 */
export class UserService extends BaseService {
  /**
   * Create a new user service
   * @param apiClient API client
   */
  constructor(apiClient: any) {
    super(apiClient, '/users');
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns Promise resolving to the user data
   */
  async getUser(id: string): Promise<User> {
    return this.apiClient.get<User>(this.getPath(`/${id}`));
  }

  /**
   * Get the current user
   * @returns Promise resolving to the current user data
   */
  async getCurrentUser(): Promise<User> {
    return this.apiClient.get<User>(this.getPath('/me'));
  }

  /**
   * Update the current user
   * @param data User update data
   * @returns Promise resolving to the updated user data
   */
  async updateCurrentUser(data: UserUpdateData): Promise<User> {
    return this.apiClient.patch<User>(this.getPath('/me'), data);
  }

  /**
   * Change the current user's password
   * @param currentPassword Current password
   * @param newPassword New password
   * @returns Promise resolving when the password is changed
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.apiClient.post(this.getPath('/me/password'), {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Get all users
   * @param page Page number
   * @param limit Number of users per page
   * @returns Promise resolving to the users data
   */
  async getUsers(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    return this.apiClient.get<{ users: User[]; total: number }>(
      this.getPath(),
      { params: { page, limit } }
    );
  }
}
