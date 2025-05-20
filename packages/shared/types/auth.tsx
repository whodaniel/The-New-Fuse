import { User } from 'firebase/auth';

export interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}