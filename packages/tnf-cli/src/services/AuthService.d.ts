export interface AuthProvider {
    name: string;
    type: 'oauth' | 'api_key' | 'basic';
    configured: boolean;
    authenticated: boolean;
    expiresAt?: string;
}
export interface AuthCredential {
    provider: string;
    type: 'oauth' | 'api_key' | 'basic';
    accessToken?: string;
    apiKey?: string;
    username?: string;
    refreshToken?: string;
    expiresAt?: number;
    scopes?: string[];
}
export declare class AuthService {
    private configDir;
    private credentials;
    constructor(configDir?: string);
    private loadCredentials;
    private saveCredentials;
    listProviders(): AuthProvider[];
    login(provider: string, url?: string): Promise<{
        success: boolean;
        message: string;
        url?: string;
    }>;
    private getEnvKeyForProvider;
    private loginGitHub;
    private loginGoogle;
    private loginOAuth;
    setToken(provider: string, token: string, options?: {
        refreshToken?: string;
        expiresIn?: number;
    }): void;
    setApiKey(provider: string, apiKey: string): void;
    logout(provider: string): boolean;
    getCredential(provider: string): AuthCredential | undefined;
}
//# sourceMappingURL=AuthService.d.ts.map