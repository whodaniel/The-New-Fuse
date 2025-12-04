import React from 'react';
interface PopupContainerProps {
    isMainApp?: boolean;
    initialDarkMode?: boolean;
    onThemeChange?: (dark: boolean) => void;
    containerStyle?: React.CSSProperties;
}
export declare const PopupContainer: React.FC<PopupContainerProps>;
export {};
