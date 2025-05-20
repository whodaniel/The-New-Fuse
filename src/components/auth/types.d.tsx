export interface AuthProps {
  onLogin: (credentials: {
    username: string;
    password: string;
  }) => Promise<void>;
  onLogout: () => Promise<void>;
  isAuthenticated: boolean;
}
