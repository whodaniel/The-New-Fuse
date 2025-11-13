export declare class SecurityService {
    validateApiKey(apiKey: string): Promise<boolean>;
    validateUser(userId: string): Promise<any>;
}
export declare class AuthService {
    login(credentials: any): Promise<any>;
    register(userData: any): Promise<any>;
    validateToken(token: string): Promise<any>;
}
//# sourceMappingURL=index.minimal.d.ts.map