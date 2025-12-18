import React, { ReactNode, createContext, useContext, useState } from 'react';

interface RouteContextType {
  currentRoute: string;
  params: Record<string, string>;
  navigate: (route: string, params?: Record<string, string>) => void;
  goBack: () => void;
  history: string[];
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};

interface RouteProviderProps {
  children: ReactNode;
  initialRoute?: string;
}

export const RouteProvider: React.FC<RouteProviderProps> = ({
  children,
  initialRoute = '/dashboard',
}) => {
  const [currentRoute, setCurrentRoute] = useState(initialRoute);
  const [params, setParams] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<string[]>([initialRoute]);

  const navigate = (route: string, newParams: Record<string, string> = {}) => {
    setCurrentRoute(route);
    setParams(newParams);
    setHistory((prev) => [...prev, route]);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousRoute = newHistory[newHistory.length - 1];
      setCurrentRoute(previousRoute);
      setHistory(newHistory);
    }
  };

  return (
    <RouteContext.Provider value={{ currentRoute, params, navigate, goBack, history }}>
      {children}
    </RouteContext.Provider>
  );
};

export default RouteProvider;
