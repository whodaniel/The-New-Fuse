import type { Request } from 'express';
import { User } from './user.js';

// eslint-disable-next-line no-undef
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthUser extends Omit<User, 'password'> {}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthStore {
  user: User | null;
  authToken: string | null;
}

export interface AuthActions {
  updateUser: (user: User, authToken?: string) => void;
  unsetUser: () => void;
  sendVerificationEmail: () => Promise<void>;
  enable2FA: () => Promise<void>;
  disable2FA: () => Promise<void>;
}

export interface AuthContextType {
  store: AuthStore;
  actions: AuthActions;
}

import { createContext } from 'react';
// Rename React to _React to comply with unused vars rule
import _React from 'react';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
