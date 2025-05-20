import { AuthResponse, AuthUser } from "@the-new-fuse/types";
import type { AuthState } from "@the-new-fuse/types";
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}
export interface UseAuthReturn extends AuthState {
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (
    email: string,
    code?: string,
    newPassword?: string,
  ) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  setup2FA: () => Promise<{
    secret: string;
    qrCode: string;
  }>;
  updateProfile: (data: Partial<AuthUser>) => Promise<AuthUser>;
  refreshSession: () => Promise<void>;
}
export declare const useAuth: () => UseAuthReturn;
export {};
