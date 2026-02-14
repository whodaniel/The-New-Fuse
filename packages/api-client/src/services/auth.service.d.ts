import { ApiClient } from '../client/ApiClient';
import { BaseService } from './BaseService';
/**
 * Authentication response interface
 */
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: UserData;
}
/**
 * User data interface
 */
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
/**
 * Authentication service for user management
 */
export declare class AuthService extends BaseService {
  /**
   * Create a new authentication service
   * @param api API client instance
   */
  constructor(api: ApiClient);
  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with login response containing auth tokens and user data
   */
  login(email: string, password: string): Promise<AuthResponse>;
  /**
   * Register a new user
   * @param name User name
   * @param email User email
   * @param password User password
   * @returns Promise with registration response containing auth tokens and user data
   */
  register(name: string, email: string, password: string): Promise<AuthResponse>;
  /**
   * Logout the current user
   * @returns Promise with logout response
   */
  logout(): Promise<{
    success: boolean;
    message: string;
  }>;
  /**
   * Request a password reset
   * @param email User email
   * @returns Promise with password reset response
   */
  forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
  }>;
  /**
   * Reset password with token
   * @param token Reset token
   * @param password New password
   * @returns Promise with password reset response
   */
  resetPassword(
    token: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  /**
   * Verify email with token
   * @param token Verification token
   * @returns Promise with email verification response
   */
  verifyEmail(token: string): Promise<{
    success: boolean;
    message: string;
  }>;
  /**
   * Refresh the authentication token
   * @returns Promise with new token
   */
  refreshToken(): Promise<string>;
  /**
   * Get the current user
   * @returns Promise with current user data
   */
  getCurrentUser(): Promise<UserData>;
}
/**
 * Create a new authentication service
 * @param api API client instance
 * @returns Authentication service instance
 *
 * @example
 * ```typescript
 * import { createApiClient, createAuthService } from '@the-new-fuse/api-client';
 *
 * // Create a new API client
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 * });
 *
 * // Create auth service
 * const authService = createAuthService(api);
 *
 * // Login
 * const authResponse = await authService.login('user@example.com', 'password');
 * console.log(`Logged in as ${authResponse.user.name}`);
 * ```
 */
export declare function createAuthService(api: ApiClient): AuthService;
//# sourceMappingURL=auth.service.d.ts.map
