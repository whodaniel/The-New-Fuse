export interface VerificationResponse {
    success: boolean;
    message: string;
    token?: string;
}
export declare class VerificationService {
    private static instance;
    private baseUrl;
    private constructor();
    static getInstance(): VerificationService;
    verifyEmail(token: string): Promise<VerificationResponse>;
    resendVerification(email: string): Promise<VerificationResponse>;
    verify2FA(code: string, token: string): Promise<VerificationResponse>;
}
