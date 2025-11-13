import { MfaService } from './mfa.service';
export declare class MfaController {
    private readonly mfaService;
    constructor(mfaService: MfaService);
    setupMfa(user: any): Promise<{
        secret: string;
        qrCode: void & Promise<string>;
        message: string;
    }>;
    enableMfa(user: any, token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    disableMfa(user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getMfaStatus(user: any): Promise<{
        enabled: boolean;
    }>;
    verifyMfa(user: any, token: string): Promise<{
        valid: boolean;
    }>;
}
//# sourceMappingURL=mfa.controller.d.ts.map