import { ConfigService } from '@nestjs/config';
import { drizzleUserRepository } from '@the-new-fuse/database/drizzle';
import { VerifyCallback } from 'passport-oauth2';

/**
 * Base class for OAuth strategies (Google, GitHub, etc.)
 * Extracts common validation logic to reduce code duplication
 */
export abstract class BaseOAuthStrategy {
  constructor(protected configService: ConfigService) {}

  /**
   * Returns the provider-specific ID field name (e.g., 'googleId', 'githubId')
   */
  protected abstract getProviderIdField(): 'googleId' | 'githubId';

  /**
   * Returns the provider name for error messages (e.g., 'Google', 'GitHub')
   */
  protected abstract getProviderName(): string;

  /**
   * Validates OAuth user and handles user creation/linking
   * Common validation logic shared across all OAuth providers
   */
  async validateOAuthUser(
    profile: any,
    accessToken: string,
    refreshToken: string,
    done: VerifyCallback
  ): Promise<void> {
    const { id, emails, displayName, username, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(
        new Error(
          `No email found from ${this.getProviderName()}. Please make your email public in ${this.getProviderName()} settings.`
        ),
        null
      );
    }

    try {
      // Find user by email
      let user = await drizzleUserRepository.findByEmail(email);

      if (user) {
        // User exists, we can update basic info if needed
        // Note: provider IDs and picture fields are currently not in schema
        // We ensure email is verified since it came from OAuth provider
        if (!user.emailVerified) {
          await drizzleUserRepository.verifyEmail(user.id);
          user.emailVerified = true;
        }
      } else {
        // Create new user
        // Note: We don't have googleId in schema, so we rely on email
        user = await drizzleUserRepository.create({
          email,
          name: displayName || username || email.split('@')[0],
          hashedPassword: '', // No password for OAuth users
          emailVerified: true,
          role: 'USER',
          isActive: true,
        });
      }

      done(null, user);
    } catch (error) {
      done(error as Error, null);
    }
  }
}
