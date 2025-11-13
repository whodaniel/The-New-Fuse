import React from 'react';
import { UseAuthResult } from '@the-new-fuse/hooks';
/**
 * Authentication provider props
 */
export interface AuthProviderProps {
    /**
     * Children
     */
    children: React.ReactNode;
}
/**
 * Hook to access the authentication context
 * @returns Authentication context value
 */
export declare function useAuthContext(): UseAuthResult;
/**
 * Authentication provider component
 */
declare const AuthProvider: React.FC<AuthProviderProps>;
export { AuthProvider };
//# sourceMappingURL=AuthProvider.d.ts.map