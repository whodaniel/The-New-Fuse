import { UserProfile, Result } from '../../domain/core/types.js';
export interface AuthCredentials {
    email: string;
    password: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private static instance;
    private readonly eventBus;
    private readonly stateManager;
    private readonly logger;
    private constructor();
    static getInstance(): AuthService;
    login(credentials: AuthCredentials): Promise<Result<AuthTokens>>;
    logout(): Promise<Result<void>>;
    register(credentials: AuthCredentials): Promise<Result<AuthTokens>>;
    refreshToken(): Promise<Result<AuthTokens>>;
    private fetchAndSetUserProfile;
    isAuthenticated(): boolean;
    getCurrentUser(): UserProfile | null;
    private setTokens;
    private clearTokens;
    private getAccessToken;
    private getRefreshToken;
    subscribeToAuthState(callback: (user: UserProfile | null) => void): () => void;
}
