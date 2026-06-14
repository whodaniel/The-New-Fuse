import { ConfigService } from '@nestjs/config';
import { PayPalService } from '../../billing/paypal.service';
import { GooseDispatchDto } from './goose.dto';
type GoosePrincipal = {
    id?: string;
    email?: string;
    role?: string;
    roles?: string[];
    permissions?: string[];
};
type GooseAccess = {
    allowed: boolean;
    reason: string;
    isAdmin: boolean;
    membershipActive: boolean;
    tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
};
export declare class GooseService {
    private readonly configService;
    private readonly payPalService;
    private readonly logger;
    private readonly gooseBridge;
    private readonly allowedRoot;
    constructor(configService: ConfigService, payPalService: PayPalService);
    getAccess(principal: GoosePrincipal): Promise<GooseAccess>;
    dispatch(input: GooseDispatchDto, principal: GoosePrincipal): Promise<{
        ok: boolean;
        correlationId: string;
        subAgentPath: string;
        access: GooseAccess;
        run: {
            command: string[];
            exitCode: number | null;
            durationMs: number;
            cwd: string;
        };
        output: {
            stdout: string;
            stderr: string;
        };
        truncated: {
            stdout: boolean;
            stderr: boolean;
        };
        dispatchedAt: string;
    }>;
    private resolveRelayLogLevel;
    private resolveAccess;
    private resolveCwd;
    private maxOutputLength;
    private trimOutput;
}
export {};
//# sourceMappingURL=goose.service.d.ts.map