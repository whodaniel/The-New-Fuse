import React, { createContext, ReactNode, useState } from 'react';

interface LogoContextType {
  logo: string | null;
  setLogo: (logo: string | null) => void;
  loginLogo: string | null;
  isCustomLogo: boolean;
}

export const LogoContext = createContext<LogoContextType>({
  logo: null,
  setLogo: () => {},
  loginLogo: null,
  isCustomLogo: false,
});

interface LogoProviderProps {
  children: ReactNode;
}

export const LogoProvider: React.FC<LogoProviderProps> = ({ children }) => {
  const [logo, setLogo] = useState<string | null>(null);
  const [loginLogo] = useState<string | null>(null);
  const [isCustomLogo] = useState<boolean>(false);

  const contextValue = {
    logo,
    setLogo,
    loginLogo,
    isCustomLogo,
  };

  return <LogoContext.Provider value={contextValue}>{children}</LogoContext.Provider>;
};

export default LogoContext;
