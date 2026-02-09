import { createContext } from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
}

export const AuthContext = createContext<AuthContextType | null>(null);
