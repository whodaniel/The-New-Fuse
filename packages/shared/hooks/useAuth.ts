import { useContext } from 'react';
import { AuthContext } from '../providers/AuthProvider.js';
import { AuthContextType } from '../types/auth.js';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    isAuthenticated: context.isAuthenticated,
    isInitialized: context.isInitialized,
    token: context.token,
    user: context.user,
    setToken: context.setToken,
    signIn: context.signIn,
    signOut: context.signOut,
    signUp: context.signUp
  };
};