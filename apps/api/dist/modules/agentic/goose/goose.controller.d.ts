import type { Request } from 'express';
import { GooseDispatchDto } from './goose.dto';
import { GooseService } from './goose.service';
type GooseRequest = Request & {
    user?: {
        id?: string;
        email?: string;
        role?: string;
        roles?: string[];
        permissions?: string[];
    };
};
export declare class GooseController {
    private readonly gooseService;
    constructor(gooseService: GooseService);
    getAccess(req: GooseRequest): Promise<{
        allowed: boolean;
        reason: string;
        isAdmin: boolean;
        membershipActive: boolean;
        tier: "STARTER" | "PRO" | "ENTERPRISE";
    }>;
    dispatch(body: GooseDispatchDto, req: GooseRequest): Promise<{
        ok: boolean;
        correlationId: string;
        subAgentPath: string;
        access: {
            allowed: boolean;
            reason: string;
            isAdmin: boolean;
            membershipActive: boolean;
            tier: "STARTER" | "PRO" | "ENTERPRISE";
        };
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
}
export {};
//# sourceMappingURL=goose.controller.d.ts.map