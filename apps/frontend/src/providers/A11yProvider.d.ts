import React from 'react';
interface A11yContextType {
    highContrast: boolean;
    toggleHighContrast: () => void;
}
export declare function A11yProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useA11y(): A11yContextType;
export {};
