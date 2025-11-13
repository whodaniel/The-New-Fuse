/**
 * GitHub OAuth Strategy
 *
 * Handles GitHub OAuth 2.0 authentication using Passport.
 */
import { Strategy, Profile } from 'passport-github2';
import { PrismaService } from '@the-new-fuse/database';
declare const GitHubStrategy_base: new (...args: any[]) => Strategy;
export declare class GitHubStrategy extends GitHubStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(req: Request, accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any, info?: any) => void): Promise<any>;
}
export {};
//# sourceMappingURL=github.strategy.d.ts.map