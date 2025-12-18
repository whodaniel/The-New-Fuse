import React, { ReactNode, createContext, useContext, useState } from 'react';

interface LayoutContextType {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  currentPanel: string | null;
  openPanel: (panelId: string) => void;
  closePanel: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<string | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const collapseSidebar = () => {
    setSidebarCollapsed(true);
  };

  const expandSidebar = () => {
    setSidebarCollapsed(false);
  };

  const openPanel = (panelId: string) => {
    setCurrentPanel(panelId);
  };

  const closePanel = () => {
    setCurrentPanel(null);
  };

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        sidebarCollapsed,
        toggleSidebar,
        collapseSidebar,
        expandSidebar,
        currentPanel,
        openPanel,
        closePanel,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export default LayoutProvider;
