"use strict";
/**
 * GitHub OAuth Strategy
 *
 * Handles GitHub OAuth 2.0 authentication using Passport.
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
exports.GitHubStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_github2_1 = require("passport-github2");
const database_1 = require("@the-new-fuse/database");
let GitHubStrategy = class GitHubStrategy extends (0, passport_1.PassportStrategy)(passport_github2_1.Strategy, 'github') {
    prisma;
    constructor(prisma) {
        const clientID = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        if (!clientID || !clientSecret) {
            throw new Error('GitHub client ID and secret must be provided');
        }
        super({
            clientID,
            clientSecret,
            callbackURL: `${process.env.API_URL || 'http://localhost:3001'}/auth/github/callback`,
            scope: ['user:email'],
            passReqToCallback: true,
        });
        this.prisma = prisma;
    }
    async validate(req, accessToken, refreshToken, profile, done) {
        const { id, emails, displayName, username, photos } = profile;
        // GitHub might not provide email if user hasn't made it public
        const email = emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email found from GitHub'), false);
        }
        try {
            // Try to find user by GitHub ID first
            let user = await this.prisma.user.findUnique({
                where: { githubId: id },
            });
            if (!user) {
                // Check if user exists with this email
                user = await this.prisma.user.findUnique({
                    where: { email },
                });
                if (user) {
                    // Link GitHub account to existing user
                    user = await this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            githubId: id,
                            avatarUrl: photos?.[0]?.value,
                            emailVerified: true, // GitHub verifies emails
                            lastLogin: new Date(),
                        },
                    });
                }
                else {
                    // Create new user with GitHub account
                    user = await this.prisma.user.create({
                        data: {
                            email,
                            name: displayName || username || email.split('@')[0],
                            githubId: id,
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
exports.GitHubStrategy = GitHubStrategy;
exports.GitHubStrategy = GitHubStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object])
], GitHubStrategy);
//# sourceMappingURL=github.strategy.js.map