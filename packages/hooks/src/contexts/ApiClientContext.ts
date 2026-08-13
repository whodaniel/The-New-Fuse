import { createContext } from "react";

export interface ApiClientContextType {
  client: any;
}

export const ApiClientContext = createContext<ApiClientContextType | null>(null);
