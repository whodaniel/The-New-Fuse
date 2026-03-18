import React from 'react';

export interface LayoutContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const LayoutContext = React.createContext<LayoutContextValue>({
  collapsed: false,
  setCollapsed: () => {},
});

export function LayoutProvider({ children }: { children?: React.ReactNode }) {
  return (
    <LayoutContext.Provider value={{ collapsed: false, setCollapsed: () => {} }}>
      {children}
    </LayoutContext.Provider>
  );
}
