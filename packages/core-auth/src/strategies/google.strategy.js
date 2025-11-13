"use strict";
/**
 * Google OAuth Strategy
 *
 * Handles Google OAuth 2.0 authentication using Passport.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const database_1 = require("@the-new-fuse/database");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, 'google') {
    prisma;
    constructor(prisma) {
        const clientID = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientID || !clientSecret) {
            throw new Error('Google client ID and secret must be provided');
        }
        super({
            clientID,
            clientSecret,
            callbackURL: `${process.env.API_URL || 'http://localhost:3001'}/auth/google/callback`,
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });
        this.prisma = prisma;
    }
    async validate(req, accessToken, refreshToken, profile, done) {
        const { id, emails, displayName, photos } = profile;
        const email = emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email found from Google'), false);
        }
        try {
            // Try to find user by Google ID first
            let user = await this.prisma.user.findUnique({
                where: { googleId: id },
            });
            if (!user) {
                // Check if user exists with this email
                user = await this.prisma.user.findUnique({
                    where: { email },
                });
                if (user) {
                    // Link Google account to existing user
                    user = await this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            googleId: id,
                            avatarUrl: photos?.[0]?.value,
                            emailVerified: true, // Google verifies emails
                            lastLogin: new Date(),
                        },
                    });
                }
                else {
                    // Create new user with Google account
                    user = await this.prisma.user.create({
                        data: {
                            email,
                            name: displayName,
                            googleId: id,
                            avatarUrl: photos?.[0]?.value,
                            emailVerified: true,
                            passwordHash: '', // OAuth users don't need password
                            isActive: true,
                            lastLogin: new Date(),
                        },
                    });
                }
            }
            else {
                // Update last login
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                });
            }
            done(null, user);
        }
        catch (error) {
            done(error, false);
        }
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object])
], GoogleStrategy);
//# sourceMappingURL=google.strategy.js.map