/**
 * Google OAuth Strategy
 *
 * Handles Google OAuth 2.0 authentication using Passport.
 */
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { PrismaService } from '@the-new-fuse/database';
declare const GoogleStrategy_base: new (...args: any[]) => Strategy;
export declare class GoogleStrategy extends GoogleStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(req: Request, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<any>;
}
export {};
//# sourceMappingURL=google.strategy.d.ts.map