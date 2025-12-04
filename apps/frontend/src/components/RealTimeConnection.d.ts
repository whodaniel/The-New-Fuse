import React from 'react';
interface RealTimeConnectionProps {
    children: React.ReactNode;
    onConnectionChange?: (connected: boolean) => void;
}
export declare function RealTimeConnection({ children, onConnectionChange }: RealTimeConnectionProps): import("react/jsx-runtime").JSX.Element;
export {};
