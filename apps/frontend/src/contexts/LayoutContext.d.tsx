import React, { ReactNode } from 'react';
interface Layout {
    sidebarOpen: boolean;
}
interface LayoutContextType {
    layout: Layout;
    setLayout: React.Dispatch<React.SetStateAction<Layout>>;
    toggleSidebar: () => void;
}
interface LayoutProviderProps {
    children: ReactNode;
}
export declare function LayoutProvider({ children }: LayoutProviderProps): React.JSX.Element;
export declare function useLayout(): LayoutContextType;
export {};
