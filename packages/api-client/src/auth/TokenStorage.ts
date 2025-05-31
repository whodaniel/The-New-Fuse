// Minimal TokenStorage interface for type safety
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(access: string, refresh: string): Promise<void>;
  clearTokens(): Promise<void>;
}

// Dummy export to ensure TokenStorage is available as a named export at runtime
export const TokenStorage = {};
