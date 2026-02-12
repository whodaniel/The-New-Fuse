import { AuthService, LoginCredentials, RegisterData } from '../mocks/api-client';
/**
 * Authentication hook result
 */
export interface UseAuthResult {
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  /**
   * Whether authentication is being checked
   */
  isLoading: boolean;
  /**
   * Authentication error
   */
  error: Error | null;
  /**
   * Current user data
   */
  user: any | null;
  /**
   * Login function
   */
  login: (credentials: LoginCredentials) => Promise<void>;
  /**
   * Register function
   */
  register: (data: RegisterData) => Promise<void>;
  /**
   * Logout function
   */
  logout: () => Promise<void>;
}
/**
 * Authentication hook options
 */
export interface UseAuthOptions {
  /**
   * Authentication service
   */
  authService: AuthService;
  /**
   * Whether to check authentication on mount
   * @default true
   */
  checkOnMount?: boolean;
}
/**
 * Hook for authentication
 * @param options Authentication hook options
 * @returns Authentication hook result
 *
 * @example
 * // Create auth service
 * const authService = new AuthService(apiClient, tokenStorage);
 *
 * // Use auth hook
 * const { isAuthenticated, isLoading, user, login, logout } = useAuth({ authService });
 *
 * // Login
 * const handleLogin = async (email, password) => {
 *   try {
 *     await login({ email, password });
 *     // Redirect to dashboard
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export declare function useAuth(options: UseAuthOptions): UseAuthResult;
//# sourceMappingURL=useAuth.d.ts.map
