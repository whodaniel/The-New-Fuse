import React, { createContext, useContext } from 'react';

const ComputerUseEmbedContext = createContext(false);

export const ComputerUseEmbedProvider: React.FC<{
  value: boolean;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <ComputerUseEmbedContext.Provider value={value}>{children}</ComputerUseEmbedContext.Provider>
);

export function useComputerUseEmbed(): boolean {
  return useContext(ComputerUseEmbedContext);
}

export default ComputerUseEmbedContext;
