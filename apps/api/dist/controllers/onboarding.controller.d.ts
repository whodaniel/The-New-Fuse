import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
type OnboardingStartDto = {
    inviteCode?: string;
    onboardingToken?: string;
};
export declare class OnboardingController {
    private readonly authService;
    private readonly configService;
    constructor(authService: AuthService, configService: ConfigService);
    start(body: OnboardingStartDto, req: Request): Promise<{
        success: boolean;
        userType: "ai_agent" | "human";
        sessionId: string;
        inviteOnly: boolean;
        access: {
            inviteValidated: boolean;
            inviteSource: "db" | "env" | null;
            tokenValidated: boolean;
        };
    }>;
    private detectUserType;
    private validateOnboardingToken;
    private pickFirst;
    private headerValue;
    private queryValue;
}
export {};
//# sourceMappingURL=onboarding.controller.d.ts.map