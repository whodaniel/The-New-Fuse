export declare class VerificationService {
    constructor();
    static getInstance(): any;
    verifyEmail(token: any): Promise<any>;
    resendVerification(email: any): Promise<any>;
    verify2FA(code: any, token: any): Promise<any>;
}
