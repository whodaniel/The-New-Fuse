import { ApiClient } from '../client/ApiClient.js';
import { BaseService } from './BaseService.js';

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
export class AuthService extends BaseService {
  /**
   * Create a new authentication service
   * @param api API client instance
   */
  constructor(api: ApiClient) {
    super(api, '/auth');
  }

  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with login response containing auth tokens and user data
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    this.validateRequired({ email, password }, ['email', 'password']);
    return this.post<AuthResponse>('/login', { email, password });
  }

  /**
   * Register a new user
   * @param name User name
   * @param email User email
   * @param password User password
   * @returns Promise with registration response containing auth tokens and user data
   */
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    this.validateRequired({ name, email, password }, ['name', 'email', 'password']);
    return this.post<AuthResponse>('/register', { name, email, password });
  }

  /**
   * Logout the current user
   * @returns Promise with logout response
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>('/logout');
  }

  /**
   * Request a password reset
   * @param email User email
   * @returns Promise with password reset response
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    this.validateRequired({ email }, ['email']);
    return this.post<{ success: boolean; message: string }>('/forgot-password', { email });
  }

  /**
   * Reset password with token
   * @param token Reset token
   * @param password New password
   * @returns Promise with password reset response
   */
  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    this.validateRequired({ token, password }, ['token', 'password']);
    return this.post<{ success: boolean; message: string }>('/reset-password', { token, password });
  }

  /**
   * Verify email with token
   * @param token Verification token
   * @returns Promise with email verification response
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    this.validateRequired({ token }, ['token']);
    return this.post<{ success: boolean; message: string }>('/verify-email', { token });
  }

  /**
   * Refresh the authentication token
   * @returns Promise with new token
   */
  async refreshToken(): Promise<string> {
    const response = await this.post<{ token: string }>('/refresh-token');
    return response.token || '';
  }

  /**
   * Get the current user
   * @returns Promise with current user data
   */
  async getCurrentUser(): Promise<UserData> {
    return this.get<UserData>('/me');
  }
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
export function createAuthService(api: ApiClient): AuthService {
  return new AuthService(api);
}
