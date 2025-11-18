import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyCallback } from 'passport-oauth2';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') ||
        `${configService.get<string>('API_URL')}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, username, photos } = profile;

    // GitHub might not provide email if user hasn't made it public
    const email = emails?.[0]?.value;

    if (!email) {
      return done(
        new Error('No public email found from GitHub. Please make your email public in GitHub settings.'),
        null
      );
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
              picture: photos?.[0]?.value,
              emailVerified: new Date(), // GitHub verifies emails
            },
          });
        } else {
          // Create new user with GitHub account
          user = await this.prisma.user.create({
            data: {
              email,
              name: displayName || username || email.split('@')[0],
              githubId: id,
              picture: photos?.[0]?.value,
              emailVerified: new Date(),
              role: 'USER',
            },
          });
        }
      } else {
        // Update last login timestamp and avatar
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
