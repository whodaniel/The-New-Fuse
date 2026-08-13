import * as React from 'react';

export interface LayoutContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const LayoutContext = React.createContext<LayoutContextValue | undefined>(undefined);

export interface LayoutProviderProps {
  children?: React.ReactNode;
  defaultCollapsed?: boolean;
}

/**
 * Shared layout state provider migrated from the legacy layout package.
 * Keeps collapsed sidebar state in one place for composed layout UIs.
 */
export function LayoutProvider({ children, defaultCollapsed = false }: LayoutProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((current) => !current);
  }, []);

  const value = React.useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
    }),
    [collapsed, toggleCollapsed]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayoutContext(): LayoutContextValue {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
}
