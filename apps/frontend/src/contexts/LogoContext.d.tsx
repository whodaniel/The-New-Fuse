import React, { ReactNode } from 'react';
export declare const REFETCH_LOGO_EVENT = "refetch-logo";
interface Logo {
    url: string;
    alt: string;
    width: number;
    height: number;
}
interface LogoContextType {
    logo: Logo;
    setLogo: (logo: Logo) => void;
    loginLogo: string;
    isCustomLogo: boolean;
    resetLogo: () => void;
}
interface LogoProviderProps {
    children: ReactNode;
}
export declare function LogoProvider({ children }: LogoProviderProps): React.JSX.Element;
export declare function useLogo(): LogoContextType;
export {};
