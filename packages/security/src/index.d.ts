export declare class SecurityService {
    validateApiKey(apiKey: string): Promise<boolean>;
    validateUser(userId: string): Promise<any>;
}
export declare class AuthService {
    login(credentials: any, ...args: any[]): Promise<any>;
    register(userData: any, ...args: any[]): Promise<any>;
    validateToken(token: string): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map