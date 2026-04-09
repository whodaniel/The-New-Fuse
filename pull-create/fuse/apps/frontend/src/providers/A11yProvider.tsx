import React, { createContext, useContext, useState } from 'react';

interface A11yContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  // Add other accessibility features as needed
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);

  const toggleHighContrast = () => {
    setHighContrast((prev: any) => !prev);
  };

  const value = {
    highContrast,
    toggleHighContrast,
  };

  return (
    <A11yContext.Provider value={value}>
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (context === undefined) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
}