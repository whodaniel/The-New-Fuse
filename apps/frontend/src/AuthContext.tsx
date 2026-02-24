import { createContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles?: string[];
  agencyId?: string;
  tenantId?: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    emailOrToken: string,
    password?: string,
    options?: { cfTurnstileToken?: string }
  ) => Promise<any>;
  register: (
    name: string,
    email: string,
    password: string,
    options?: { cfTurnstileToken?: string }
  ) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<any>;
  handleSSOCallback: (provider: string, code: string, state?: string | null) => Promise<any>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
