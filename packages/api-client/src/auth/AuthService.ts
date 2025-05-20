import { ApiClient } from '../client/ApiClient.js';

/**
 * User login credentials
 */
export interface LoginCredentials {
  /**
   * User email
   */
  email: string;
  /**
   * User password
   */
  password: string;
}

/**
 * User registration data
 */
export interface RegisterData {
  /**
   * User email
   */
  email: string;
  /**
   * User password
   */
  password: string;
  /**
   * User name
   */
  name: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  /**
   * Access token
   */
  accessToken: string;
  /**
   * Refresh token
   */
  refreshToken: string;
  /**
   * User data
   */
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Authentication service for managing user authentication
 */
export class AuthService {
  private apiClient: ApiClient;

  /**
   * Create a new authentication service
   * @param apiClient API client
   */
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Login a user
   * @param credentials User login credentials
   * @returns Promise resolving to the authentication response
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>('/auth/login', credentials);
    
    return response;
  }

  /**
   * Register a new user
   * @param data User registration data
   * @returns Promise resolving to the authentication response
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>('/auth/register', data);
    
    return response;
  }

  /**
   * Logout the current user
   * @returns Promise resolving when the user is logged out
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await this.apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Refresh the access token
   * @returns Promise resolving to the new authentication response
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    
    return response;
  }

  /**
   * Get the current user
   * @returns Promise resolving to the current user data
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    return this.apiClient.get<AuthResponse['user']>('/auth/me');
  }

  /**
   * Check if the user is authenticated
   * @returns Promise resolving to true if the user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const accessToken = localStorage.getItem('accessToken');
    return !!accessToken;
  }
}
