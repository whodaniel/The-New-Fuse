import React from 'react';
import { Session } from '@your-org/security';
interface SessionProviderProps {
    children: React.ReactNode;
    initialSession?: Session;
}
export declare function SessionProvider({ children, initialSession }: SessionProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
