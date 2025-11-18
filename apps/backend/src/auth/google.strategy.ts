import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') ||
        `${configService.get<string>('API_URL')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('No email found from Google'), null);
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
              picture: photos?.[0]?.value,
              emailVerified: new Date(), // Google verifies emails
            },
          });
        } else {
          // Create new user with Google account
          user = await this.prisma.user.create({
            data: {
              email,
              name: displayName || email.split('@')[0],
              googleId: id,
              picture: photos?.[0]?.value,
              emailVerified: new Date(),
              role: 'USER',
            },
          });
        }
      } else {
        // Update last login timestamp
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
