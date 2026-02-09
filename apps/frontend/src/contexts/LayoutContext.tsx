import React, { createContext, useState, useContext } from 'react';

interface Layout {
    sidebarOpen: boolean;
}

interface LayoutContextType {
    layout: Layout;
    setLayout: React.Dispatch<React.SetStateAction<Layout>>;
    toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

const defaultLayout: Layout = {
    sidebarOpen: true,
};

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [layout, setLayout] = useState<Layout>(defaultLayout);
    
    const toggleSidebar = () => {
        setLayout((prev) => ({
            ...prev,
            sidebarOpen: !prev.sidebarOpen
        }));
    };

    return (
        <LayoutContext.Provider value={{ layout, setLayout, toggleSidebar }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout(): LayoutContextType {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}