import { EventEmitter } from 'events';
interface AuthSession {
    id: string;
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    deviceInfo: {
        ip: string;
        userAgent: string;
        deviceId?: string;
    };
}
export declare class AuthenticationService extends EventEmitter {
    private readonly logger;
    private sessions;
    private loginAttempts;
    login(username: string, password: string, deviceInfo: any): Promise<AuthSession | null>;
    logout(sessionId: string): Promise<boolean>;
    validateSession(sessionId: string): Promise<AuthSession | null>;
}
export {};
//# sourceMappingURL=AuthenticationService.d.ts.map