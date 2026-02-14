export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(access: string, refresh: string): Promise<void>;
  clearTokens(): Promise<void>;
}
export declare const TokenStorage: {};
//# sourceMappingURL=TokenStorage.d.ts.map
