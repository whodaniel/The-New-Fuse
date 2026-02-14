import { config, isFirebaseConfigured } from '../config';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth';

const TOKEN_KEY = 'ai_arcade_token';
const USER_KEY = 'ai_arcade_user';

// Firebase types (lazy loaded)
let firebaseApp: any = null;
let firebaseAuth: any = null;

export class AuthService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl || config.apiUrl;
  }

  private getStorage(): Storage | null {
    if (typeof window !== 'undefined') {
      return window.localStorage;
    }
    return null;
  }

  // Initialize Firebase if configured
  private async initializeFirebase() {
    if (!isFirebaseConfigured()) return null;

    if (!firebaseApp) {
      try {
        const { initializeApp } = await import('firebase/app');
        const {
          getAuth,
          signInWithEmailAndPassword,
          createUserWithEmailAndPassword,
          signOut,
          onAuthStateChanged,
        } = await import('firebase/auth');

        firebaseApp = initializeApp(config.firebase);
        firebaseAuth = getAuth(firebaseApp);
        return {
          auth: firebaseAuth,
          signInWithEmailAndPassword,
          createUserWithEmailAndPassword,
          signOut,
          onAuthStateChanged,
        };
      } catch (error) {
        console.warn('Firebase not available, falling back to mock auth:', error);
        return null;
      }
    }
    return {
      auth: firebaseAuth,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      onAuthStateChanged,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Try Firebase first if configured
    const firebase = await this.initializeFirebase();

    if (firebase) {
      try {
        const userCredential = await firebase.signInWithEmailAndPassword(
          firebase.auth,
          credentials.email,
          credentials.password
        );

        const token = await userCredential.user.getIdToken();
        const user = this.firebaseUserToUser(userCredential.user);

        this.setSession(token, user);
        return { success: true, user, token };
      } catch (error: any) {
        console.error('Firebase login error:', error);
        return {
          success: false,
          message: this.getFirebaseErrorMessage(error.code),
        };
      }
    }

    // Fallback to API login
    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.setSession(data.token, data.user);
        return { success: true, user: data.user, token: data.token };
      }

      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      // For demo purposes, allow mock login
      return this.mockLogin(credentials);
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // Try Firebase first if configured
    const firebase = await this.initializeFirebase();

    if (firebase) {
      try {
        const userCredential = await firebase.createUserWithEmailAndPassword(
          firebase.auth,
          credentials.email,
          credentials.password
        );

        const token = await userCredential.user.getIdToken();
        const user = this.firebaseUserToUser(userCredential.user, credentials.username);

        this.setSession(token, user);
        return { success: true, user, token };
      } catch (error: any) {
        console.error('Firebase register error:', error);
        return {
          success: false,
          message: this.getFirebaseErrorMessage(error.code),
        };
      }
    }

    // Fallback to API registration
    try {
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.setSession(data.token, data.user);
        return { success: true, user: data.user, token: data.token };
      }

      return { success: false, message: data.message || 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      // For demo purposes, allow mock registration
      return this.mockRegister(credentials);
    }
  }

  async logout(): Promise<void> {
    const firebase = await this.initializeFirebase();

    if (firebase && firebase.auth) {
      try {
        await firebase.signOut(firebase.auth);
      } catch (error) {
        console.error('Firebase logout error:', error);
      }
    }

    try {
      await fetch(`${this.apiUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const storage = this.getStorage();
    if (!storage) return null;

    const cachedUser = storage.getItem(USER_KEY);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.apiUrl}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          storage.setItem(USER_KEY, JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch (error) {
      console.error('Get current user error:', error);
    }

    return null;
  }

  async updateTokens(amount: number): Promise<User | null> {
    try {
      const response = await fetch(`${this.apiUrl}/user/tokens`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const storage = this.getStorage();
          if (storage) {
            storage.setItem(USER_KEY, JSON.stringify(data.user));
          }
          return data.user;
        }
      }
    } catch (error) {
      console.error('Update tokens error:', error);
    }
    return null;
  }

  getToken(): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(TOKEN_KEY) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private firebaseUserToUser(firebaseUser: any, username?: string): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      username: username || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      tokens: 500, // Default starting tokens
      subscriptions: [],
      createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
    };
  }

  private getFirebaseErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    };
    return messages[code] || 'Authentication failed. Please try again.';
  }

  private setSession(token: string, user: User): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  private clearSession(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Mock methods for demo/development
  private mockLogin(credentials: LoginCredentials): AuthResponse {
    const mockUser: User = {
      id: 'mock-user-' + Date.now(),
      email: credentials.email,
      username: credentials.email.split('@')[0],
      tokens: 1000,
      subscriptions: [],
      createdAt: new Date().toISOString(),
    };

    const mockToken = 'mock-token-' + Date.now();
    this.setSession(mockToken, mockUser);

    return { success: true, user: mockUser, token: mockToken };
  }

  private mockRegister(credentials: RegisterCredentials): AuthResponse {
    const mockUser: User = {
      id: 'mock-user-' + Date.now(),
      email: credentials.email,
      username: credentials.username,
      tokens: 500, // Starting tokens for new users
      subscriptions: [],
      createdAt: new Date().toISOString(),
    };

    const mockToken = 'mock-token-' + Date.now();
    this.setSession(mockToken, mockUser);

    return { success: true, user: mockUser, token: mockToken };
  }
}
