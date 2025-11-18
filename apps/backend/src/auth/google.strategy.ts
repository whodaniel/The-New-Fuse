import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BaseOAuthStrategy } from './base-oauth.strategy';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private baseStrategy: BaseOAuthStrategy;

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

    this.baseStrategy = new (class extends BaseOAuthStrategy {
      protected getProviderIdField(): 'googleId' {
        return 'googleId';
      }

      protected getProviderName(): string {
        return 'Google';
      }
    })(configService, prisma);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    return this.baseStrategy.validateOAuthUser(profile, accessToken, refreshToken, done);
  }
}
