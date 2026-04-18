import { useContext } from 'react';
import { AuthContext } from './types/index.js';

export const useAuth = (): any => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};