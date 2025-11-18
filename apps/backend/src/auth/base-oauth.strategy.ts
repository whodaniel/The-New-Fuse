import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyCallback } from 'passport-oauth2';

/**
 * Base class for OAuth strategies (Google, GitHub, etc.)
 * Extracts common validation logic to reduce code duplication
 */
export abstract class BaseOAuthStrategy {
  constructor(
    protected configService: ConfigService,
    protected prisma: PrismaService,
  ) {}

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
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, displayName, username, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(
        new Error(`No email found from ${this.getProviderName()}. Please make your email public in ${this.getProviderName()} settings.`),
        null,
      );
    }

    try {
      const providerIdField = this.getProviderIdField();

      // Try to find user by provider ID first
      let user = await this.prisma.user.findUnique({
        where: { [providerIdField]: id },
      });

      if (!user) {
        // Check if user exists with this email
        user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link provider account to existing user
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              [providerIdField]: id,
              picture: photos?.[0]?.value,
              emailVerified: new Date(), // OAuth providers verify emails
            },
          });
        } else {
          // Create new user with provider account
          user = await this.prisma.user.create({
            data: {
              email,
              name: displayName || username || email.split('@')[0],
              [providerIdField]: id,
              picture: photos?.[0]?.value,
              emailVerified: new Date(),
              role: 'USER',
            },
          });
        }
      } else {
        // Update profile picture
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            picture: photos?.[0]?.value,
          },
        });
      }

      done(null, user);
    } catch (error) {
      done(error as Error, null);
    }
  }
}
