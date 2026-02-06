import { createContext, ReactNode, useContext, useState } from 'react';

interface RouteContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

interface RouteProviderProps {
  children: ReactNode;
}

export function RouteProvider({ children }: RouteProviderProps) {
  const [pageTitle, setPageTitle] = useState('Dashboard');

  return (
    <RouteContext.Provider value={{ pageTitle, setPageTitle }}>{children}</RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
}
