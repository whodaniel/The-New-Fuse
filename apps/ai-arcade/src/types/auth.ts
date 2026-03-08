export interface User {
  id: string;
  email: string;
  username: string;
  tokens: number;
  role?: string;
  roles?: string[];
  membershipStatus?: string;
  subscriptionTier?: string;
  federationId?: string;
  identityId?: string;
  subscriptions: Subscription[];
  createdAt: string;
}

export interface Subscription {
  id: string;
  agentId: string;
  agentName: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  paypalSubscriptionId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}
