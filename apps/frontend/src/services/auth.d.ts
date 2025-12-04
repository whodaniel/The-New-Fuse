export declare class AuthService {
    static getUserData(uid: any): Promise<{
        id: any;
        email: any;
        displayName: any;
        photoURL: any;
        createdAt: string;
        updatedAt: string;
        isVerified: any;
        is2FAEnabled: boolean;
    }>;
    static enable2FA(userId: any): Promise<string>;
    static disable2FA(userId: any): Promise<void>;
}
