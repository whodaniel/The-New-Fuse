import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@the-new-fuse/hooks/src/useAuth'; // Corrected import path

// Create the context
const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(undefined);

// Export the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Export a hook to use the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
