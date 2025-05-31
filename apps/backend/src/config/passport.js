import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
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
passport.use(new GoogleStrategy({
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
