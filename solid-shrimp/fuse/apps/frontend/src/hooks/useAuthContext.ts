import { useContext } from 'react';
import AuthContext, { AuthContextType } from '../AuthContext';

export function useAuth(): any {
  const context = useContext(AuthContext) as AuthContextType;
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    authToken: localStorage.getItem('auth_token'),
    user: context.user,
    unsetUser: () => context.logout(),
  };
}
