import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RouteContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState('Dashboard');

  return (
    <RouteContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
}
