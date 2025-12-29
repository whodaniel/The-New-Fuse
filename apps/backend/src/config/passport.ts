import { drizzleUserRepository } from '@the-new-fuse/database';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await drizzleUserRepository.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await drizzleUserRepository.findByEmail(profile.emails![0].value);

        // If user doesn't exist, create new user
        if (!user) {
          user = await drizzleUserRepository.create({
            email: profile.emails![0].value,
            name: profile.displayName,
            hashedPassword: '', // Empty password for OAuth users
            emailVerified: true, // Since Google has verified the email
          });
        } else {
          // Update user to link Google account if not already linked
          user =
            (await drizzleUserRepository.update(user.id, {
              emailVerified: true,
            })) || user;
        }

        return done(null, user);
      } catch (error) {
        console.error('Error in Google auth callback:', error);
        return done(error as Error, undefined);
      }
    }
  )
);
