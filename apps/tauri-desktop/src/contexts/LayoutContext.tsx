import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface LayoutContextType {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
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
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive breakpoints
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
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
        isMobile,
        toggleSidebar,
        collapseSidebar,
        expandSidebar,
        setSidebarOpen,
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
