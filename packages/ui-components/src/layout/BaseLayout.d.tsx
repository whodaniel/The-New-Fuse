import React from 'react';
interface BaseLayoutProps {
    children: React.ReactNode;
    className?: string;
    showSidebar?: boolean;
    showHeader?: boolean;
}
export declare const BaseLayout: React.FC<BaseLayoutProps>;
export {};
