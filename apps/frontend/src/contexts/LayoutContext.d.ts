import React from 'react';
interface Layout {
    sidebarOpen: boolean;
}
interface LayoutContextType {
    layout: Layout;
    setLayout: React.Dispatch<React.SetStateAction<Layout>>;
    toggleSidebar: () => void;
}
export declare function LayoutProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useLayout(): LayoutContextType;
export {};
