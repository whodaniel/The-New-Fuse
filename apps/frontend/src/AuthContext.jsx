import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.js';
export const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const token = await user.getIdToken();
                setToken(token);
                localStorage.setItem('auth_token', token);
            }
            else {
                setToken(null);
                localStorage.removeItem('auth_token');
            }
            setIsInitialized(true);
        });
        return () => unsubscribe();
    }, []);
    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!token && !!user,
            token,
            user,
            setToken,
            isLoading: !isInitialized
        }}>
            {children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
