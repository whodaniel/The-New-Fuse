import React, { ReactNode } from 'react';
interface LogoContextType {
    logo: string | null;
    setLogo: (logo: string | null) => void;
    loginLogo: string | null;
    isCustomLogo: boolean;
}
export declare const LogoContext: React.Context<LogoContextType>;
interface LogoProviderProps {
    children: ReactNode;
}
export declare const LogoProvider: React.FC<LogoProviderProps>;
export default LogoContext;
