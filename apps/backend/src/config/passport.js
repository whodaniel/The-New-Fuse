"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists
        let user = await prisma.user.findFirst({
            where: {
                email: profile.emails[0].value
            }
        });
        // If user doesn't exist, create new user
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    googleId: profile.id,
                    avatar: profile.photos?.[0]?.value,
                    emailVerified: true, // Since Google has verified the email
                    password: null // This is now optional in our schema
                }
            });
        }
        else if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: profile.id,
                    avatar: profile.photos?.[0]?.value || user.avatar,
                    emailVerified: true
                }
            });
        }
        return done(null, user);
    }
    catch (error) {
        console.error('Error in Google auth callback:', error);
        return done(error, undefined);
    }
}));
//# sourceMappingURL=passport.js.map