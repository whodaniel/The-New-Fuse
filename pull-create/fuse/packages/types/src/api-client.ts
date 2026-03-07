import { createContext } from 'react';

export interface ApiClientContextType {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
}

export const ApiClientContext = createContext<ApiClientContextType>({
  baseUrl: 'http://localhost:3000',
  defaultHeaders: {},
});